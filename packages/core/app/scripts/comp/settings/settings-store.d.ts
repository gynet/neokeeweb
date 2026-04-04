/**
 * Type declaration for SettingsStore.
 * Persists settings data to localStorage (web) or file system (desktop).
 */
export declare const SettingsStore: {
    load(key: string): Promise<Record<string, unknown> | null>;
    save(key: string, data: unknown): Promise<void>;
};
