import { test, expect } from '@playwright/test';

/**
 * Helper: creates a new database to access the main app UI.
 */
async function createDatabase(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#open__icon-new').click();
    const passwordInput = page.locator('.open__pass-input');
    await passwordInput.fill('TestMasterPassword123!');
    await page.locator('.open__pass-enter-btn').click();
    await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 });
}

test.describe('Settings', () => {
    // All tests require the core webpack build to serve the app.
    // Remove test.skip once the build is stable.

    test.skip('settings page loads from menu', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabase(page);

        // Open settings via the menu footer or gear icon
        // The menu has a settings item at the bottom
        const settingsMenuItem = page.locator('.menu__item')
            .filter({ hasText: /settings/i })
            .first();

        // If not visible directly, try the footer button
        const settingsBtn = settingsMenuItem.or(
            page.locator('.footer__btn[title*="settings" i], .fa-cog')
        ).first();

        await settingsBtn.click();

        // Settings view should be visible
        const settingsView = page.locator('.settings');
        await expect(settingsView).toBeVisible();
    });

    test.skip('back to app button returns to main view', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabase(page);

        // Navigate to settings
        const settingsBtn = page.locator('.menu__item')
            .filter({ hasText: /settings/i })
            .first()
            .or(page.locator('.footer__btn[title*="settings" i], .fa-cog').first());
        await settingsBtn.first().click();
        await expect(page.locator('.settings')).toBeVisible();

        // Click "Back to app" button
        const backButton = page.locator('.settings__back-button');
        await expect(backButton).toBeVisible();
        await backButton.click();

        // Should return to the main app view (list + details)
        await expect(page.locator('.settings')).toBeHidden();
        await expect(page.locator('.list')).toBeVisible();
    });

    test.skip('general settings tab is interactive', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabase(page);

        // Navigate to settings
        const settingsBtn = page.locator('.menu__item')
            .filter({ hasText: /settings/i })
            .first()
            .or(page.locator('.footer__btn[title*="settings" i], .fa-cog').first());
        await settingsBtn.first().click();
        await expect(page.locator('.settings')).toBeVisible();

        // Click on General settings tab
        const generalTab = page.locator('.settings__menu-item, .menu__item')
            .filter({ hasText: /general/i });
        await generalTab.click();

        // General settings content should be visible with interactive elements
        const generalContent = page.locator('.settings-general, .settings__content');
        await expect(generalContent).toBeVisible();

        // Should contain toggles/checkboxes/selects
        const interactiveElements = generalContent.locator('input, select, button, .toggle');
        const count = await interactiveElements.count();
        expect(count).toBeGreaterThan(0);
    });

    test.skip('shortcuts settings tab shows key bindings', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabase(page);

        // Navigate to settings
        const settingsBtn = page.locator('.menu__item')
            .filter({ hasText: /settings/i })
            .first()
            .or(page.locator('.footer__btn[title*="settings" i], .fa-cog').first());
        await settingsBtn.first().click();

        // Click on Shortcuts tab
        const shortcutsTab = page.locator('.settings__menu-item, .menu__item')
            .filter({ hasText: /shortcut/i });
        await shortcutsTab.click();

        // Should display keyboard shortcut bindings
        const shortcutsContent = page.locator('.settings-shortcuts, .settings__content');
        await expect(shortcutsContent).toBeVisible();

        // Should contain at least one shortcut row
        const shortcutRows = shortcutsContent.locator('.shortcut, tr, .settings__shortcut');
        const count = await shortcutRows.count();
        expect(count).toBeGreaterThan(0);
    });

    test.skip('about section shows version info', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabase(page);

        // Navigate to settings
        const settingsBtn = page.locator('.menu__item')
            .filter({ hasText: /settings/i })
            .first()
            .or(page.locator('.footer__btn[title*="settings" i], .fa-cog').first());
        await settingsBtn.first().click();

        // Click on About tab
        const aboutTab = page.locator('.settings__menu-item, .menu__item')
            .filter({ hasText: /about/i });
        await aboutTab.click();

        // Should show version information
        const aboutContent = page.locator('.settings-about, .settings__content');
        await expect(aboutContent).toBeVisible();
        await expect(aboutContent).toContainText(/version|v\d/i);
    });

    test.skip('browser settings tab renders', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabase(page);

        const settingsBtn = page.locator('.menu__item')
            .filter({ hasText: /settings/i })
            .first()
            .or(page.locator('.footer__btn[title*="settings" i], .fa-cog').first());
        await settingsBtn.first().click();

        const browserTab = page.locator('.settings__menu-item, .menu__item')
            .filter({ hasText: /browser/i });
        await browserTab.click();

        const browserContent = page.locator('.settings-browser, .settings__content');
        await expect(browserContent).toBeVisible();
    });

    test.skip('plugins settings tab renders', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabase(page);

        const settingsBtn = page.locator('.menu__item')
            .filter({ hasText: /settings/i })
            .first()
            .or(page.locator('.footer__btn[title*="settings" i], .fa-cog').first());
        await settingsBtn.first().click();

        const pluginsTab = page.locator('.settings__menu-item, .menu__item')
            .filter({ hasText: /plugin/i });
        await pluginsTab.click();

        const pluginsContent = page.locator('.settings-plugins, .settings__content');
        await expect(pluginsContent).toBeVisible();
    });
});
