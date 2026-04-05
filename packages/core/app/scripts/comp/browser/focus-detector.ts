// @ts-nocheck
import { Events } from 'framework/events';
import { Features } from 'util/features';

const FocusDetector = {
    init() {
        this.isFocused = true;
        if (!Features.isMobile) {
            window.addEventListener('focus', () => {
                if (!FocusDetector.isFocused) {
                    FocusDetector.isFocused = true;
                    Events.emit('main-window-focus');
                }
            });
            window.addEventListener('blur', () => {
                if (FocusDetector.isFocused) {
                    FocusDetector.isFocused = false;
                    Events.emit('main-window-blur');
                }
            });
        }
    },

    hasFocus() {
        return this.isFocused;
    }
};

export { FocusDetector };
