import { backend } from './backend';
import { createUIMenus, bindExtensionButtonClick } from './ui';
import { startInternalIpc } from './internal-ipc';
import { startCommandListener, runCommand } from './commands';
import { noop } from 'common/utils';

// Test hook — exposes runCommand to Playwright E2E tests via
// `sw.evaluate(() => self.__nkwTestRunCommand(...))`. Lets the test
// drive the exact same code path that chrome.commands.onCommand
// triggers on a real Ctrl+Shift+U keypress, without needing to
// simulate keyboard shortcuts (which Playwright cannot dispatch to
// extension command listeners). Also exposes backend so tests can
// introspect connection state.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__nkwTestRunCommand = runCommand;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__nkwTestBackend = backend;

let startPromise: Promise<void>;

chrome.runtime.onStartup.addListener(startAndReportError);
chrome.runtime.onInstalled.addListener((e) => {
    startAndReportError()
        .then(() => {
            if (e.reason === ('install' as chrome.runtime.OnInstalledReason)) {
                void chrome.runtime.openOptionsPage();
            }
        })
        .catch(noop);
});

startAndReportError().catch(noop);

function startAndReportError(): Promise<void> {
    if (startPromise !== undefined) {
        return startPromise;
    }
    startPromise = start().catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Startup error', e);
    });
    return startPromise;
}

async function start() {
    startCommandListener();
    createUIMenus();
    bindExtensionButtonClick();
    startInternalIpc();

    await backend.init();
}
