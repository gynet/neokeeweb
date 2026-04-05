import { StorageCache } from 'storage/impl/storage-cache';
import { StorageWebDav } from 'storage/impl/storage-webdav';

const Storage: Record<string, StorageCache | StorageWebDav> & {
    cache: StorageCache;
    webdav: StorageWebDav;
} = {
    cache: new StorageCache(),
    webdav: new StorageWebDav()
};

export { Storage };
