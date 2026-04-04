import { test, expect } from './fixtures';

test('options page loads', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/pages/options.html`);
    // options.html renders a Preact app into <body>
    await expect(page.locator('body')).not.toBeEmpty();
    // Page title includes the extension name
    await expect(page).toHaveTitle(/KeeWeb Connect/);
});

test('options page loads scripts', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/pages/options.html`);
    // Verify the options JS module is loaded
    const scriptSrc = await page.locator('script[src*="options"]').getAttribute('src');
    expect(scriptSrc).toContain('options.js');
});
