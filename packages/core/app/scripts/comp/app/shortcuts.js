// Stub: desktop shortcuts removed in web-only fork
import { Features } from 'util/features';

const Shortcuts = {
    init() {},
    setGlobalShortcut() {},
    screenCaptureParam: null,
    altShortcutSymbol(html) {
        return Features.isMac ? '⌥' : 'Alt';
    },
    actionShortcutSymbol(html) {
        return Features.isMac ? '⌘' : 'Ctrl';
    },
    globalShortcutText(type) {
        return '';
    }
};
export { Shortcuts };
