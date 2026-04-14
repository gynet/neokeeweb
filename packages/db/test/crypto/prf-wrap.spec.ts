import { describe, test, expect } from 'bun:test';
import { ByteUtils, PrfWrap } from '../../lib';

const { hkdfSha256, aesGcmWrap, aesGcmUnwrap, PrfUnwrapError } = PrfWrap;

function fromHex(hex: string): Uint8Array {
    return new Uint8Array(ByteUtils.hexToBytes(hex));
}

function toHex(bytes: Uint8Array): string {
    return ByteUtils.bytesToHex(ByteUtils.arrayToBuffer(bytes));
}

function utf8(s: string): Uint8Array {
    return new TextEncoder().encode(s);
}

function utf8ToString(b: Uint8Array): string {
    return new TextDecoder('utf-8', { fatal: true }).decode(b);
}

describe('PrfWrap.hkdfSha256 — RFC 5869 vectors', () => {
    // RFC 5869 Test Case 1 — Basic test case with SHA-256.
    test('Test Case 1 (SHA-256, 22-byte IKM, 13-byte salt, 10-byte info, L=42)', async () => {
        const ikm = fromHex('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b');
        const salt = fromHex('000102030405060708090a0b0c');
        const info = fromHex('f0f1f2f3f4f5f6f7f8f9');
        const expectedOkm =
            '3cb25f25faacd57a90434f64d0362f2a' +
            '2d2d0a90cf1a5a4c5db02d56ecc4c5bf' +
            '34007208d5b887185865';

        const okm = await hkdfSha256(ikm, salt, info, 42);
        expect(toHex(okm)).toBe(expectedOkm);
    });

    // RFC 5869 Test Case 2 — Longer inputs/outputs.
    test('Test Case 2 (SHA-256, 80-byte IKM, 80-byte salt, 80-byte info, L=82)', async () => {
        const ikm = fromHex(
            '000102030405060708090a0b0c0d0e0f' +
                '101112131415161718191a1b1c1d1e1f' +
                '202122232425262728292a2b2c2d2e2f' +
                '303132333435363738393a3b3c3d3e3f' +
                '404142434445464748494a4b4c4d4e4f'
        );
        const salt = fromHex(
            '606162636465666768696a6b6c6d6e6f' +
                '707172737475767778797a7b7c7d7e7f' +
                '808182838485868788898a8b8c8d8e8f' +
                '909192939495969798999a9b9c9d9e9f' +
                'a0a1a2a3a4a5a6a7a8a9aaabacadaeaf'
        );
        const info = fromHex(
            'b0b1b2b3b4b5b6b7b8b9babbbcbdbebf' +
                'c0c1c2c3c4c5c6c7c8c9cacbcccdcecf' +
                'd0d1d2d3d4d5d6d7d8d9dadbdcdddedf' +
                'e0e1e2e3e4e5e6e7e8e9eaebecedeeef' +
                'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff'
        );
        const expectedOkm =
            'b11e398dc80327a1c8e7f78c596a4934' +
            '4f012eda2d4efad8a050cc4c19afa97c' +
            '59045a99cac7827271cb41c65e590e09' +
            'da3275600c2f09b8367793a9aca3db71' +
            'cc30c58179ec3e87c14c01d5c1f3434f' +
            '1d87';

        const okm = await hkdfSha256(ikm, salt, info, 82);
        expect(toHex(okm)).toBe(expectedOkm);
    });

    // RFC 5869 Test Case 3 — Zero-length salt + zero-length info.
    test('Test Case 3 (SHA-256, zero-length salt/info, L=42)', async () => {
        const ikm = fromHex('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b');
        const salt = new Uint8Array(0);
        const info = new Uint8Array(0);
        const expectedOkm =
            '8da4e775a563c18f715f802a063c5a31' +
            'b8a11f5c5ee1879ec3454e5f3c738d2d' +
            '9d201395faa4b61a96c8';

        const okm = await hkdfSha256(ikm, salt, info, 42);
        expect(toHex(okm)).toBe(expectedOkm);
    });

    test('is deterministic in (ikm, salt, info, length)', async () => {
        const ikm = new Uint8Array(32).fill(0x42);
        const salt = utf8('file-abc');
        const info = utf8('neokeeweb-v1');
        const a = await hkdfSha256(ikm, salt, info, 32);
        const b = await hkdfSha256(ikm, salt, info, 32);
        expect(toHex(a)).toBe(toHex(b));
    });

    test('differs per salt (domain separation)', async () => {
        const ikm = new Uint8Array(32).fill(0x42);
        const info = utf8('neokeeweb-v1');
        const a = await hkdfSha256(ikm, utf8('file-aaa'), info, 32);
        const b = await hkdfSha256(ikm, utf8('file-bbb'), info, 32);
        expect(toHex(a)).not.toBe(toHex(b));
    });

    test('differs per info (version / purpose separation)', async () => {
        const ikm = new Uint8Array(32).fill(0x42);
        const salt = utf8('file-abc');
        const a = await hkdfSha256(ikm, salt, utf8('neokeeweb-unlock-v1'), 32);
        const b = await hkdfSha256(ikm, salt, utf8('neokeeweb-unlock-v2'), 32);
        expect(toHex(a)).not.toBe(toHex(b));
    });

    test('rejects non-positive length', async () => {
        const ikm = new Uint8Array(32);
        await expect(hkdfSha256(ikm, new Uint8Array(0), new Uint8Array(0), 0)).rejects.toThrow(
            /positive integer/
        );
        await expect(
            hkdfSha256(ikm, new Uint8Array(0), new Uint8Array(0), -1)
        ).rejects.toThrow(/positive integer/);
    });

    test('rejects length above RFC 5869 max (255 * 32)', async () => {
        const ikm = new Uint8Array(32);
        await expect(
            hkdfSha256(ikm, new Uint8Array(0), new Uint8Array(0), 255 * 32 + 1)
        ).rejects.toThrow(/exceeds RFC 5869 max/);
    });
});

