import { StorageCache } from 'storage/impl/storage-cache';
import { StorageDropbox } from 'storage/impl/storage-dropbox';
import { StorageGDrive } from 'storage/impl/storage-gdrive';
import { StorageOneDrive } from 'storage/impl/storage-onedrive';
import { StorageTeams } from 'storage/impl/storage-teams';
import { StorageWebDav } from 'storage/impl/storage-webdav';
import { createOAuthSession } from 'storage/pkce';

const Storage = {
    cache: new StorageCache(),
    dropbox: new StorageDropbox(),
    gdrive: new StorageGDrive(),
    onedrive: new StorageOneDrive(),
    msteams: new StorageTeams(),
    webdav: new StorageWebDav()
};

requestAnimationFrame(createOAuthSession);

export { Storage };
