import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  webServer: [
    {
      command: 'pnpm --filter server run dev',
      cwd: '../..',
      url: 'http://127.0.0.1:3333/api/health',
      timeout: 120_000,
      reuseExistingServer: true,
    },
    {
      command: 'pnpm --filter @saas/web run dev -- --host 127.0.0.1 --port 8080',
      cwd: '../..',
      url: baseURL,
      timeout: 120_000,
      reuseExistingServer: true,
    },
  ],
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reportSlowTests: { max: 10, threshold: 15_000 },
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