describe('PrfWrap.aesGcmWrap / aesGcmUnwrap', () => {
    function randomKey(): Uint8Array {
        const k = new Uint8Array(32);
        globalThis.crypto.getRandomValues(k);
        return k;
    }

    test('round-trips a UTF-8 master-password-sized string', async () => {
        const key = randomKey();
        const plain = utf8('correct-horse-battery-staple-🐴');
        const blob = await aesGcmWrap(plain, key);
        const out = await aesGcmUnwrap(blob, key);
        expect(utf8ToString(out)).toBe('correct-horse-battery-staple-🐴');
    });

    test('produces a fresh IV per call (no ciphertext reuse)', async () => {
        const key = randomKey();
        const plain = utf8('same input twice');
        const a = await aesGcmWrap(plain, key);
        const b = await aesGcmWrap(plain, key);
        // IV is the first 12 bytes; must differ with overwhelming probability.
        expect(toHex(a.subarray(0, 12))).not.toBe(toHex(b.subarray(0, 12)));
        // Ciphertext+tag therefore also differs.
        expect(toHex(a)).not.toBe(toHex(b));
    });

    test('blob layout is IV (12) || ciphertext+tag', async () => {
        const key = randomKey();
        const plain = new Uint8Array(1);
        const blob = await aesGcmWrap(plain, key);
        // 12 (IV) + 1 (ciphertext) + 16 (tag) = 29.
        expect(blob.byteLength).toBe(12 + 1 + 16);
    });

    test('wrong key fails cleanly with PrfUnwrapError, not garbage', async () => {
        const key = randomKey();
        const wrong = randomKey();
        const blob = await aesGcmWrap(utf8('secret'), key);
        await expect(aesGcmUnwrap(blob, wrong)).rejects.toBeInstanceOf(PrfUnwrapError);
    });

    test('tampered ciphertext fails cleanly with PrfUnwrapError', async () => {
        const key = randomKey();
        const blob = await aesGcmWrap(utf8('tamper target'), key);
        // Flip a bit in the ciphertext region (after IV).
        blob[15] ^= 0x01;
        await expect(aesGcmUnwrap(blob, key)).rejects.toBeInstanceOf(PrfUnwrapError);
    });

    test('tampered IV fails cleanly with PrfUnwrapError', async () => {
        const key = randomKey();
        const blob = await aesGcmWrap(utf8('iv tamper'), key);
        blob[0] ^= 0x80;
        await expect(aesGcmUnwrap(blob, key)).rejects.toBeInstanceOf(PrfUnwrapError);
    });

    test('AAD mismatch fails cleanly with PrfUnwrapError', async () => {
        const key = randomKey();
        const blob = await aesGcmWrap(utf8('with aad'), key, utf8('file-abc|v1'));
        await expect(
            aesGcmUnwrap(blob, key, utf8('file-xyz|v1'))
        ).rejects.toBeInstanceOf(PrfUnwrapError);
    });

    test('matching AAD decrypts successfully', async () => {
        const key = randomKey();
        const aad = utf8('file-abc|v1');
        const blob = await aesGcmWrap(utf8('with aad'), key, aad);
        const out = await aesGcmUnwrap(blob, key, aad);
        expect(utf8ToString(out)).toBe('with aad');
    });

    test('wrap rejects wrong-size key', async () => {
        const shortKey = new Uint8Array(16);
        await expect(aesGcmWrap(utf8('x'), shortKey)).rejects.toThrow(/32 bytes/);
    });

    test('unwrap rejects wrong-size key', async () => {
        const shortKey = new Uint8Array(16);
        // Minimum legal blob length is IV + tag = 28; use 32 so only
        // the key-size check triggers.
        await expect(aesGcmUnwrap(new Uint8Array(32), shortKey)).rejects.toThrow(/32 bytes/);
    });

    test('unwrap rejects too-short blob with PrfUnwrapError', async () => {
        const key = randomKey();
        await expect(aesGcmUnwrap(new Uint8Array(10), key)).rejects.toBeInstanceOf(
            PrfUnwrapError
        );
    });
});

