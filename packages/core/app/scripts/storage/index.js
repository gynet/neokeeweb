import { StorageCache } from 'storage/impl/storage-cache';
import { StorageWebDav } from 'storage/impl/storage-webdav';

const Storage = {
    cache: new StorageCache(),
    webdav: new StorageWebDav()
};

export { Storage };
