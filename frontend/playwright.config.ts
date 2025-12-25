import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 * Loads .env file from the frontend directory
 */
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Run in headless mode if DISPLAY is not set (common on servers/remote machines) */
    headless: process.env.DISPLAY ? false : true,
    /* Increase action timeout for slower machines */
    actionTimeout: 10000,
    /* Increase navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Force headless if no display available */
        headless: process.env.DISPLAY ? false : true,
      },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // Note: webServer will start automatically before tests run
  // For UI mode, tests will be visible once webServers are ready
  // Set SKIP_WEBSERVERS=true to skip starting servers (useful if they're already running)
  ...(process.env.SKIP_WEBSERVERS ? {} : {
    webServer: [
      {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
      // Backend server for E2E tests
      // Always uses test database (RAILS_ENV=test) for safety
      // Use VITE_API_URL from .env to determine port
      {
        command: (() => {
          const apiUrl = process.env.VITE_API_URL;
          if (!apiUrl) {
            throw new Error('VITE_API_URL must be set in .env file');
          }
          const url = new URL(apiUrl);
          const port = url.port || (url.protocol === 'https:' ? '443' : '80');
          
          if (process.platform === 'win32') {
            // For Windows, use PowerShell script
            return `powershell -ExecutionPolicy Bypass -Command "$env:VITE_API_URL='${process.env.VITE_API_URL}'; & '../backend/scripts/start-test-server.ps1'"`;
          } else {
            // For Linux/Mac, set RAILS_ENV to test
            return `cd ../backend && RAILS_ENV=test bundle exec rails server -p ${port}`;
          }
        })(),
        url: (() => {
          const apiUrl = process.env.VITE_API_URL;
          if (!apiUrl) {
            throw new Error('VITE_API_URL must be set in .env file');
          }
          return `${apiUrl}/api/health`;
        })(),
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
    ],
  } as any),
});

