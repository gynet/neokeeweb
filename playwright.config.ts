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
      use: { ...devices['Desktop Chrome'] },
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
