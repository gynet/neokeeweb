import { test, expect } from '@playwright/test';

/**
 * Helper: creates a new database and waits for the main UI.
 * Reused across entry management tests to get past the open screen.
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

test.describe('Entry Management', () => {
    // All tests require the core webpack build to serve the app.
    // Remove test.skip once the build is stable.

    test.describe('Add Entry', () => {
        test.skip('add new entry via plus button', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            // Click the "+" button in the list header to add a new entry
            const addButton = page.locator('.list__search-btn-new');
            await expect(addButton).toBeVisible();
            await addButton.click();

            // The details panel should open with editable fields
            const detailsPanel = page.locator('.details');
            await expect(detailsPanel).toBeVisible();
        });

        test.skip('fill title, username, password, url, notes', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            // Add a new entry
            await page.locator('.list__search-btn-new').click();

            // Fill in the title field
            const titleField = page.locator('.details__header-title');
            await expect(titleField).toBeVisible();
            await titleField.click();
            await titleField.fill('Test Entry');

            // Fill in the username field - fields are rendered dynamically
            // KeeWeb uses custom field components; locate by label text
            const userField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /user/i })
                .locator('input, .details__field-value');
            await userField.click();
            await page.keyboard.type('testuser@example.com');

            // Fill in the password field
            const passField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /password/i })
                .locator('input, .details__field-value');
            await passField.click();
            await page.keyboard.type('SecureP@ss123');

            // Fill URL
            const urlField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /url|website/i })
                .locator('input, .details__field-value');
            await urlField.click();
            await page.keyboard.type('https://example.com');

            // Fill Notes
            const notesField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /notes/i })
                .locator('textarea, .details__field-value');
            await notesField.click();
            await page.keyboard.type('Test notes for this entry');

            // Verify the entry title is updated in the list
            const listItem = page.locator('.list__item').filter({ hasText: 'Test Entry' });
            await expect(listItem).toBeVisible();
        });

        test.skip('newly created entry appears in the list', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            await page.locator('.list__search-btn-new').click();

            // Set a title
            const titleField = page.locator('.details__header-title');
            await titleField.click();
            await titleField.fill('My New Entry');

            // The entry should appear in the list panel
            const listItem = page.locator('.list__item').filter({ hasText: 'My New Entry' });
            await expect(listItem).toBeVisible();
        });
    });

    test.describe('View Entry', () => {
        test.skip('click entry to view details', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            // Create an entry first
            await page.locator('.list__search-btn-new').click();
            const titleField = page.locator('.details__header-title');
            await titleField.click();
            await titleField.fill('Viewable Entry');

            // Click the entry in the list
            const listItem = page.locator('.list__item').filter({ hasText: 'Viewable Entry' });
            await listItem.click();

            // Details panel should show the entry
            const detailsTitle = page.locator('.details__header-title');
            await expect(detailsTitle).toHaveValue('Viewable Entry');
        });
    });

    test.describe('Edit Entry', () => {
        test.skip('edit existing entry title', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            // Create an entry
            await page.locator('.list__search-btn-new').click();
            const titleField = page.locator('.details__header-title');
            await titleField.click();
            await titleField.fill('Original Title');

            // Click elsewhere to deselect, then click back
            await page.locator('.list__item').filter({ hasText: 'Original Title' }).click();

            // Edit the title
            const editTitle = page.locator('.details__header-title');
            await editTitle.click();
            await editTitle.fill('Updated Title');

            // Verify the list reflects the change
            await expect(page.locator('.list__item').filter({ hasText: 'Updated Title' })).toBeVisible();
        });

        test.skip('edit existing entry password', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            await page.locator('.list__search-btn-new').click();
            const titleField = page.locator('.details__header-title');
            await titleField.click();
            await titleField.fill('Password Edit Test');

            // Locate the password field and update it
            const passField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /password/i })
                .locator('input, .details__field-value');
            await passField.click();
            await page.keyboard.type('NewPassword456!');

            // Verify no errors occurred
            const errors: string[] = [];
            page.on('pageerror', (err) => errors.push(err.message));
            expect(errors).toEqual([]);
        });
    });

    test.describe('Delete Entry', () => {
        test.skip('delete entry moves it to recycle bin', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            // Create an entry
            await page.locator('.list__search-btn-new').click();
            const titleField = page.locator('.details__header-title');
            await titleField.click();
            await titleField.fill('Entry To Delete');

            // Select the entry
            await page.locator('.list__item').filter({ hasText: 'Entry To Delete' }).click();

            // Click the delete/trash button in the details panel
            const deleteButton = page.locator('.details__header-btn[title*="delete" i], .details__header-btn .fa-trash');
            await deleteButton.click();

            // Entry should no longer appear in the main list (moved to Recycle Bin)
            await expect(page.locator('.list__item').filter({ hasText: 'Entry To Delete' })).toBeHidden();
        });
    });

    test.describe('Clipboard', () => {
        test.skip('copy password to clipboard', async ({ page, context }) => {
            // Requires core build to serve the app
            // Grant clipboard permissions
            await context.grantPermissions(['clipboard-read', 'clipboard-write']);

            await createDatabase(page);

            // Create an entry with a known password
            await page.locator('.list__search-btn-new').click();
            const titleField = page.locator('.details__header-title');
            await titleField.click();
            await titleField.fill('Clipboard Test');

            const passField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /password/i })
                .locator('input, .details__field-value');
            await passField.click();
            await page.keyboard.type('CopyMe123!');

            // Click the copy button for the password field
            const copyBtn = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /password/i })
                .locator('.details__field-label-copy, .fa-clipboard, [title*="copy" i]');
            await copyBtn.click();

            // Verify clipboard content
            const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboardText).toBe('CopyMe123!');
        });

        test.skip('copy username to clipboard', async ({ page, context }) => {
            // Requires core build to serve the app
            await context.grantPermissions(['clipboard-read', 'clipboard-write']);

            await createDatabase(page);

            await page.locator('.list__search-btn-new').click();
            const titleField = page.locator('.details__header-title');
            await titleField.click();
            await titleField.fill('Username Copy Test');

            const userField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /user/i })
                .locator('input, .details__field-value');
            await userField.click();
            await page.keyboard.type('copyuser');

            const copyBtn = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /user/i })
                .locator('.details__field-label-copy, .fa-clipboard, [title*="copy" i]');
            await copyBtn.click();

            const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboardText).toBe('copyuser');
        });
    });

    test.describe('Password Generator', () => {
        test.skip('generated password is applied to entry', async ({ page }) => {
            // Requires core build to serve the app
            await createDatabase(page);

            await page.locator('.list__search-btn-new').click();

            // Click the generate password button (usually near the password field)
            const genBtn = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /password/i })
                .locator('.details__field-label-gen, .fa-bolt, [title*="generat" i]');
            await genBtn.click();

            // The generator popup should appear
            const generator = page.locator('.gen');
            await expect(generator).toBeVisible();

            // Click "OK" or "Apply" to use the generated password
            const applyBtn = generator.locator('button, .gen__btn-ok, [data-action="apply"]');
            await applyBtn.click();

            // Verify the password field now has a value (non-empty)
            const passField = page.locator('.details__body-fields .details__field')
                .filter({ hasText: /password/i })
                .locator('input, .details__field-value');
            const passValue = await passField.inputValue().catch(() => passField.textContent());
            expect(passValue).toBeTruthy();
        });
    });
});