describe('PrfWrap — end-to-end: PRF -> HKDF wrap key -> master password envelope', () => {
    // This is the exact derivation shape Feature A uses in
    // packages/core/app/scripts/comp/passkey/passkey-unlock.ts and that
    // Phase 3 (#25 per-field) and Phase 3+ (#39 per-URL) will reuse with
    // different info/salt. Guarding the composite flow here lets the db
    // package detect regressions in the primitive layer without having
    // to boot the core passkey stack.
    test('derived-key wrap of master password round-trips', async () => {
        const simulatedPrfOutput = new Uint8Array(32).fill(0x42);
        const fileId = 'file-deadbeef';
        const info = utf8('neokeeweb-passkey-unlock-v1');
        const salt = utf8(fileId);

        const wrapKey = await hkdfSha256(simulatedPrfOutput, salt, info, 32);
        expect(wrapKey.byteLength).toBe(32);

        const password = utf8('my-master-password-1234');
        const aad = utf8(`${fileId}|neokeeweb-passkey-wrap-v1`);
        const envelope = await aesGcmWrap(password, wrapKey, aad);

        // Unwrap with the same derivation.
        const redoKey = await hkdfSha256(simulatedPrfOutput, salt, info, 32);
        const recovered = await aesGcmUnwrap(envelope, redoKey, aad);
        expect(utf8ToString(recovered)).toBe('my-master-password-1234');
    });

    test('simulated wrong PRF output fails unwrap (authenticator mismatch)', async () => {
        const rightPrf = new Uint8Array(32).fill(0x42);
        const wrongPrf = new Uint8Array(32).fill(0x43);
        const fileId = 'file-deadbeef';
        const info = utf8('neokeeweb-passkey-unlock-v1');
        const salt = utf8(fileId);

        const rightKey = await hkdfSha256(rightPrf, salt, info, 32);
        const wrongKey = await hkdfSha256(wrongPrf, salt, info, 32);

        const envelope = await aesGcmWrap(utf8('secret-password'), rightKey);
        await expect(aesGcmUnwrap(envelope, wrongKey)).rejects.toBeInstanceOf(PrfUnwrapError);
    });

    test('different fileId under same PRF fails unwrap (file rebinding attack)', async () => {
        const prf = new Uint8Array(32).fill(0x42);
        const info = utf8('neokeeweb-passkey-unlock-v1');

        const keyA = await hkdfSha256(prf, utf8('file-aaa'), info, 32);
        const keyB = await hkdfSha256(prf, utf8('file-bbb'), info, 32);

        const envelopeForA = await aesGcmWrap(utf8('file-a-password'), keyA);
        // Attempting to unwrap file A's envelope with file B's derived
        // key must fail — this is why the salt is the fileId.
        await expect(aesGcmUnwrap(envelopeForA, keyB)).rejects.toBeInstanceOf(PrfUnwrapError);
    });
});
