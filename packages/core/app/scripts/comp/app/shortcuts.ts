// Stub: desktop shortcuts removed in web-only fork
import { Features } from 'util/features';

const Shortcuts = {
    init(): void {},
    setGlobalShortcut(_key?: string): void {},
    screenCaptureParam: null as string | null,
    altShortcutSymbol(_html?: boolean): string {
        return Features.isMac ? '⌥' : 'Alt';
    },
    actionShortcutSymbol(_html?: boolean): string {
        return Features.isMac ? '⌘' : 'Ctrl';
    },
    globalShortcutText(_type?: string): string {
        return '';
    },
    // Web builds cannot take screenshots programmatically; kept as stub
    // so legacy OTP QR reader alert body can safely query the shortcut.
    screenshotToClipboardShortcut(): string {
        return '';
    }
};
export { Shortcuts };
