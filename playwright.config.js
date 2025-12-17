import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://govgpt.sandbox.dge.gov.ae',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // },
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] }
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 12'] }
    // }
  ],
  outputDir: 'reports/test-artifacts'
  
});