/**
 * WebAuthn PRF wrap/unwrap primitives — pure crypto layer.
 *
 * Phase 2 Feature A (#9 Quick Unlock) ships an identical derivation + wrap
 * inside `packages/core/app/scripts/comp/passkey/passkey-unlock.ts`. That
 * is the user-facing glue (open-view integration, FileInfoModel descriptor
 * persistence, legacy-blob migration). This file is **not** a replacement —
 * it is the extracted, reusable primitive that Phase 3 #25 (per-field
 * encryption) and Phase 3+ #39 (per-URL Quick Autofill cache) need to share
 * with that glue so all three features stay on one HKDF + AES-GCM spec.
 *
 * Why this lives in `@neokeeweb/db`:
 *   - It is pure crypto, no DOM, no views, no models.
 *   - `packages/core` already depends on `@neokeeweb/db` (webpack alias
 *     `kdbxweb -> packages/db/dist/kdbxweb.js`), so importing from here
 *     does not introduce a new dependency edge.
 *   - Phase 3 features will use **different salt namespaces** against the
 *     same PRF output (see design doc §12). Having one primitive with
 *     caller-supplied `(salt, info)` prevents drift across features.
 *
 * Scope (intentionally narrow):
 *   - `hkdfSha256(ikm, salt, info, length)` — RFC 5869 extract+expand.
 *   - `aesGcmWrap(plaintext, key, aad?)` — 12-byte IV prepended to output.
 *   - `aesGcmUnwrap(blob, key, aad?)` — inverse; throws on tamper/wrong-key.
 *
 * Out of scope (deliberately NOT here):
 *   - WebAuthn ceremony (belongs to core, uses `navigator.credentials`).
 *   - Persistence of `credentialId` / `prfSalt` / `wrappedKey` (lives on
 *     FileInfoModel in core; no parallel IndexedDB envelope is needed —
 *     the Option A design doc §5 explicitly prefers the existing path).
 *   - `KdbxCredentials` construction (caller feeds recovered plaintext
 *     to `ProtectedValue.fromString` and then to `Credentials(...)` via
 *     the normal password-open flow).
 *
 * Security notes:
 *   - HKDF is used for **domain separation**, not because the PRF output
 *     is low-entropy (it is uniform-random 32 bytes). The caller MUST
 *     supply a `salt` that binds the output to its usage context (e.g.
 *     `fileId` for Feature A, `fileId || entryUuid` for Phase 3) and an
 *     `info` string that is versioned so migrations do not silently
 *     roll over.
 *   - AES-GCM is authenticated — a wrong key, a tampered IV, or a
 *     tampered AAD all fail closed with a thrown `Error`, never a
 *     silent garbage plaintext.
 */

import { arrayToBuffer } from '../utils/byte-utils';
import { hmacSha256 } from './crypto-engine';

// WebCrypto AES-GCM: 12-byte IV is the spec-recommended size and what
// every major browser's SubtleCrypto assumes when you don't override it.
const AES_GCM_IV_BYTES = 12;

// RFC 5869 output upper bound: HKDF-SHA256 can expand to at most
// 255 * HashLen bytes where HashLen = 32.
const HKDF_MAX_OUTPUT_BYTES = 255 * 32;

/**
 * HKDF-SHA256 per RFC 5869.
 *
 * Implemented on top of `hmacSha256` from crypto-engine so this file has
 * zero new environment assumptions — it runs in the browser (SubtleCrypto
 * path) and in Node/Bun unit tests (nodeCrypto path) without branching.
 *
 * @param ikm - Input keying material. MUST be high-entropy (e.g. PRF
 *              output, random 32 bytes). HKDF does not strengthen weak
 *              material; callers that have a password must Argon2id it
 *              first — that is what `key-encryptor-kdf` already does for
 *              the KDBX master key path.
 * @param salt - Domain-separation salt. Different salts yield independent
 *               output. Empty salt is legal (RFC 5869) but strongly
 *               discouraged for our use cases — always supply a binding.
 * @param info - Purpose / version string. Bumping this is how a future
 *               migration breaks v1 blobs without silent fall-through.
 * @param length - Output byte length. Must be in (0, 255*32].
 */
export async function hkdfSha256(
    ikm: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number
): Promise<Uint8Array> {
    if (!Number.isInteger(length) || length <= 0) {
        throw new Error('hkdfSha256: length must be a positive integer');
    }
    if (length > HKDF_MAX_OUTPUT_BYTES) {
        throw new Error(
            `hkdfSha256: length ${length} exceeds RFC 5869 max of ${HKDF_MAX_OUTPUT_BYTES}`
        );
    }

    // RFC 5869 step 1 — extract: PRK = HMAC-SHA256(salt, IKM).
    // When salt is zero-length, RFC 5869 says HMAC key must be HashLen
    // zero bytes. Web Crypto's HMAC importKey rejects empty keys, so we
    // explicitly zero-pad on the node path too (crypto-engine already
    // handles non-empty via both paths).
    const extractSalt =
        salt.byteLength === 0 ? new Uint8Array(32) : salt;

    const prk = await hmacSha256(arrayToBuffer(extractSalt), arrayToBuffer(ikm));

    // RFC 5869 step 2 — expand: T(i) = HMAC-SHA256(PRK, T(i-1) || info || i).
    // Yields ceil(length / 32) blocks; concatenate and truncate.
    const blocks: Uint8Array[] = [];
    let prev = new Uint8Array(0);
    const blockCount = Math.ceil(length / 32);
    for (let i = 1; i <= blockCount; i++) {
        const input = new Uint8Array(prev.byteLength + info.byteLength + 1);
        input.set(prev, 0);
        input.set(info, prev.byteLength);
        input[prev.byteLength + info.byteLength] = i; // counter byte
        const block = new Uint8Array(await hmacSha256(prk, arrayToBuffer(input)));
        blocks.push(block);
        prev = block;
    }

    const out = new Uint8Array(length);
    let offset = 0;
    for (const b of blocks) {
        const take = Math.min(b.byteLength, length - offset);
        out.set(b.subarray(0, take), offset);
        offset += take;
    }
    return out;
}

