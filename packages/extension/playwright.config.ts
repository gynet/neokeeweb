import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    retries: 1,
    use: {
        // Chrome extensions require headed mode
        headless: false,
    },
    projects: [
        {
            name: 'chromium',
        },
    ],
});
