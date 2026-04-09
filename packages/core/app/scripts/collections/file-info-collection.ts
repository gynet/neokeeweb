/* eslint-disable @typescript-eslint/no-explicit-any */
import { Collection } from 'framework/collection';
import { SettingsStore } from 'comp/settings/settings-store';
import { FileInfoModel } from 'models/file-info-model';

class FileInfoCollection extends Collection<FileInfoModel> {
    static override model = FileInfoModel;

    load(): Promise<void> {
        return SettingsStore.load('file-info').then((data: any) => {
            if (data) {
                for (const item of data) {
                    this.push(new FileInfoModel(item));
                }
            }
        });
    }

    save(): void {
        SettingsStore.save('file-info', this);
    }

    getMatch(storage: string | null, name: string | null, path: string | null): unknown | undefined {
        return this.find((fi: any) => {
            return (
                (fi.storage || '') === (storage || '') &&
                (fi.name || '') === (name || '') &&
                (fi.path || '') === (path || '')
            );
        });
    }

    getByName(name: string): unknown | undefined {
        return this.find((file: any) => file.name.toLowerCase() === name.toLowerCase());
    }
}

const instance = new FileInfoCollection();

export { instance as FileInfoCollection };
