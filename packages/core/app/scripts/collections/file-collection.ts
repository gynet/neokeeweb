/* eslint-disable @typescript-eslint/no-explicit-any */
import { Collection } from 'framework/collection';
import { Model } from 'framework/model';

class FileCollection extends Collection {
    static override model = Model;

    hasOpenFiles(): boolean {
        return this.some((file: any) => file.active);
    }

    hasUnsavedFiles(): boolean {
        return this.some((file: any) => file.modified);
    }

    hasDirtyFiles(): boolean {
        return this.some((file: any) => file.dirty);
    }

    getByName(name: string): unknown | undefined {
        return this.find((file: any) => file.name.toLowerCase() === name.toLowerCase());
    }
}

export { FileCollection };
