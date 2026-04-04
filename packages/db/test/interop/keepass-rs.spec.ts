/**
 * Cross-implementation compatibility tests using test databases from keepass-rs.
 * Source: https://github.com/sseemayer/keepass-rs (MIT license)
 *
 * These tests verify that our KDBX4 implementation can read databases created
 * by keepass-rs, covering various KDF + cipher combinations.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as kdbxweb from '../../lib';
import { argon2 } from '../test-support/argon2';

const EXTERNAL_DIR = path.join(__dirname, '../../resources/external');

function readExternal(name: string): ArrayBuffer {
    const filePath = path.join(EXTERNAL_DIR, name);
    const content = fs.readFileSync(filePath);
    return kdbxweb.ByteUtils.arrayToBuffer(new Uint8Array(content));
}

describe('keepass-rs interop', () => {
    beforeAll(() => {
        kdbxweb.CryptoEngine.setArgon2Impl(argon2);
    });

    afterAll(() => {
        kdbxweb.CryptoEngine.setArgon2Impl(undefined as any);
    });

    // ---------------------------------------------------------------
    // KDBX4 password-only databases (password: "demopass")
    // All use Argon2/Argon2id KDF with various ciphers
    // ---------------------------------------------------------------

    describe('KDBX4 with password + Argon2d KDF + AES cipher', () => {
        test('loads and has valid structure', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_password_argon2.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
        }, 30000);
    });

    describe('KDBX4 with password + Argon2id KDF + AES cipher', () => {
        test('loads and has valid structure', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_password_argon2id.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
        }, 30000);
    });

    describe('KDBX4 with password + AES KDF + AES cipher', () => {
        test('loads and has valid structure', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_password_aes.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
        }, 30000);
    });

    describe('KDBX4 with password + Argon2d KDF + ChaCha20 cipher', () => {
        test('loads and has valid structure', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_password_argon2_chacha20.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
        }, 30000);
    });

    describe('KDBX4 with password + Argon2id KDF + ChaCha20 cipher', () => {
        test('loads and has valid structure', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_password_argon2id_chacha20.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
        }, 30000);
    });

    // ---------------------------------------------------------------
    // KDBX4 with Twofish cipher (unsupported - should fail gracefully)
    // ---------------------------------------------------------------

    describe('KDBX4 with Twofish cipher (unsupported)', () => {
        test('Argon2d + Twofish rejects with unsupported cipher', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            try {
                await kdbxweb.Kdbx.load(
                    readExternal('test_db_kdbx4_with_password_argon2_twofish.kdbx'),
                    cred
                );
                throw new Error('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(kdbxweb.KdbxError);
                expect((e as kdbxweb.KdbxError).code).toBe(
                    kdbxweb.Consts.ErrorCodes.Unsupported
                );
            }
        }, 30000);

        test('Argon2id + Twofish rejects with unsupported cipher', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            try {
                await kdbxweb.Kdbx.load(
                    readExternal('test_db_kdbx4_with_password_argon2id_twofish.kdbx'),
                    cred
                );
                throw new Error('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(kdbxweb.KdbxError);
                expect((e as kdbxweb.KdbxError).code).toBe(
                    kdbxweb.Consts.ErrorCodes.Unsupported
                );
            }
        }, 30000);
    });

    // ---------------------------------------------------------------
    // KDBX4 with deleted entry (recycle bin)
    // ---------------------------------------------------------------

    describe('KDBX4 with deleted entry', () => {
        test('loads and has recycle bin', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_password_deleted_entry.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
            expect(db.meta.recycleBinEnabled).toBe(true);
            expect(db.meta.recycleBinUuid).toBeTruthy();
        }, 30000);
    });

    // ---------------------------------------------------------------
    // KDBX4 with TOTP entry (password: "test")
    // ---------------------------------------------------------------

    describe('KDBX4 with TOTP entry', () => {
        test('loads and has valid structure', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('test')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_totp_entry.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
        }, 30000);
    });

    // ---------------------------------------------------------------
    // KDBX4 with keyfile (keyfile-only, no password)
    // ---------------------------------------------------------------

    describe('KDBX4 with keyfile v1', () => {
        test('loads with binary keyfile', async () => {
            const cred = new kdbxweb.Credentials(
                null as any,
                readExternal('test_key.key')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_keyfile.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
        }, 30000);
    });

    // ---------------------------------------------------------------
    // KDBX4 with keyfile v2 + password
    // ---------------------------------------------------------------

    describe('KDBX4 with keyfile v2 + password', () => {
        test('loads with keyx keyfile and password "demopass"', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass'),
                readExternal('test_db_kdbx4_with_keyfile_v2.keyx')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_keyfile_v2.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('Root');
        }, 30000);
    });

    describe('KDBX4 with keyfile v2 alt (tabs in key data)', () => {
        test('loads with keyx keyfile and password "123123"', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('123123'),
                readExternal('test_db_kdbx4_with_keyfile_v2_alt.keyx')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_kdbx4_with_keyfile_v2_alt.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
            expect(db.groups[0].name).toBe('testdb02');
        }, 30000);
    });

    // ---------------------------------------------------------------
    // KDBX4 fuzzing database (low round count)
    // ---------------------------------------------------------------

    describe('KDBX4 with few rounds (fuzzing db)', () => {
        test('loads with password "demopass"', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            const db = await kdbxweb.Kdbx.load(
                readExternal('test_db_few_rounds.kdbx'),
                cred
            );
            expect(db).toBeInstanceOf(kdbxweb.Kdbx);
            expect(db.groups.length).toBe(1);
        }, 30000);
    });

    // ---------------------------------------------------------------
    // KDBX3 files - should be rejected
    // ---------------------------------------------------------------

    describe('KDBX3 files (should be rejected)', () => {
        test('rejects KDBX3 with password', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('demopass')
            );
            try {
                await kdbxweb.Kdbx.load(
                    readExternal('test_db_with_password.kdbx'),
                    cred
                );
                throw new Error('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(kdbxweb.KdbxError);
                expect((e as kdbxweb.KdbxError).code).toBe(
                    kdbxweb.Consts.ErrorCodes.InvalidVersion
                );
            }
        });

        test('rejects KDBX3 with chacha20 protected fields', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('password')
            );
            try {
                await kdbxweb.Kdbx.load(
                    readExternal('test_db_kdbx3_with_chacha20_protected_fields.kdbx'),
                    cred
                );
                throw new Error('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(kdbxweb.KdbxError);
                expect((e as kdbxweb.KdbxError).code).toBe(
                    kdbxweb.Consts.ErrorCodes.InvalidVersion
                );
            }
        });
    });

    // ---------------------------------------------------------------
    // Broken files - should produce errors
    // ---------------------------------------------------------------

    describe('broken files', () => {
        test('rejects random data', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('')
            );
            try {
                await kdbxweb.Kdbx.load(
                    readExternal('broken_random_data.kdbx'),
                    cred
                );
                throw new Error('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(kdbxweb.KdbxError);
            }
        });

        test('rejects broken KDBX version', async () => {
            const cred = new kdbxweb.Credentials(
                kdbxweb.ProtectedValue.fromString('')
            );
            try {
                await kdbxweb.Kdbx.load(
                    readExternal('broken_kdbx_version.kdbx'),
                    cred
                );
                throw new Error('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(kdbxweb.KdbxError);
            }
        });
    });
});
