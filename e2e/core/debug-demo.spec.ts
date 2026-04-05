import { test, expect } from '@playwright/test';

test('debug demo database opening', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    const errors: string[] = [];
    page.on('pageerror', (err) => {
        errors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const demoBtn = page.locator('#open__icon-demo');
    await expect(demoBtn).toBeVisible({ timeout: 15_000 });

    console.log('=== BEFORE CLICK ===');
    console.log('Console messages:', consoleMessages.join('\n'));
    console.log('Errors:', errors.join('\n'));

    await demoBtn.click();

    // Wait a bit for any errors to appear
    await page.waitForTimeout(5000);

    console.log('=== AFTER CLICK (5s) ===');
    console.log('Console messages:', consoleMessages.join('\n'));
    console.log('Errors:', errors.join('\n'));

    // Check what's in the DOM
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
    console.log('=== BODY HTML (first 2000 chars) ===');
    console.log(bodyHTML);

    // Check if any list items exist
    const listCount = await page.locator('.list__item').count();
    console.log('List items found:', listCount);

    // Check if the open view is still visible
    const openView = await page.locator('.open').count();
    console.log('Open view count:', openView);

    // Take screenshot
    await page.screenshot({ path: '/tmp/debug-demo.png', fullPage: true });
});
