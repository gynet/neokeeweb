import { test, expect } from '@playwright/test';

/**
 * Helper: creates a new database and adds an entry with the given title.
 */
async function createDatabaseWithEntry(
    page: import('@playwright/test').Page,
    entryTitle: string
) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create new database
    await page.locator('#open__icon-new').click();
    const passwordInput = page.locator('.open__pass-input');
    await passwordInput.fill('TestMasterPassword123!');
    await page.locator('.open__pass-enter-btn').click();
    await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 });

    // Add an entry with the given title
    await page.locator('.list__search-btn-new').click();
    const titleField = page.locator('.details__header-title');
    await titleField.click();
    await titleField.fill(entryTitle);
}

test.describe('Search', () => {
    // All tests require the core webpack build to serve the app.
    // Remove test.skip once the build is stable.

    test.skip('search field is visible when database is open', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.locator('#open__icon-new').click();
        await page.locator('.open__pass-input').fill('TestMasterPassword123!');
        await page.locator('.open__pass-enter-btn').click();
        await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 });

        const searchField = page.locator('.list__search-field');
        await expect(searchField).toBeVisible();
    });

    test.skip('search filters entries by title', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabaseWithEntry(page, 'UniqueSearchTarget');

        // Also add a second entry so we can verify filtering
        await page.locator('.list__search-btn-new').click();
        const titleField = page.locator('.details__header-title');
        await titleField.click();
        await titleField.fill('Other Entry');

        // Type in the search field
        const searchField = page.locator('.list__search-field');
        await searchField.click();
        await searchField.fill('UniqueSearch');

        // Only the matching entry should be visible
        await expect(page.locator('.list__item').filter({ hasText: 'UniqueSearchTarget' })).toBeVisible();
        await expect(page.locator('.list__item').filter({ hasText: 'Other Entry' })).toBeHidden();
    });

    test.skip('search finds entries by username', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabaseWithEntry(page, 'Username Search Test');

        // Set a username on the entry
        const userField = page.locator('.details__body-fields .details__field')
            .filter({ hasText: /user/i })
            .locator('input, .details__field-value');
        await userField.click();
        await page.keyboard.type('findme_user');

        // Search by username
        const searchField = page.locator('.list__search-field');
        await searchField.click();
        await searchField.fill('findme_user');

        // The entry should appear in results
        await expect(page.locator('.list__item').filter({ hasText: 'Username Search Test' })).toBeVisible();
    });

    test.skip('search finds entries by URL', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabaseWithEntry(page, 'URL Search Test');

        // Set a URL
        const urlField = page.locator('.details__body-fields .details__field')
            .filter({ hasText: /url|website/i })
            .locator('input, .details__field-value');
        await urlField.click();
        await page.keyboard.type('https://unique-domain-test.example.com');

        // Search by URL
        const searchField = page.locator('.list__search-field');
        await searchField.click();
        await searchField.fill('unique-domain-test');

        await expect(page.locator('.list__item').filter({ hasText: 'URL Search Test' })).toBeVisible();
    });

    test.skip('clearing search restores full entry list', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabaseWithEntry(page, 'First Entry');

        await page.locator('.list__search-btn-new').click();
        const titleField = page.locator('.details__header-title');
        await titleField.click();
        await titleField.fill('Second Entry');

        // Search for one entry
        const searchField = page.locator('.list__search-field');
        await searchField.click();
        await searchField.fill('First');
        await expect(page.locator('.list__item').filter({ hasText: 'Second Entry' })).toBeHidden();

        // Clear the search
        await page.locator('.list__search-icon-clear').click();

        // Both entries should be visible again
        await expect(page.locator('.list__item').filter({ hasText: 'First Entry' })).toBeVisible();
        await expect(page.locator('.list__item').filter({ hasText: 'Second Entry' })).toBeVisible();
    });

    test.skip('no results state for unmatched query', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabaseWithEntry(page, 'Existing Entry');

        const searchField = page.locator('.list__search-field');
        await searchField.click();
        await searchField.fill('xyznonexistent999');

        // The list should show a "no entries" or empty state
        const emptyState = page.locator('.list__items--empty, .list-empty');
        await expect(emptyState).toBeVisible();
    });

    test.skip('Ctrl+F focuses the search field', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.locator('#open__icon-new').click();
        await page.locator('.open__pass-input').fill('TestMasterPassword123!');
        await page.locator('.open__pass-enter-btn').click();
        await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 });

        // Use platform-appropriate shortcut
        const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+f`);

        const searchField = page.locator('.list__search-field');
        await expect(searchField).toBeFocused();
    });

    test.skip('advanced search options toggle', async ({ page }) => {
        // Requires core build to serve the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.locator('#open__icon-new').click();
        await page.locator('.open__pass-input').fill('TestMasterPassword123!');
        await page.locator('.open__pass-enter-btn').click();
        await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 });

        // Click the search icon caret to toggle advanced options
        await page.locator('.list__search-icon-search').click();

        const advancedPanel = page.locator('.list__search-adv');
        await expect(advancedPanel).toBeVisible();

        // Verify checkboxes for search scopes exist
        await expect(page.locator('#list__search-adv-check-title')).toBeVisible();
        await expect(page.locator('#list__search-adv-check-user')).toBeVisible();
        await expect(page.locator('#list__search-adv-check-website')).toBeVisible();
        await expect(page.locator('#list__search-adv-check-notes')).toBeVisible();
    });

    test.skip('case-sensitive search option works', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabaseWithEntry(page, 'CaseSensitiveTest');

        // Enable case-sensitive search
        await page.locator('.list__search-icon-search').click();
        const csCheckbox = page.locator('#list__search-adv-check-cs');
        if (!(await csCheckbox.isChecked())) {
            await csCheckbox.check();
        }

        // Search with wrong case should not match
        const searchField = page.locator('.list__search-field');
        await searchField.click();
        await searchField.fill('casesensitivetest');
        await expect(page.locator('.list__item').filter({ hasText: 'CaseSensitiveTest' })).toBeHidden();

        // Search with correct case should match
        await searchField.fill('CaseSensitiveTest');
        await expect(page.locator('.list__item').filter({ hasText: 'CaseSensitiveTest' })).toBeVisible();
    });

    test.skip('regex search option works', async ({ page }) => {
        // Requires core build to serve the app
        await createDatabaseWithEntry(page, 'RegexTest123');

        // Enable regex search
        await page.locator('.list__search-icon-search').click();
        const regexCheckbox = page.locator('#list__search-adv-check-regex');
        if (!(await regexCheckbox.isChecked())) {
            await regexCheckbox.check();
        }

        // Use regex pattern
        const searchField = page.locator('.list__search-field');
        await searchField.click();
        await searchField.fill('Regex.*\\d{3}');
        await expect(page.locator('.list__item').filter({ hasText: 'RegexTest123' })).toBeVisible();
    });
});
