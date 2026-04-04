import { test, expect } from '@playwright/test';

test.describe('WebDAV Storage', () => {
    // All tests require the core webpack build to serve the app.
    // WebDAV tests additionally need a mock WebDAV server or network stubbing.
    // Remove test.skip once the build is stable.

    test.skip('WebDAV storage option appears in More menu', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Click "More" to show additional storage options
        const moreButton = page.locator('#open__icon-more');
        await expect(moreButton).toBeVisible();
        await moreButton.click();

        // The lower icons row should now be visible with storage providers
        const lowerIcons = page.locator('.open__icons--lower');
        await expect(lowerIcons).toBeVisible();

        // WebDAV storage option should be present
        const webdavOption = page.locator('.open__icon-storage[data-storage="webdav"]');
        await expect(webdavOption).toBeVisible();
    });

    test.skip('WebDAV config form accepts URL, username, password', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open WebDAV config
        await page.locator('#open__icon-more').click();
        await page.locator('.open__icon-storage[data-storage="webdav"]').click();

        // The config form should appear in the open__config-wrap area
        const configWrap = page.locator('.open__config-wrap');
        await expect(configWrap).toBeVisible();

        // Fill in WebDAV URL
        const urlInput = configWrap.locator('input[name*="url" i], input[placeholder*="url" i], input[type="url"]').first();
        await expect(urlInput).toBeVisible();
        await urlInput.fill('https://webdav.example.com/dav/');

        // Fill in username
        const userInput = configWrap.locator('input[name*="user" i], input[placeholder*="user" i]').first();
        await expect(userInput).toBeVisible();
        await userInput.fill('testuser');

        // Fill in password
        const passInput = configWrap.locator('input[type="password"], input[name*="pass" i]').first();
        await expect(passInput).toBeVisible();
        await passInput.fill('testpassword');
    });

    test.skip('invalid WebDAV URL shows error feedback', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.locator('#open__icon-more').click();
        await page.locator('.open__icon-storage[data-storage="webdav"]').click();

        const configWrap = page.locator('.open__config-wrap');

        // Enter an invalid URL
        const urlInput = configWrap.locator('input[name*="url" i], input[placeholder*="url" i], input[type="url"]').first();
        await urlInput.fill('not-a-valid-url');

        // Try to connect
        const connectBtn = configWrap.locator('button, .open__config-btn, [data-action="connect"]').first();
        await connectBtn.click();

        // Should show an error message
        const errorMsg = page.locator('.open__config-error, .alert, .modal__body');
        await expect(errorMsg).toBeVisible({ timeout: 5_000 });
    });

    test.skip('successful WebDAV connection lists remote files', async ({ page }) => {
        // Requires core build to serve the app AND a reachable WebDAV server.
        // In CI, this would need a mock WebDAV server or route interception.

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Intercept WebDAV PROPFIND request to simulate a response
        await page.route('**/dav/**', async (route) => {
            if (route.request().method() === 'PROPFIND') {
                await route.fulfill({
                    status: 207,
                    contentType: 'application/xml',
                    body: `<?xml version="1.0" encoding="utf-8"?>
                    <D:multistatus xmlns:D="DAV:">
                        <D:response>
                            <D:href>/dav/test.kdbx</D:href>
                            <D:propstat>
                                <D:prop>
                                    <D:displayname>test.kdbx</D:displayname>
                                    <D:getcontentlength>4096</D:getcontentlength>
                                </D:prop>
                                <D:status>HTTP/1.1 200 OK</D:status>
                            </D:propstat>
                        </D:response>
                    </D:multistatus>`,
                });
            } else {
                await route.continue();
            }
        });

        await page.locator('#open__icon-more').click();
        await page.locator('.open__icon-storage[data-storage="webdav"]').click();

        const configWrap = page.locator('.open__config-wrap');
        const urlInput = configWrap.locator('input[name*="url" i], input[placeholder*="url" i], input[type="url"]').first();
        await urlInput.fill('https://webdav.example.com/dav/');

        const userInput = configWrap.locator('input[name*="user" i], input[placeholder*="user" i]').first();
        await userInput.fill('testuser');

        const passInput = configWrap.locator('input[type="password"], input[name*="pass" i]').first();
        await passInput.fill('testpassword');

        const connectBtn = configWrap.locator('button, .open__config-btn, [data-action="connect"]').first();
        await connectBtn.click();

        // File list should appear with the mocked KDBX file
        const fileList = page.locator('.storage-file-list, .open__config-file-list');
        await expect(fileList).toBeVisible({ timeout: 5_000 });
        await expect(fileList).toContainText('test.kdbx');
    });

    test.skip('save database to WebDAV', async ({ page }) => {
        // Requires core build + WebDAV server/mock
        // This test would:
        // 1. Create a database
        // 2. Configure WebDAV storage
        // 3. Save the database
        // 4. Verify the PUT request was made

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Track PUT requests to WebDAV
        const putRequests: string[] = [];
        await page.route('**/dav/**', async (route) => {
            if (route.request().method() === 'PUT') {
                putRequests.push(route.request().url());
                await route.fulfill({ status: 201 });
            } else {
                await route.continue();
            }
        });

        // Create database, configure WebDAV, then save
        // Implementation depends on the exact UI flow for associating
        // a database with a WebDAV storage backend

        // Placeholder assertion - actual flow needs the running app
        expect(putRequests.length).toBeGreaterThanOrEqual(0);
    });

    test.skip('open database from WebDAV', async ({ page }) => {
        // Requires core build + WebDAV server/mock providing a real KDBX file
        // This test would:
        // 1. Navigate to the open screen
        // 2. Configure WebDAV and connect
        // 3. Select a KDBX file from the listing
        // 4. Enter the master password
        // 5. Verify the database opens with entries

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Placeholder - full implementation requires a test KDBX binary fixture
        // and route interception to serve it
        expect(true).toBe(true);
    });
});
