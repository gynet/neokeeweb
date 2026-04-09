import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * Live-demo persistence smoke — mirror of `e2e/core/persistence.spec.ts`
 * but targeting the deployed gh-pages URL. Runs in the `live`
 * Playwright project (see `playwright.config.ts`), which means:
 *
 *   - No local dev server is launched.
 *   - baseURL is `NEOKEEWEB_LIVE_URL` (default
 *     https://gynet.github.io/neokeeweb/).
 *   - Invoked by CI `verify-live` job after deploy, and locally via
 *     `bun run test:e2e:live`.
 *
 * Purpose: catch the class of regression where the code merge passes
 * unit tests but the deployed bundle still has the stubbed
 * SettingsStore (silent-failure layer the 2026-04-09 warroom found).
 * Along with `smoke-live.spec.ts` (branding + SHA drift) this gives
 * the live demo end-to-end runtime coverage.
 *
 * Cleanup: tests clear `localStorage` + `FilesCache` IndexedDB on
 * both setup and teardown so accumulated state from prior runs
 * doesn't leak across CI invocations.
 */

const LIVE_URL = process.env.NEOKEEWEB_LIVE_URL || 'https://gynet.github.io/neokeeweb/';
const BASE = LIVE_URL.endsWith('/') ? LIVE_URL : `${LIVE_URL}/`;

const KDBX4_FILE = path.resolve(
    __dirname,
    '../../packages/db/resources/KDBX4.1.kdbx'
);
const KDBX4_PASSWORD = 'test';
const KDBX4_BASENAME = 'KDBX4.1';

async function clearAllPersistence(page: Page): Promise<void> {
    await page.evaluate(async () => {
        try {
            localStorage.clear();
        } catch {
            /* ignore */
        }
        try {
            const req = indexedDB.deleteDatabase('FilesCache');
            await new Promise<void>((resolve) => {
                req.onsuccess = (): void => resolve();
                req.onerror = (): void => resolve();
                req.onblocked = (): void => resolve();
            });
        } catch {
            /* ignore */
        }
    });
}

async function uploadAndUnlock(page: Page): Promise<void> {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#open__icon-open').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(KDBX4_FILE);

    const modal = page.locator('.modal');
    await expect(modal).toBeVisible({ timeout: 15_000 });
    const okButton = page.locator('.modal__buttons button[data-result="ok"]');
    await expect(okButton).toBeVisible({ timeout: 5_000 });
    await modal.evaluate((el) => {
        return new Promise<void>((resolve) => {
            const animations = el.getAnimations({ subtree: true });
            if (animations.length === 0) return resolve();
            Promise.all(animations.map((a) => a.finished)).then(() => resolve());
        });
    });
    await okButton.click();

    const passwordInput = page.locator('.open__pass-input');
    await expect(passwordInput).not.toHaveAttribute('readonly', '', {
        timeout: 15_000
    });
    await passwordInput.fill(KDBX4_PASSWORD);
    await page.locator('.open__pass-enter-btn').click();

    await expect(page.locator('.list__item').first()).toBeVisible({ timeout: 45_000 });
}

test.describe('live demo persistence', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE);
        await page.waitForLoadState('networkidle');
        await clearAllPersistence(page);
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test.afterEach(async ({ page }) => {
        // Leave the live demo as we found it so repeated CI runs
        // don't accumulate state across invocations.
        try {
            await clearAllPersistence(page);
        } catch {
            /* best effort — test already finished */
        }
    });

    test('upload -> reload -> recent files visible -> reopen', async ({ page }) => {
        test.setTimeout(120_000);

        await expect(page.locator('#open__icon-open')).toBeVisible({ timeout: 20_000 });
        await uploadAndUnlock(page);

        // Sanity check that the live bundle actually decoded the file.
        const entriesBefore = await page.locator('.list__item').count();
        expect(entriesBefore).toBeGreaterThan(0);

        // Assert the SettingsStore side effect: fileInfos is stored
        // in localStorage under the camelCased key. This is the
        // direct marker for the regression — if the live deploy
        // reintroduces the stub, `fileInfo` will be absent or empty
        // and this assertion fails with a clear message.
        const storedFileInfo = await page.evaluate(() => localStorage.getItem('fileInfo'));
        expect(
            storedFileInfo,
            'live demo must write fileInfos via SettingsStore after a successful open'
        ).toBeTruthy();
        const parsed = JSON.parse(storedFileInfo!) as { name: string }[];
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.some((f) => f.name === KDBX4_BASENAME)).toBe(true);

        // Reload and confirm the recent file survived.
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('#open__icon-open')).toBeVisible({ timeout: 20_000 });

        const recentItem = page.locator('.open__last-item').first();
        await expect(
            recentItem,
            'live demo: recent files list must render after reload'
        ).toBeVisible({ timeout: 15_000 });
        const recentText = await recentItem.locator('.open__last-item-text').innerText();
        expect(recentText).toBe(KDBX4_BASENAME);

        // Click the recent item and re-enter the password. Entries
        // must load from the cached .kdbx bytes in FilesCache IDB.
        await recentItem.click();
        const passwordInput = page.locator('.open__pass-input');
        await expect(passwordInput).not.toHaveAttribute('readonly', '', {
            timeout: 15_000
        });
        await passwordInput.fill(KDBX4_PASSWORD);
        await page.locator('.open__pass-enter-btn').click();

        await expect(page.locator('.list__item').first()).toBeVisible({
            timeout: 45_000
        });
        const entriesAfter = await page.locator('.list__item').count();
        expect(entriesAfter).toBeGreaterThan(0);
    });
});
