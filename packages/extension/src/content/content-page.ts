import {
    ContentScriptMessage,
    ContentScriptMessageAutoFill,
    ContentScriptReturn
} from 'common/content-script-interface';

declare global {
    interface Window {
        kwExtensionInstalled: boolean;
    }
}

// Track the last-focused INPUT across focus events. Firefox (and
// some Chromium sites) move focus away from the input BETWEEN the
// keyboard shortcut fire and the moment content-page.js is called
// to read document.activeElement — e.g., the keydown of Ctrl+Shift+U
// can engage Firefox's Unicode character input mode which steals
// focus, or an async gap between chrome.commands.onCommand → script
// injection → message dispatch lets any DOM event reset focus.
// Result: `document.activeElement.tagName !== 'INPUT'`, and
// getNextAutoFillCommand + autoFill both silently abort.
//
// Fix: register a `focusin` listener on capture phase as soon as
// content-page.js loads, and remember the most recent INPUT focused
// by the user. Fall back to that when document.activeElement is no
// longer an input. This does not happen in Chromium (which is why
// the Playwright Chromium repro tests pass end-to-end), but is
// reproducible on Firefox 149 per 2026-04-09 warroom user report.
//
// Use a globalThis key so the tracked value survives re-injection.
// If a re-injection creates a new isolated world, the listener is
// lost but the fallback also re-initializes — acceptable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KW_LAST_INPUT_KEY = '__nkwLastInput';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)[KW_LAST_INPUT_KEY] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[KW_LAST_INPUT_KEY] || null;

