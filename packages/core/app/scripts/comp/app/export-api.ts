import { AppSettingsModel } from 'models/app-settings-model';
import { RuntimeDataModel } from 'models/runtime-data-model';

const ExportApi = {
    settings: {
        get(key?: string): unknown {
            return key
                ? (AppSettingsModel as Record<string, unknown>)[key]
                : { ...(AppSettingsModel as Record<string, unknown>) };
        },
        set(key: string, value: unknown): void {
            (AppSettingsModel as Record<string, unknown>)[key] = value;
        },
        del(key: string): void {
            delete (AppSettingsModel as Record<string, unknown>)[key];
        }
    },
    runtimeData: {
        get(key?: string): unknown {
            return key
                ? (RuntimeDataModel as Record<string, unknown>)[key]
                : { ...(RuntimeDataModel as Record<string, unknown>) };
        },
        set(key: string, value: unknown): void {
            (RuntimeDataModel as Record<string, unknown>)[key] = value;
        },
        del(key: string): void {
            delete (RuntimeDataModel as Record<string, unknown>)[key];
        }
    }
};

export { ExportApi };
