import { defineConfig, devices } from '@playwright/test';

import {
  BASE_URL,
  E2E_JWT_SECRET,
  STUB_API_PORT,
  WEB_PORT,
} from './e2e/support/config';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/support/stub-api.mjs',
      url: `http://localhost:${STUB_API_PORT}/health`,
      env: { PORT: String(STUB_API_PORT), JWT_SECRET: E2E_JWT_SECRET },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build --workspace web && npm run start --workspace web -- --port ${WEB_PORT}`,
      url: BASE_URL,
      env: {
        JWT_SECRET: E2E_JWT_SECRET,
        API_BASE_URL: `http://localhost:${STUB_API_PORT}`,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
