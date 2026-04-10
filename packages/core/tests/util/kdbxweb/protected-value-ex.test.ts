import { describe, test, expect, beforeAll } from 'bun:test';

/**
 * Regression tests for `packages/core/app/scripts/util/kdbxweb/protected-value-ex.ts`.
 *
 * Specifically guards the 2026-04-09 fix to `isFieldReference()`.
 *
 * Background on the bug (preserved here so future readers don't
 * have to dig git history):
 *   - Original code returned `true` for ANY ProtectedValue whose
 *     byte length equalled the field-ref template (42 bytes), even
 *     if none of the literal characters matched.
 *   - Two independent reasons:
 *     1. The comparison `ch !== expected` was between a number
 *        (charcode from `forEachChar`) and a string (a char from
 *        `.split('')`). In strict inequality those are never equal,
 *        so the "return false on mismatch" branch was dead — and
 *        even when it wasn't dead, it only broke the `forEachChar`
 *        iteration, not the outer function.
 *     2. The outer function ended with `return true` unconditionally
 *        after `forEachChar` returned.
 *   - Downstream `_resolveFieldReference` in entry-model ran a
 *     regex on the decrypted text which filtered out the false
 *     positives, so there was no user-visible behaviour change,
 *     but the primitive was wrong and the false positives cost
 *     unnecessary decrypt + regex work on every 42-byte field.
 *
 * Fixed in commit 3a046620 (part of the 74 → 0 Phase 1 TS session).
 * Agent 2 replaced `ch !== expected` with `ch !== expected.charCodeAt(0)`
 * and introduced a `matches` flag that the callback flips to `false`
 * before breaking out of iteration.
 *
 * These tests assert the CORRECT post-fix behaviour:
 *   - True only for real field references
 *   - False for 42-byte values with mismatched literal chars
 *   - False for wrong-length values
 *   - Tolerant of any REF type char (T/N/P/A/U AND others —
 *     downstream regex narrows to [TNPAU])
 *   - Tolerant of any 32-char UUID slot content (downstream regex
 *     narrows to \w{32})
 *
 * DO NOT reintroduce a test that asserts `isFieldReference(garbage42b)`
 * returns `true` — that would pin the old bug. See `feedback_tests_must_not_lock_bugs`.
 */

// Dynamic import so the module's side-effect prototype patches run
// AFTER bun test sets up its module environment. Also avoids Bun
// complaining about top-level `import 'kdbxweb'` when the workspace
// alias is in a webpack-only path.
interface ProtectedValueWithExt {
    isFieldReference(): boolean;
    isProtected: boolean;
    byteLength: number;
}

type PVCtor = new (value: ArrayBuffer | Uint8Array, salt: ArrayBuffer | Uint8Array) => ProtectedValueWithExt;

interface KdbxwebModule {
    ProtectedValue: PVCtor & {
        fromString(s: string): ProtectedValueWithExt;
    };
    CryptoEngine: {
        random(n: number): Uint8Array;
    };
}

let kdbxweb: KdbxwebModule;

beforeAll(async () => {
    // The source file patches kdbxweb.ProtectedValue.prototype as a
    // side effect on import. Import the source first so by the time
    // we touch `kdbxweb.ProtectedValue` the prototype is extended.
    await import('../../../app/scripts/util/kdbxweb/protected-value-ex');
    kdbxweb = (await import('kdbxweb')) as unknown as KdbxwebModule;
});

function pv(s: string): ProtectedValueWithExt {
    return kdbxweb.ProtectedValue.fromString(s);
}

describe('protected-value-ex — isFieldReference()', () => {
    describe('matches valid field references', () => {
        test('T (title) reference', () => {
            expect(pv('{REF:T@I:abc123abc123abc123abc123abc123ab}').isFieldReference()).toBe(true);
        });

        test('N (notes) reference', () => {
            expect(pv('{REF:N@I:00000000000000000000000000000000}').isFieldReference()).toBe(true);
        });

        test('P (password) reference', () => {
            expect(pv('{REF:P@I:deadbeefdeadbeefdeadbeefdeadbeef}').isFieldReference()).toBe(true);
        });

        test('A (URL) reference', () => {
            expect(pv('{REF:A@I:ffffffffffffffffffffffffffffffff}').isFieldReference()).toBe(true);
        });

        test('U (user name) reference', () => {
            expect(pv('{REF:U@I:12345678901234567890123456789012}').isFieldReference()).toBe(true);
        });

        test('accepts ANY char at the REF type slot (fast check is loose, narrowed by regex downstream)', () => {
            // These are technically not valid field refs per the
            // downstream regex `/^\{REF:([TNPAU])@I:(\w{32})}$/`,
            // but isFieldReference() is a byte-level fast check —
            // false positives here are OK, false negatives are not.
            expect(pv('{REF:X@I:abc123abc123abc123abc123abc123ab}').isFieldReference()).toBe(true);
            expect(pv('{REF:Q@I:abc123abc123abc123abc123abc123ab}').isFieldReference()).toBe(true);
        });

        test('accepts any char at the 32 UUID slots (fast check is loose)', () => {
            expect(pv('{REF:T@I:!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!}').isFieldReference()).toBe(true);
            expect(pv('{REF:T@I:GHIJKLMNGHIJKLMNGHIJKLMNGHIJKLMN}').isFieldReference()).toBe(true);
        });
    });

    describe('rejects non field references with wrong literal chars', () => {
        test('prefix {NOT: instead of {REF:', () => {
            expect(pv('{NOT:T@I:abc123abc123abc123abc123abc123ab}').isFieldReference()).toBe(false);
        });

        test('missing opening brace', () => {
            expect(pv(' REF:T@I:abc123abc123abc123abc123abc123ab}').isFieldReference()).toBe(false);
        });

        test('missing closing brace', () => {
            expect(pv('{REF:T@I:abc123abc123abc123abc123abc123ab ').isFieldReference()).toBe(false);
        });

        test('wrong @ sign position', () => {
            // Same length (42 bytes), but the '@' is missing from slot 6
            // (replaced by a space) — this is exactly the regression
            // class the pre-fix code got wrong: same length, literal
            // mismatch, used to return true, now returns false.
            expect(pv('{REF:T I:abc123abc123abc123abc123abc123ab}').isFieldReference()).toBe(false);
        });

        test('garbage with right byte length (the pre-fix false-positive regression)', () => {
            expect(
                pv('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx').isFieldReference()
            ).toBe(false);
        });
    });

    describe('rejects values with wrong byte length', () => {
        test('empty string', () => {
            expect(pv('').isFieldReference()).toBe(false);
        });

        test('short string', () => {
            expect(pv('{REF:T@I:1234}').isFieldReference()).toBe(false);
        });

        test('long string', () => {
            expect(
                pv('{REF:T@I:abc123abc123abc123abc123abc123ab}extra').isFieldReference()
            ).toBe(false);
        });

        test('a plain password', () => {
            expect(pv('hunter2').isFieldReference()).toBe(false);
        });
    });

    describe('basic ProtectedValue extension surface', () => {
        test('isProtected flag is true on all instances', () => {
            expect(pv('anything').isProtected).toBe(true);
        });
    });
});
