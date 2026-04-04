import { AppSettingsModel } from 'models/app-settings-model';
import { RuntimeDataModel } from 'models/runtime-data-model';
import { Logger } from 'util/logger';

class StorageBase {
    name = null;
    icon = null;
    enabled = false;
    system = false;
    uipos = null;

    logger = null;
    appSettings = AppSettingsModel;
    runtimeData = RuntimeDataModel;

    init() {
        if (!this.name) {
            throw 'Failed to init provider: no name';
        }
        if (!this.system) {
            const enabled = this.appSettings[this.name];
            if (typeof enabled === 'boolean') {
                this.enabled = enabled;
            }
        }
        this.logger = new Logger('storage-' + this.name);
        return this;
    }

    get loggedIn() {
        return false;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    logout() {}

    deleteStoredToken() {}
}

export { StorageBase };
