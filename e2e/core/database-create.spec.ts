import { test, expect } from '@playwright/test';

test.describe('Database Creation', () => {
    // All tests require the core webpack build to serve the app on localhost:8085.
    // Once the build is stable, remove test.skip and run against the dev server.

    test.skip('new database button is visible on open screen', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const newButton = page.locator('#open__icon-new');
        await expect(newButton).toBeVisible();
        await expect(newButton).toContainText(/new/i);
    });

    test.skip('clicking new opens password input field', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.locator('#open__icon-new').click();

        const passwordInput = page.locator('.open__pass-input');
        await expect(passwordInput).toBeVisible();
        await expect(passwordInput).not.toHaveAttribute('readonly');
    });

    test.skip('create KDBX4 database with password', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Click "New" to create a new database
        await page.locator('#open__icon-new').click();

        // Enter master password
        const passwordInput = page.locator('.open__pass-input');
        await expect(passwordInput).toBeVisible();
        await passwordInput.fill('TestMasterPassword123!');

        // Submit the password (click enter button or press Enter)
        await page.locator('.open__pass-enter-btn').click();

        // Wait for the database to be created - main app UI should appear
        // The app transitions from the open view to the main view with menu + list + details
        await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 });
    });

    test.skip('newly created database has default group structure', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Create a new database
        await page.locator('#open__icon-new').click();
        const passwordInput = page.locator('.open__pass-input');
        await passwordInput.fill('TestMasterPassword123!');
        await page.locator('.open__pass-enter-btn').click();

        // Wait for main UI
        await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 });

        // Default KeePass databases have a root group (often named "New" or the db name)
        // The menu should show at least one group
        const menuItems = page.locator('.menu__item');
        await expect(menuItems.first()).toBeVisible();
    });

    test.skip('cancel during creation returns to open screen', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Click "New"
        await page.locator('#open__icon-new').click();

        // Verify password area is shown
        const passwordInput = page.locator('.open__pass-input');
        await expect(passwordInput).toBeVisible();

        // Press Escape to cancel
        await page.keyboard.press('Escape');

        // Should return to the open screen with the icon buttons visible
        await expect(page.locator('#open__icon-new')).toBeVisible();
    });

    test.skip('weak password shows warning', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.locator('#open__icon-new').click();

        const passwordInput = page.locator('.open__pass-input');
        await passwordInput.fill('123');

        // The app may show a warning for weak passwords
        // Exact behavior depends on implementation - check for warning element
        await page.locator('.open__pass-enter-btn').click();

        // Look for any warning or confirmation dialog
        const warning = page.locator('.open__pass-warning, .modal');
        // This assertion may need adjustment based on actual app behavior
        await expect(warning).toBeVisible({ timeout: 5_000 });
    });
});
