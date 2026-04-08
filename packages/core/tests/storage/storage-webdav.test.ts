import { describe, test, expect, mock, beforeEach, afterAll } from 'bun:test';
import {
    installMockedModule,
    restoreAllMockedModules,
} from '../helpers/mock-isolation';

// Path-based mocks (relative specs) — these only affect the immediate
// import graph of this test file, so they cannot pollute other test
// files in the same Bun run. We keep them on the synchronous
// mock.module API for clarity.
mock.module('../../app/scripts/models/app-settings-model', () => ({
    AppSettingsModel: {
        webdav: true,
        webdavSaveMethod: 'default',
        webdavStatReload: false
    }
}));

mock.module('../../app/scripts/models/runtime-data-model', () => ({
    RuntimeDataModel: {}
}));

mock.module('../../app/scripts/util/logger', () => ({
    Logger: class {
        debug(..._args: unknown[]) {}
        info(..._args: unknown[]) {}
        error(..._args: unknown[]) {}
        ts(_start?: unknown) { return '0ms'; }
    }
}));

mock.module('../../app/scripts/util/locale', () => ({
    Locale: {
        webdavNoLastModified: 'No Last-Modified header'
    }
}));

// `kdbxweb` is a published bare-specifier shared across multiple test
// files (notably `tests/comp/extension/protocol-impl.test.ts`). A raw
// `mock.module('kdbxweb', ...)` here leaks into every later file in
// the same run. We use `installMockedModule` so the helper captures a
// real-module snapshot first; the `afterAll(restoreAllMockedModules)`
// hook below puts the real exports back when this file finishes. See
// `tests/helpers/mock-isolation.ts` for the full rationale.
await installMockedModule('kdbxweb', () => ({
    CryptoEngine: {
        sha256: (_data: ArrayBuffer) => Promise.resolve(new ArrayBuffer(32))
    },
    ByteUtils: {
        bytesToHex: () => 'abcdef0123456789ab'
    }
}));

afterAll(restoreAllMockedModules);

const { StorageWebDav } = await import('../../app/scripts/storage/impl/storage-webdav');

describe('StorageWebDav', () => {
    let storage: InstanceType<typeof StorageWebDav>;

    beforeEach(() => {
        storage = new StorageWebDav();
        storage.init();
    });

    test('has correct name and icon', () => {
        expect(storage.name).toBe('webdav');
        expect(storage.icon).toBe('server');
        expect(storage.enabled).toBe(true);
        expect(storage.uipos).toBe(10);
    });

    test('needShowOpenConfig returns true', () => {
        expect(storage.needShowOpenConfig()).toBe(true);
    });

    test('getOpenConfig returns required URL field', () => {
        const config = storage.getOpenConfig();
        expect(config.fields).toHaveLength(3);

        const pathField = config.fields[0];
        expect(pathField.id).toBe('path');
        expect(pathField.required).toBe(true);
        expect(pathField.pattern).toBe('^https://.+');

        const userField = config.fields[1];
        expect(userField.id).toBe('user');
        expect(userField.type).toBe('text');

        const passField = config.fields[2];
        expect(passField.id).toBe('password');
        expect(passField.type).toBe('password');
    });

    test('getSettingsConfig returns save method and stat reload options', () => {
        const config = storage.getSettingsConfig();
        expect(config.fields).toHaveLength(2);

        const saveMethod = config.fields[0];
        expect(saveMethod.id).toBe('webdavSaveMethod');
        expect(saveMethod.type).toBe('select');

        const statReload = config.fields[1];
        expect(statReload.id).toBe('webdavStatReload');
        expect(statReload.type).toBe('checkbox');
    });

    describe('_xorString', () => {
        test('XORs two equal-length strings', () => {
            const result = storage._xorString('abc', 'xyz');
            // 'a' ^ 'x' = 97 ^ 120 = 25, 'b' ^ 'y' = 98 ^ 121 = 27, 'c' ^ 'z' = 99 ^ 122 = 25
            expect(result.charCodeAt(0)).toBe(97 ^ 120);
            expect(result.charCodeAt(1)).toBe(98 ^ 121);
            expect(result.charCodeAt(2)).toBe(99 ^ 122);
        });

        test('wraps key string when shorter', () => {
            const result = storage._xorString('abcd', 'xy');
            // 'c' ^ 'x', 'd' ^ 'y' (key wraps)
            expect(result.charCodeAt(2)).toBe(99 ^ 120);
            expect(result.charCodeAt(3)).toBe(100 ^ 121);
        });

        test('XOR is reversible', () => {
            const original = 'MyP@ssw0rd!';
            const key = 'uuid-1234-5678';
            const encrypted = storage._xorString(original, key);
            const decrypted = storage._xorString(encrypted, key);
            expect(decrypted).toBe(original);
        });
    });

    describe('credential handling', () => {
        test('fileOptsToStoreOpts encodes password', () => {
            const opts = { user: 'admin', password: 'secret' };
            const file = { uuid: 'test-uuid' };
            const result = storage.fileOptsToStoreOpts(opts, file);
            expect(result.user).toBe('admin');
            expect(result.encpass).toBeTruthy();
            expect(result.password).toBeUndefined();
        });

        test('storeOptsToFileOpts decodes password', () => {
            const opts = { user: 'admin', password: 'secret' };
            const file = { uuid: 'test-uuid' };
            const storeOpts = storage.fileOptsToStoreOpts(opts, file);
            const fileOpts = storage.storeOptsToFileOpts(storeOpts, file);
            expect(fileOpts.user).toBe('admin');
            expect(fileOpts.password).toBe('secret');
        });

        test('round-trip with different file UUIDs gives different encpass', () => {
            const opts = { user: 'u', password: 'a-longer-password-value' };
            const file1 = { uuid: 'aaaaaaaa-1111-2222-3333-444444444444' };
            const file2 = { uuid: 'bbbbbbbb-5555-6666-7777-888888888888' };
            const enc1 = storage.fileOptsToStoreOpts(opts, file1);
            const enc2 = storage.fileOptsToStoreOpts(opts, file2);
            expect(enc1.encpass).not.toBe(enc2.encpass);
        });

        test('preserves user without password', () => {
            const opts = { user: 'admin' } as { user: string; password?: string };
            const file = { uuid: 'test' };
            const result = storage.fileOptsToStoreOpts(opts, file);
            expect(result.user).toBe('admin');
            expect(result.encpass).toBeUndefined();
        });
    });

    test('applySetting updates appSettings', () => {
        storage.applySetting('webdavSaveMethod', 'put');
        expect((storage.appSettings as unknown as Record<string, unknown>).webdavSaveMethod).toBe('put');
    });
});
