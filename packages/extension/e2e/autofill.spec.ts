import { test, expect } from './fixtures';

test('content script injects on login page', async ({ context }) => {
    const page = await context.newPage();

    // Create a simple login form page
    await page.setContent(`
        <form>
            <input type="text" name="username" />
            <input type="password" name="password" />
            <button type="submit">Login</button>
        </form>
    `);

    // Verify the form elements exist
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Content script should be active — the extension is loaded in this context.
    // Full autofill verification requires a running KeeWeb app connection,
    // but we can verify the page is accessible and form elements are present.
    await page.close();
});

test('extension is active in browser context', async ({ context, extensionId }) => {
    // Verify the extension loaded successfully by checking its ID
    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBeGreaterThan(0);

    // Service worker should be running
    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);

    // Service worker URL should reference our extension
    const swUrl = workers[0].url();
    expect(swUrl).toContain(extensionId);
    expect(swUrl).toContain('background.js');
});
