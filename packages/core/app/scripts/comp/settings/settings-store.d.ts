/**
 * Type declaration for SettingsStore.
 * Persists settings data to localStorage (web) or file system (desktop).
 */
export declare const SettingsStore: {
    load(): Promise<void>;
    save(): Promise<void>;
};
