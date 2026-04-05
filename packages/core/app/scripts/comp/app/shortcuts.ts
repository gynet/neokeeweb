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
    }
};
export { Shortcuts };
