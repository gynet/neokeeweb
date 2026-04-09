import { test, expect } from '@playwright/test';

/**
 * Live demo smoke tests — run against the deployed gh-pages URL, NOT the
 * local dev server. Purpose: detect the class of failure where CI reports
 * green but the demo is silently frozen on a stale build, or a manifest
 * drifts back to upstream "KeeWeb" branding.
 *
 * Triggered by: .github/workflows/deploy-pages.yml `verify-live` job,
 * after the deploy job reports success. Also runnable locally:
 *   NEOKEEWEB_LIVE_URL=https://gynet.github.io/neokeeweb/ \
 *     bun run test:e2e:live
 *
 * SHA drift check only runs in CI (needs GITHUB_SHA env), so local runs
 * only cover HTTP/branding/icons.
 */

const LIVE_URL = process.env.NEOKEEWEB_LIVE_URL || 'https://gynet.github.io/neokeeweb/';
const RAW_SHA = process.env.GITHUB_SHA || process.env.GIT_SHA || '';
const EXPECTED_SHA_SHORT = RAW_SHA.slice(0, 7);

// Ensure LIVE_URL ends with a slash so `new URL('manifest.json', LIVE_URL)`
// resolves against the directory, not its parent.
const BASE = LIVE_URL.endsWith('/') ? LIVE_URL : `${LIVE_URL}/`;

test.describe('live demo smoke', () => {
    test('HTTP 200 + title + branding', async ({ page, request }) => {
        const response = await page.goto(BASE);
        expect(response?.status(), 'HTTP status for app entry').toBe(200);
        await expect(page).toHaveTitle(/NeoKeeWeb/i);

        const manifestResponse = await request.get(new URL('manifest.json', BASE).href);
        expect(manifestResponse.status(), 'manifest.json HTTP status').toBe(200);
        const manifest = await manifestResponse.json();
        expect(manifest.name, 'manifest.name').toMatch(/NeoKeeWeb/i);
        // Stale upstream branding: catches the exact regression we saw on
        // 2026-04-08 where gh-pages served a 6+ month old KeeWeb build.
        expect(manifest.name, 'manifest.name must not be upstream KeeWeb').not.toMatch(
            /^KeeWeb$/
        );
    });

    test('bundle SHA matches expected deploy commit', async ({ page }) => {
        test.skip(
            !EXPECTED_SHA_SHORT,
            'No expected SHA in env (GITHUB_SHA / GIT_SHA) — drift check only runs in CI'
        );

        await page.goto(BASE);
        // Wait for webpack's DefinePlugin-emitted globals to be attached
        // to window by app.ts startup code. If this times out, the bundle
        // on gh-pages predates the DefinePlugin change — already a drift
        // failure the verify-live job exists to catch.
        await page.waitForFunction(
            () => typeof (window as unknown as Record<string, unknown>)
                .__NEOKEEWEB_BUILD_SHA_SHORT__ === 'string',
            { timeout: 15_000 }
        );
        const liveSha = await page.evaluate(
            () => (window as unknown as Record<string, string>).__NEOKEEWEB_BUILD_SHA_SHORT__
        );
        expect(
            liveSha,
            `Live demo is serving commit ${liveSha} but we just deployed ${EXPECTED_SHA_SHORT}`
        ).toBe(EXPECTED_SHA_SHORT);
    });

    test('body has theme class applied (not stale stub)', async ({ page }) => {
        // Catches the catastrophic regression where SettingsManager.setTheme()
        // was a no-op stub and the live demo's only "theme" was whatever
        // class was hardcoded in index.html. After the 2026-04-09 warroom fix,
        // SettingsManager.setBySettings() runs at boot and confirms the body
        // has a /^th-/ class. If a future change re-stubs setBySettings or
        // breaks SettingsManager init, this test will turn red.
        await page.goto(BASE);
        await page.waitForLoadState('networkidle');
        const bodyClass = await page.evaluate(() => document.body.className);
        expect(bodyClass, 'body must have a theme class').toMatch(/(^|\s)th-/);
    });

    test('all manifest icons resolve', async ({ request }) => {
        const manifestResponse = await request.get(new URL('manifest.json', BASE).href);
        expect(manifestResponse.status()).toBe(200);
        const manifest = await manifestResponse.json();
        const icons: { src: string }[] = manifest.icons || [];
        expect(icons.length, 'manifest.icons should be non-empty').toBeGreaterThan(0);
        for (const icon of icons) {
            const iconUrl = new URL(icon.src, BASE).href;
            const resp = await request.get(iconUrl);
            expect(resp.status(), `icon ${icon.src}`).toBe(200);
        }
    });
});
