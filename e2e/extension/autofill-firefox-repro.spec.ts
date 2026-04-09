import { test, expect, firefox } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

/**
 * Firefox autofill reproduction. The Chromium equivalent
 * (autofill-github-repro.spec.ts) PASSES, which means the user's
 * Firefox-specific failure must be rooted in Firefox's different
 * extension handling — likely MV3 background.scripts vs
 * background.service_worker, or the way Firefox injects content
 * scripts via chrome.scripting.executeScript.
 *
 * Firefox extension loading in Playwright is unofficially supported
 * via the pre-populated profile trick:
 *   1. Create a firefox profile directory
 *   2. Copy the built xpi into <profile>/extensions/<gecko-id>.xpi
 *   3. Set xpinstall.signatures.required = false via user.js
 *   4. Launch firefox.launchPersistentContext(profile)
 *
 * If Playwright's bundled Firefox honors the sig pref, the extension
 * loads and we can drive it. Firefox MV3 does NOT expose a service
 * worker — instead there's a background "scripts" page. Playwright
 * should expose it via context.backgroundPages() or newer
 * context.backgroundPage events.
 */

const XPI_PATH = path.resolve(
    __dirname,
    '../../packages/extension/web-ext-artifacts/neokeeweb_connect-1.0.0.zip'
);
const GECKO_ID = 'keeweb-connect-addon@keeweb.info';

test.describe('Firefox — extension autofill on real github.com', () => {
    test('loads extension + fills github login form', async () => {
        expect(fs.existsSync(XPI_PATH),
            `firefox xpi must be built: cd packages/extension && bun run build-firefox`).toBe(true);

        // Create profile with extension pre-installed
        const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-ext-'));
        const extensionsDir = path.join(profileDir, 'extensions');
        fs.mkdirSync(extensionsDir, { recursive: true });
        fs.copyFileSync(XPI_PATH, path.join(extensionsDir, `${GECKO_ID}.xpi`));

        // Disable signature requirement + force-enable the extension
        // on first run. `extensions.autoDisableScopes=0` means ALL
        // newly-discovered extensions are auto-enabled without asking.
        fs.writeFileSync(
            path.join(profileDir, 'user.js'),
            `
user_pref("xpinstall.signatures.required", false);
user_pref("extensions.autoDisableScopes", 0);
user_pref("extensions.enabledScopes", 15);
user_pref("extensions.startupScanScopes", 15);
user_pref("extensions.logging.enabled", true);
user_pref("devtools.chrome.enabled", true);
user_pref("devtools.debugger.remote-enabled", true);
`
        );

        const context = await firefox.launchPersistentContext(profileDir, {
            headless: false,
            timeout: 60_000
        });

        try {
            // Firefox MV3: background is a scripts page, not a service worker.
            // Playwright exposes it via backgroundPages() (same as MV2 in chromium).
            // Wait for at least one to spin up.
            let bgPages = context.backgroundPages();
            if (bgPages.length === 0) {
                // Give extension a few seconds to initialize
                await new Promise((r) => setTimeout(r, 3000));
                bgPages = context.backgroundPages();
            }
            // eslint-disable-next-line no-console
            console.log('Firefox background pages found:', bgPages.length);
            // eslint-disable-next-line no-console
            console.log('Background urls:', bgPages.map((p) => p.url()));

            if (bgPages.length === 0) {
                // Dump extension state for diagnosis
                const diag = await context.newPage();
                await diag.goto('about:debugging#/runtime/this-firefox');
                await diag.waitForTimeout(2000);
                const html = await diag.content();
                // eslint-disable-next-line no-console
                console.log('about:debugging snippet:',
                    html.match(/extension[^<]{0,500}/gi)?.slice(0, 5).join('\n---\n') || 'none');
                await diag.close();
                throw new Error('Firefox background page never loaded — extension did not activate');
            }

            const bg = bgPages[0];

            // Open github.com/login
            const githubPage = await context.newPage();
            const ghLogs: string[] = [];
            githubPage.on('console', (m) => ghLogs.push(`[${m.type()}] ${m.text()}`));
            githubPage.on('pageerror', (e) => ghLogs.push(`[err] ${e.message}`));
            await githubPage.goto('https://github.com/login', {
                waitUntil: 'domcontentloaded',
                timeout: 30_000
            });
            await githubPage.waitForSelector('#login_field');
            await githubPage.focus('#login_field');
            expect(await githubPage.evaluate(() => document.activeElement?.id)).toBe('login_field');

            // Dispatch auto-fill from background
            const realUrl = await githubPage.evaluate(() => location.href);
            const dispatchResult = await bg.evaluate(
                async ({ targetUrl }) => {
                    // Firefox exposes both `chrome` and `browser` — use browser for clarity
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const api: any = (globalThis as any).browser || (globalThis as any).chrome;
                    const tabs = await api.tabs.query({});
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const tab = tabs.find((t: any) => t.url?.startsWith('https://github.com/login'));
                    if (!tab) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        return { error: 'no github tab', allTabs: tabs.map((t: any) => t.url) };
                    }
                    try {
                        await api.scripting.executeScript({
                            files: ['js/content-page.js'],
                            target: { tabId: tab.id, allFrames: true }
                        });
                    } catch (e) {
                        return { error: 'scripting.executeScript: ' + (e as Error).message };
                    }
                    await new Promise((r) => setTimeout(r, 300));
                    return new Promise<unknown>((resolve) => {
                        api.tabs
                            .sendMessage(
                                tab.id,
                                {
                                    action: 'auto-fill',
                                    url: tab.url,
                                    text: 'gynet.gy@gmail.com',
                                    password: 'testpassword-ff-repro',
                                    submit: false
                                },
                                { frameId: 0 }
                            )
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .then((resp: any) => resolve({ ok: true, resp }))
                            .catch((err: Error) => resolve({ ok: false, err: err.message }));
                    });
                },
                { targetUrl: realUrl }
            );
            // eslint-disable-next-line no-console
            console.log('Dispatch result:', JSON.stringify(dispatchResult));

            await githubPage.waitForTimeout(2000);

            const formState = await githubPage.evaluate(() => ({
                loginFieldValue: (document.getElementById('login_field') as HTMLInputElement).value,
                passwordValue: (document.getElementById('password') as HTMLInputElement).value
            }));
            // eslint-disable-next-line no-console
            console.log('Final form state:', JSON.stringify(formState));
            // eslint-disable-next-line no-console
            console.log(
                'GitHub tab NKW-Connect logs:\n' +
                    ghLogs.filter((l) => l.includes('NKW-Connect')).join('\n')
            );
            // eslint-disable-next-line no-console
            console.log('All github logs (tail):\n' + ghLogs.slice(-30).join('\n'));

            expect(
                formState.loginFieldValue,
                `login field must be filled. dispatch=${JSON.stringify(dispatchResult)}`
            ).toBe('gynet.gy@gmail.com');
            expect(formState.passwordValue).toBe('testpassword-ff-repro');
        } finally {
            await context.close();
            fs.rmSync(profileDir, { recursive: true, force: true });
        }
    });
});