function getTrackedActiveInput(): HTMLInputElement | null {
    const active = document.activeElement;
    if (active?.tagName === 'INPUT') {
        return active as HTMLInputElement;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = (globalThis as any)[KW_LAST_INPUT_KEY] as HTMLInputElement | null;
    if (fallback && fallback.isConnected) {
        // eslint-disable-next-line no-console
        console.info('[NKW-Connect] getTrackedActiveInput: using fallback (lost focus)', {
            fallbackId: fallback.id,
            fallbackType: fallback.type
        });
        return fallback;
    }
    return null;
}

if (!window.kwExtensionInstalled) {
    window.kwExtensionInstalled = true;

    // Track last-focused input. Capture phase so we see the event
    // even if the page stops propagation. Ignore non-form inputs
    // (buttons, submits, files — autofill doesn't target those).
    window.addEventListener(
        'focusin',
        (e) => {
            const target = e.target as HTMLElement | null;
            if (
                target?.tagName === 'INPUT' &&
                (target as HTMLInputElement).type !== 'button' &&
                (target as HTMLInputElement).type !== 'submit' &&
                (target as HTMLInputElement).type !== 'file'
            ) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (globalThis as any)[KW_LAST_INPUT_KEY] = target;
            }
        },
        true
    );

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (sender.id !== chrome.runtime.id) {
            return;
        }

        const response = run(message as ContentScriptMessage);
        if (response) {
            sendResponse(response);
        }

        function run(message: ContentScriptMessage): ContentScriptReturn | undefined {
            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] content-page received', {
                action: message.action,
                messageUrl: message.url,
                locationHref: location.href,
                urlMatches: location.href === message.url
            });
            if (location.href !== message.url) {
                // eslint-disable-next-line no-console
                console.warn(
                    '[NKW-Connect] content-page URL mismatch — message dropped. ' +
                        `message.url=${message.url} location.href=${location.href}`
                );
                return;
            }
            switch (message.action) {
                case 'auto-fill':
                    autoFill(message);
                    break;
                case 'get-next-auto-fill-command':
                    return getNextAutoFillCommand();
            }
        }

        function getNextAutoFillCommand() {
            const input = getTrackedActiveInput();
            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] getNextAutoFillCommand', {
                activeTag: document.activeElement?.tagName,
                activeId: (document.activeElement as HTMLElement | null)?.id,
                trackedTag: input?.tagName,
                trackedId: input?.id,
                trackedType: input?.type
            });
            if (!input || input.tagName !== 'INPUT') {
                // eslint-disable-next-line no-console
                console.warn(
                    '[NKW-Connect] getNextAutoFillCommand abort: no tracked input ' +
                        '(neither document.activeElement nor focusin fallback)'
                );
                return;
            }

            let nextCommand;
            if (input.type === 'password') {
                nextCommand = 'submit-password';
            } else {
                const passInput = getNextFormPasswordInput(input);
                if (passInput) {
                    nextCommand = 'submit-username-password';
                } else {
                    nextCommand = 'submit-username';
                }
            }
            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] getNextAutoFillCommand resolved', { nextCommand });
            return { nextCommand };
        }

        function autoFill(arg: ContentScriptMessageAutoFill) {
            const { text, password, submit } = arg;

            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] autoFill start', {
                hasText: !!text,
                hasPassword: !!password,
                submit,
                activeTag: (document.activeElement as HTMLElement | null)?.tagName,
                activeId: (document.activeElement as HTMLElement | null)?.id,
                activeType: (document.activeElement as HTMLInputElement | null)?.type,
                messageUrl: arg.url,
                locationHref: location.href
            });

            let input = getTrackedActiveInput() ?? undefined;
            if (!input) {
                // eslint-disable-next-line no-console
                console.warn(
                    '[NKW-Connect] autoFill abort: no tracked input ' +
                        '(neither document.activeElement nor focusin fallback)'
                );
                return;
            }

            if (!text) {
                // eslint-disable-next-line no-console
                console.warn('[NKW-Connect] autoFill abort: empty text param');
                return;
            }

            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] autoFill setInputText username', {
                targetTag: input.tagName,
                targetType: input.type,
                targetId: input.id,
                valueBefore: input.value
            });
            setInputText(input, text);
            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] autoFill username valueAfter', input.value);

            const form = input.form;
            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] autoFill form present?', !!form, form?.id);

            if (password) {
                input = getNextFormPasswordInput(input);
                if (!input) {
                    // eslint-disable-next-line no-console
                    console.warn('[NKW-Connect] autoFill abort: no password input found after username');
                    return;
                }

                // eslint-disable-next-line no-console
                console.info('[NKW-Connect] autoFill password target', {
                    id: input.id,
                    type: input.type,
                    valueBefore: input.value
                });
                input.focus();
                setInputText(input, password);
                // eslint-disable-next-line no-console
                console.info('[NKW-Connect] autoFill password valueAfter', input.value);
            }

            if (form && submit) {
                // eslint-disable-next-line no-console
                console.info('[NKW-Connect] autoFill submitForm');
                submitForm(form);
            }
            // eslint-disable-next-line no-console
            console.info('[NKW-Connect] autoFill done');
        }

        function setInputText(input: HTMLInputElement, text: string) {
            input.value = text;
            input.dispatchEvent(
                new InputEvent('input', { inputType: 'insertFromPaste', data: text, bubbles: true })
            );
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function getNextFormPasswordInput(input: HTMLInputElement): HTMLInputElement | undefined {
            if (!input.form) {
                const inputs = [...document.querySelectorAll('input')];
                if (!inputs.includes(input)) {
                    return undefined;
                }
                for (let ix = inputs.indexOf(input) + 1; ix < inputs.length; ix++) {
                    const nextInput = inputs[ix] as HTMLInputElement;
                    if (nextInput.form) {
                        return undefined;
                    }
                    switch (nextInput.type) {
                        case 'password':
                            return nextInput;
                        case 'checkbox':
                        case 'hidden':
                            continue;
                        default:
                            return undefined;
                    }
                }
                return undefined;
            }
            let found = false;
            for (const element of input.form.elements) {
                if (found) {
                    if (element.tagName === 'INPUT') {
                        const inputEl = element as HTMLInputElement;
                        if (inputEl.type === 'password') {
                            return inputEl;
                        }
                    }
                }
                if (element === input) {
                    found = true;
                }
            }
            return undefined;
        }

        function submitForm(form: HTMLFormElement) {
            const submitButton = <HTMLInputElement | undefined>(
                form.querySelector('input[type=submit],button[type=submit]')
            );
            if (typeof form.requestSubmit === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                form.requestSubmit(submitButton);
            } else if (submitButton) {
                submitButton.click();
            } else {
                const btn = document.createElement('input');
                btn.type = 'submit';
                btn.hidden = true;
                form.appendChild(btn);
                btn.click();
                form.removeChild(btn);
            }
        }
    });
}

export {};
