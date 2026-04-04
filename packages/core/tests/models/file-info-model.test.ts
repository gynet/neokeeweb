import { describe, test, expect, mock } from 'bun:test';

// Mock 'hbs' (handlebars) which is a webpack alias not available in test
mock.module('hbs', () => ({
    default: { escapeExpression: (s: string) => s }
}));

const { FileInfoModel } = await import('../../app/scripts/models/file-info-model');

describe('FileInfoModel', () => {
    test('creates with default properties', () => {
        const model = new FileInfoModel();
        expect(model.id).toBe('');
        expect(model.name).toBe('');
        expect(model.storage).toBeNull();
        expect(model.path).toBeNull();
        expect(model.modified).toBe(false);
        expect(model.rev).toBeNull();
        expect(model.keyFileName).toBeNull();
    });

    test('creates with provided properties', () => {
        const model = new FileInfoModel({
            id: 'test-123',
            name: 'MyDatabase.kdbx',
            storage: 'webdav',
            path: '/vault/db.kdbx'
        });
        expect(model.id).toBe('test-123');
        expect(model.name).toBe('MyDatabase.kdbx');
        expect(model.storage).toBe('webdav');
        expect(model.path).toBe('/vault/db.kdbx');
    });

    test('filters out unknown properties', () => {
        const model = new FileInfoModel({
            id: 'test-456',
            unknownField: 'should be dropped'
        } as never);
        expect(model.id).toBe('test-456');
        expect((model as Record<string, unknown>).unknownField).toBeUndefined();
    });

    test('converts date strings to Date objects', () => {
        const dateStr = '2025-06-15T10:30:00.000Z';
        const model = new FileInfoModel({
            id: 'test-789',
            syncDate: new Date(dateStr),
            openDate: new Date(dateStr)
        });
        expect(model.syncDate).toBeInstanceOf(Date);
        expect(model.openDate).toBeInstanceOf(Date);
    });

    test('handles null date values', () => {
        const model = new FileInfoModel({
            id: 'test-null',
            syncDate: null,
            openDate: null
        });
        expect(model.syncDate).toBeNull();
        expect(model.openDate).toBeNull();
    });
});