/**
 * AES-256-GCM wrap. Returns a blob shaped as `IV (12 B) || ciphertext || tag`
 * where the tag is the standard 16-byte GCM authentication tag that
 * `SubtleCrypto.encrypt` appends automatically to the ciphertext.
 *
 * @param plaintext - Bytes to encrypt. Caller is responsible for zeroing
 *                    source buffers; this function does not retain a
 *                    reference after the SubtleCrypto call returns.
 * @param key - 32-byte AES-256 key. Typically the result of `hkdfSha256`.
 * @param aad - Optional additional authenticated data. Must match on
 *              unwrap exactly or GCM rejects the tag.
 */
export async function aesGcmWrap(
    plaintext: Uint8Array,
    key: Uint8Array,
    aad?: Uint8Array
): Promise<Uint8Array> {
    if (key.byteLength !== 32) {
        throw new Error(
            `aesGcmWrap: key must be 32 bytes (AES-256), got ${key.byteLength}`
        );
    }
    if (!globalThis.crypto?.subtle) {
        throw new Error('aesGcmWrap: SubtleCrypto is unavailable in this context');
    }

    const iv = new Uint8Array(AES_GCM_IV_BYTES);
    globalThis.crypto.getRandomValues(iv);

    const subtleKey = await globalThis.crypto.subtle.importKey(
        'raw',
        arrayToBuffer(key),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const params: AesGcmParams = { name: 'AES-GCM', iv: arrayToBuffer(iv) };
    if (aad && aad.byteLength > 0) {
        params.additionalData = arrayToBuffer(aad);
    }

    const ciphertext = new Uint8Array(
        (await globalThis.crypto.subtle.encrypt(
            params,
            subtleKey,
            arrayToBuffer(plaintext)
        )) as ArrayBuffer
    );

    const out = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    out.set(iv, 0);
    out.set(ciphertext, iv.byteLength);
    return out;
}

/**
 * AES-256-GCM unwrap. Inverse of `aesGcmWrap`. Throws on:
 *   - blob too short to contain IV + tag
 *   - wrong key (GCM tag mismatch)
 *   - tampered IV / ciphertext / AAD
 *
 * The thrown error is a plain `Error` with `.name = 'PrfUnwrapError'` so
 * callers can branch on it without string-matching the message.
 */
export class PrfUnwrapError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PrfUnwrapError';
    }
}

export async function aesGcmUnwrap(
    blob: Uint8Array,
    key: Uint8Array,
    aad?: Uint8Array
): Promise<Uint8Array> {
    if (key.byteLength !== 32) {
        throw new Error(
            `aesGcmUnwrap: key must be 32 bytes (AES-256), got ${key.byteLength}`
        );
    }
    if (blob.byteLength < AES_GCM_IV_BYTES + 16) {
        // IV (12) + minimum tag (16) = 28. Anything shorter cannot
        // possibly be a valid GCM output.
        throw new PrfUnwrapError(
            `aesGcmUnwrap: blob too short (${blob.byteLength} bytes)`
        );
    }
    if (!globalThis.crypto?.subtle) {
        throw new Error('aesGcmUnwrap: SubtleCrypto is unavailable in this context');
    }

    const iv = blob.subarray(0, AES_GCM_IV_BYTES);
    const ciphertext = blob.subarray(AES_GCM_IV_BYTES);

    const subtleKey = await globalThis.crypto.subtle.importKey(
        'raw',
        arrayToBuffer(key),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const params: AesGcmParams = { name: 'AES-GCM', iv: arrayToBuffer(iv) };
    if (aad && aad.byteLength > 0) {
        params.additionalData = arrayToBuffer(aad);
    }

    try {
        const plain = (await globalThis.crypto.subtle.decrypt(
            params,
            subtleKey,
            arrayToBuffer(ciphertext)
        )) as ArrayBuffer;
        return new Uint8Array(plain);
    } catch {
        // Collapse all SubtleCrypto failures (OperationError with no
        // distinguishing info) into a single typed error so callers do
        // not have to grep browser-specific strings.
        throw new PrfUnwrapError(
            'aesGcmUnwrap: authentication failed (wrong key, tampered blob, or AAD mismatch)'
        );
    }
}
