import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  // Dev-mode Next.js compiles routes on first hit; default 5s assertion
  // timeout isn't enough for first-time `/admin/*` compilation on slow
  // hosts. Bump to 30s across the board.
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'PORT=4200 NODE_ENV=development DISABLE_SCHEDULER=1 npm run dev',
        url: 'http://localhost:4200/api/health/liveness',
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
