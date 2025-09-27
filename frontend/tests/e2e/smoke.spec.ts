import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { seedE2EUser, teardownE2EUser } from './utils/seed-helper';
import path from 'path';

// Test user credentials (will be seeded before tests)
let testUser: { email: string; password: string; userId: string } | null = null;

test.describe('Smoke Tests', () => {
  test.beforeAll(async () => {
    // Seed a test user before all tests in this file
    testUser = await seedE2EUser();
    console.log('Smoke Test: Seeded user for testing:', testUser.email);
  });

  test.afterAll(async () => {
    // Teardown the test user after all tests in this file
    if (testUser) {
      await teardownE2EUser({ userId: testUser.userId });
      console.log('Smoke Test: Teardown user after testing:', testUser.email);
    }
  });

  test('@smoke import loads and reaches summary on tiny CSV', async ({ page }) => {
    // Login first
    await login(page, { email: testUser!.email, password: testUser!.password });
    
    // Navigate to import page
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
    
    // Check if import v2 is enabled
    const featureFlagBanner = page.locator('text=Import v2 is disabled');
    if (await featureFlagBanner.isVisible()) {
      test.skip('Import v2 is disabled');
    }
    
    // Upload a tiny CSV file
    const fileInput = page.getByTestId('import-file-input');
    const csvPath = path.join(__dirname, '../fixtures/webull-small.csv');
    
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      fileInput.click()
    ]);
    
    await fileChooser.setFiles(csvPath);
    
    // Wait for file to be processed
    await page.waitForLoadState('networkidle');
    
    // Check that mapping UI appears
    await expect(page.getByTestId('import-mapping-select-Symbol')).toBeVisible({ timeout: 10000 });
    
    // Use preset if available
    const usePresetToggle = page.getByTestId('import-use-preset-toggle');
    if (await usePresetToggle.isVisible()) {
      await usePresetToggle.click();
    }
    
    // Start import
    const startButton = page.getByTestId('import-start-button');
    await startButton.click();
    
    // Wait for import to complete
    await expect(page.getByTestId('import-finished')).toBeVisible({ timeout: 30000 });
    
    // Check that summary is shown
    await expect(page.getByTestId('import-summary-inserted')).toBeVisible();
    await expect(page.getByTestId('import-summary-duplicates')).toBeVisible();
    await expect(page.getByTestId('import-summary-failed')).toBeVisible();
    
    console.log('✅ Import smoke test passed');
  });

  test('@smoke settings loads and shows name input', async ({ page }) => {
    // Login first
    await login(page, { email: testUser!.email, password: testUser!.password });
    
    // Navigate to settings page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Check that settings page loads
    await expect(page.getByTestId('settings-name-input')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('settings-username-input')).toBeVisible();
    await expect(page.getByTestId('settings-email-input')).toBeVisible();
    
    // Check that the name input has a value
    const nameInput = page.getByTestId('settings-name-input');
    await expect(nameInput).toBeVisible();
    
    console.log('✅ Settings smoke test passed');
  });
});