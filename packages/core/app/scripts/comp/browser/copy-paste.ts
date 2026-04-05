// @ts-nocheck
import { AppSettingsModel } from 'models/app-settings-model';

const CopyPaste = {
    simpleCopy: false,

    copy(text) {
        try {
            navigator.clipboard.writeText(text).then(() => {
                const clipboardSeconds = AppSettingsModel.clipboardSeconds;
                if (clipboardSeconds > 0) {
                    setTimeout(() => {
                        navigator.clipboard.readText().then((current) => {
                            if (current === text) {
                                navigator.clipboard.writeText('');
                            }
                        });
                    }, clipboardSeconds * 1000);
                }
            });
            return { success: true, seconds: AppSettingsModel.clipboardSeconds };
        } catch (e) {
            try {
                if (document.execCommand('copy')) {
                    return { success: true };
                }
            } catch (e) {}
            return false;
        }
    },

    createHiddenInput(text) {
        const hiddenInput = $('<input/>')
            .val(text)
            .attr({ type: 'text', 'class': 'hide-by-pos' })
            .appendTo(document.body);
        hiddenInput[0].selectionStart = 0;
        hiddenInput[0].selectionEnd = text.length;
        hiddenInput.focus();
        hiddenInput.on({
            'copy cut paste'() {
                setTimeout(() => hiddenInput.blur(), 0);
            },
            blur() {
                hiddenInput.remove();
            }
        });
    },

    copyHtml(html) {
        const el = document.createElement('div');
        el.style.userSelect = 'auto';
        el.style.webkitUserSelect = 'auto';
        el.style.mozUserSelect = 'auto';
        el.innerHTML = html;
        document.body.appendChild(el);

        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const result = document.execCommand('copy');

        el.remove();
        return result;
    }
};

export { CopyPaste };
