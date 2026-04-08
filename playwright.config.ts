import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:8085',
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chromium-only: grant clipboard read/write so
        // `navigator.clipboard.*` works without prompts. Putting this
        // here (not in top-level `use`) avoids Firefox's
        // `Unknown permission: clipboard-read` failure on context
        // creation. Clipboard tests gate themselves to chromium too,
        // see e2e/core/clipboard.spec.ts.
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'bun run --filter @neokeeweb/core dev',
    url: 'http://localhost:8085',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
