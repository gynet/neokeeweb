// Stub: settings manager — provides minimal API for the app to boot
const SettingsManager = {
    activeLocale: 'en-US' as string,
    allLocales: { 'en-US': 'English' } as Record<string, string>,
    activeTheme: 'dark' as string,
    allThemes: { dark: 'Dark', light: 'Light' } as Record<string, string>,
    autoSwitchedThemes: false as boolean,
    init(): void {},
    setBySettings(_settings?: Record<string, unknown>): void {},
    setFontSize(_fontSize?: number): void {},
    setLocale(_locale?: string): void {},
    setTheme(_theme?: string): void {},
    darkModeChanged(): void {}
};
export { SettingsManager };
