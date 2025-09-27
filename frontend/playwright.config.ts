import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: 'tests/e2e',
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
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    headless: true,
    
    /* Enhanced debugging options */
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    },
    
    /* Capture console logs */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Global environment variables for all tests */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'web',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://frontend-p5fnkqvcy-zks-projects-7a010a7d.vercel.app'
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_TEST: 'true',
      NEXT_PUBLIC_E2E_TEST: 'true',
      NEXT_PUBLIC_IMPORT_V2_ENABLED: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'https://lobigrwmngwirucuklmc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjAzODgsImV4cCI6MjA2OTQ5NjM4OH0.FZvlw06ILW7TutkrakBLdEIEkuf5f69nGxXaycaMGQQ',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDM4OCwiZXhwIjoyMDY5NDk2Mzg4fQ.7rHGN2rqpumTPPPF5np09G6y67vLy2CGjBUeG-MRxBM',
    },
  },

  /* Global test timeout */
  timeout: 90_000,
});
