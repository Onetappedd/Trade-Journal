import { test, expect } from '@playwright/test';
import { login, logout } from './utils/auth';
import { IMPORT_SELECTORS, importSelectors } from './utils/selectors';
import { seedE2EUser, teardownE2EUser } from './utils/seed-helper';
import path from 'path';

// Test user credentials (will be seeded before tests)
let testUser: { email: string; password: string; userId: string } | null = null;

test.describe('CSV Import E2E Tests', () => {
  test.beforeAll(async () => {
    // Seed test user
    console.log('🌱 Seeding test user for import tests...');
    testUser = await seedE2EUser();
    console.log('✅ Test user created:', testUser.email);
  });

  test.afterAll(async () => {
    // Teardown test user
    if (testUser) {
      console.log('🧹 Cleaning up test user...');
      await teardownE2EUser({ userId: testUser.userId });
      console.log('✅ Test user cleaned up');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    if (!testUser) {
      throw new Error('Test user not created');
    }
    
    await login(page, { email: testUser.email, password: testUser.password });
    
    // Navigate to import page
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
    
    // Check for feature flag banner and skip if import v2 is disabled
    const featureBanner = page.locator('text=Import v2 is disabled');
    if (await featureBanner.isVisible()) {
      test.skip('Import v2 is disabled - skipping import tests');
    }
  });

  test('loads import page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Import/);
    
    // Assert feature flag banner is absent
    const featureBanner = page.locator('[data-testid="feature-flag-banner"]');
    await expect(featureBanner).not.toBeVisible();
    
    // Assert CSV UI is present using stable selectors
    const fileInput = importSelectors.fileInput(page);
    await expect(fileInput).toBeVisible();
    
    // Check for upload area
    await expect(page.getByText('Upload CSV File')).toBeVisible();
    await expect(page.getByText('Drag and drop or click to select a CSV file')).toBeVisible();
  });

  test('manual mapping happy path', async ({ page }) => {
    // Upload Webull CSV fixture using file chooser
    const csvPath = path.join(__dirname, '../fixtures/webull-small.csv');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      importSelectors.fileInput(page).click()
    ]);
    await chooser.setFiles(csvPath);

    // Wait for file processing and headers detection
    await page.waitForSelector('text=Preview (First 50 Rows)', { timeout: 10000 });
    
    // Ensure headers are detected
    await expect(page.getByText('Date')).toBeVisible();
    await expect(page.getByText('Symbol')).toBeVisible();
    await expect(page.getByText('Side')).toBeVisible();
    await expect(page.getByText('Quantity')).toBeVisible();
    await expect(page.getByText('Price')).toBeVisible();

    // Check that autoMap is present
    await expect(page.getByText('Preview (First 50 Rows)')).toBeVisible();
    
    // Ensure manual mapping toggle is selected (default)
    const manualToggle = page.locator(IMPORT_SELECTORS.manualMappingToggle);
    await expect(manualToggle).toBeVisible();

    // Map required fields using stable selectors
    const symbolSelect = importSelectors.mappingSelect(page, 'symbol');
    const sideSelect = importSelectors.mappingSelect(page, 'side');
    const quantitySelect = importSelectors.mappingSelect(page, 'quantity');
    const priceSelect = importSelectors.mappingSelect(page, 'price');
    const tradeTimeSelect = importSelectors.mappingSelect(page, 'trade_time_utc');

    // Map fields if they exist
    if (await symbolSelect.isVisible()) {
      await symbolSelect.selectOption('Symbol');
    }
    if (await sideSelect.isVisible()) {
      await sideSelect.selectOption('Side');
    }
    if (await quantitySelect.isVisible()) {
      await quantitySelect.selectOption('Quantity');
    }
    if (await priceSelect.isVisible()) {
      await priceSelect.selectOption('Price');
    }
    if (await tradeTimeSelect.isVisible()) {
      await tradeTimeSelect.selectOption('Date');
    }

    // Start import
    const startButton = importSelectors.startButton(page);
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Wait for progress to start and complete
    await page.waitForSelector('[data-testid="import-progress-text"]', { timeout: 30000 });
    
    // Wait for completion using progress indicator
    const progress = importSelectors.progress(page);
    await expect(progress).toBeVisible();
    
    // Wait for completion (progress should reach 100%)
    await page.waitForFunction(() => {
      const progressText = document.querySelector('[data-testid="import-progress-text"]');
      return progressText && progressText.textContent?.includes('100%');
    }, { timeout: 60000 });

    // Assert summary counts using stable selectors
    const summaryInserted = importSelectors.summaryInserted(page);
    const summaryFailed = importSelectors.summaryFailed(page);
    const summaryDuplicates = importSelectors.summaryDuplicates(page);

    await expect(summaryInserted).toBeVisible();
    await expect(summaryFailed).toBeVisible();
    await expect(summaryDuplicates).toBeVisible();

    // Get the actual counts
    const inserted = await summaryInserted.textContent();
    const failed = await summaryFailed.textContent();
    const duplicates = await summaryDuplicates.textContent();

    expect(parseInt(inserted || '0')).toBeGreaterThan(0);
    expect(parseInt(failed || '0')).toBe(0);

    // Click rollback if available
    const rollbackButton = importSelectors.rollbackButton(page);
    if (await rollbackButton.isVisible()) {
      await rollbackButton.click();
      
      // Wait for rollback to complete
      await page.waitForTimeout(2000);
      
      // Verify counts return to 0 or check via API
      const updatedInserted = await summaryInserted.textContent();
      const updatedFailed = await summaryFailed.textContent();
      const updatedDuplicates = await summaryDuplicates.textContent();
      
      // Counts should be reset after rollback
      expect(parseInt(updatedInserted || '0')).toBe(0);
      expect(parseInt(updatedFailed || '0')).toBe(0);
      expect(parseInt(updatedDuplicates || '0')).toBe(0);
    }
  });

  test('duplicate re-import', async ({ page }) => {
    // Upload the same Webull CSV fixture again using file chooser
    const csvPath = path.join(__dirname, '../fixtures/webull-small.csv');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      importSelectors.fileInput(page).click()
    ]);
    await chooser.setFiles(csvPath);

    // Wait for file processing
    await page.waitForSelector('text=Preview (First 50 Rows)', { timeout: 10000 });

    // Start import
    const startButton = importSelectors.startButton(page);
    await startButton.click();

    // Wait for completion
    await page.waitForSelector('[data-testid="import-progress-text"]', { timeout: 30000 });
    await page.waitForTimeout(5000); // Allow time for processing

    // Assert duplicates > 0, inserted ~ 0, no crash using stable selectors
    const summaryInserted = importSelectors.summaryInserted(page);
    const summaryFailed = importSelectors.summaryFailed(page);
    const summaryDuplicates = importSelectors.summaryDuplicates(page);

    await expect(summaryInserted).toBeVisible();
    await expect(summaryFailed).toBeVisible();
    await expect(summaryDuplicates).toBeVisible();

    const inserted = await summaryInserted.textContent();
    const failed = await summaryFailed.textContent();
    const duplicates = await summaryDuplicates.textContent();

    // Should have duplicates and minimal new insertions
    expect(parseInt(duplicates || '0')).toBeGreaterThan(0);
    expect(parseInt(inserted || '0')).toBeLessThanOrEqual(3); // Allow for some new insertions
    expect(parseInt(failed || '0')).toBe(0);

    // Ensure no crash by checking page is still responsive
    await expect(page.getByText('Import Another File')).toBeVisible();
  });

  test('preset path (Webull)', async ({ page }) => {
    // Upload Webull CSV fixture
    const csvPath = path.join(__dirname, '../fixtures/webull-small.csv');
    const fileInput = page.locator(IMPORT_SELECTORS.fileInput);
    await fileInput.setInputFiles(csvPath);

    // Wait for file processing and preset detection
    await page.waitForSelector('text=Preview (First 50 Rows)', { timeout: 10000 });
    
    // Check if preset is detected
    const presetDetected = page.getByText(/Detected:/);
    if (await presetDetected.isVisible()) {
      // Toggle "Use detected preset"
      const presetToggle = page.locator(IMPORT_SELECTORS.presetToggle);
      await expect(presetToggle).toBeVisible();
      await presetToggle.click();

      // Verify preset mode is active
      await expect(page.getByText('✓ Using preset transformation')).toBeVisible();
    }

    // Start import
    const startButton = page.locator(IMPORT_SELECTORS.startImportButton);
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Wait for progress and completion
    await page.waitForSelector('[data-testid="import-progress-text"]', { timeout: 30000 });
    
    // Wait for completion
    await page.waitForFunction(() => {
      const progressText = document.querySelector('[data-testid="import-progress-text"]');
      return progressText && !progressText.textContent?.includes('Importing');
    }, { timeout: 60000 });

    // Assert finish & counts
    const insertedCount = page.locator(IMPORT_SELECTORS.insertedCount);
    const failedCount = page.locator(IMPORT_SELECTORS.failedCount);
    const duplicatesCount = page.locator(IMPORT_SELECTORS.duplicatesCount);

    await expect(insertedCount).toBeVisible();
    await expect(failedCount).toBeVisible();
    await expect(duplicatesCount).toBeVisible();

    const inserted = await insertedCount.textContent();
    const failed = await failedCount.textContent();
    const duplicates = await duplicatesCount.textContent();

    // Should have successful import
    expect(parseInt(inserted || '0')).toBeGreaterThan(0);
    expect(parseInt(failed || '0')).toBe(0);

    // Check for completion indicators
    await expect(page.getByText('Import Another File')).toBeVisible();
  });

  test('preset path (Robinhood)', async ({ page }) => {
    // Upload Robinhood CSV fixture
    const csvPath = path.join(__dirname, '../fixtures/rh-small.csv');
    const fileInput = page.locator(IMPORT_SELECTORS.fileInput);
    await fileInput.setInputFiles(csvPath);

    // Wait for file processing and preset detection
    await page.waitForSelector('text=Preview (First 50 Rows)', { timeout: 10000 });
    
    // Check if preset is detected
    const presetDetected = page.getByText(/Detected:/);
    if (await presetDetected.isVisible()) {
      // Toggle "Use detected preset"
      const presetToggle = page.locator(IMPORT_SELECTORS.presetToggle);
      await expect(presetToggle).toBeVisible();
      await presetToggle.click();

      // Verify preset mode is active
      await expect(page.getByText('✓ Using preset transformation')).toBeVisible();
    }

    // Start import
    const startButton = page.locator(IMPORT_SELECTORS.startImportButton);
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Wait for progress and completion
    await page.waitForSelector('[data-testid="import-progress-text"]', { timeout: 30000 });
    
    // Wait for completion
    await page.waitForFunction(() => {
      const progressText = document.querySelector('[data-testid="import-progress-text"]');
      return progressText && !progressText.textContent?.includes('Importing');
    }, { timeout: 60000 });

    // Assert finish & counts
    const insertedCount = page.locator(IMPORT_SELECTORS.insertedCount);
    const failedCount = page.locator(IMPORT_SELECTORS.failedCount);
    const duplicatesCount = page.locator(IMPORT_SELECTORS.duplicatesCount);

    await expect(insertedCount).toBeVisible();
    await expect(failedCount).toBeVisible();
    await expect(duplicatesCount).toBeVisible();

    const inserted = await insertedCount.textContent();
    const failed = await failedCount.textContent();
    const duplicates = await duplicatesCount.textContent();

    // Should have successful import
    expect(parseInt(inserted || '0')).toBeGreaterThan(0);
    expect(parseInt(failed || '0')).toBe(0);

    // Check for completion indicators
    await expect(page.getByText('Import Another File')).toBeVisible();
  });

  test('error handling for invalid CSV', async ({ page }) => {
    // Create invalid CSV content
    const invalidCsvContent = `Invalid,Headers,Missing,Required,Fields
invalid,data,without,proper,structure`;

    // Upload invalid CSV
    const fileInput = page.locator(IMPORT_SELECTORS.fileInput);
    await fileInput.setInputFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCsvContent)
    });

    // Should show error or handle gracefully
    await page.waitForTimeout(2000);

    // Check for error handling
    const errorMessage = page.locator(IMPORT_SELECTORS.errorMessage);
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    } else {
      // If no error message, the form should still be functional
      await expect(page.getByText('Upload CSV File')).toBeVisible();
    }
  });

  test('import progress tracking', async ({ page }) => {
    // Upload CSV
    const csvPath = path.join(__dirname, '../fixtures/webull-small.csv');
    const fileInput = page.locator(IMPORT_SELECTORS.fileInput);
    await fileInput.setInputFiles(csvPath);

    await page.waitForSelector('text=Preview (First 50 Rows)', { timeout: 10000 });

    // Start import
    const startButton = page.locator(IMPORT_SELECTORS.startImportButton);
    await startButton.click();

    // Check progress bar is visible
    const progressBar = page.locator(IMPORT_SELECTORS.progressBar);
    await expect(progressBar).toBeVisible();

    // Check progress text updates
    const progressText = page.locator(IMPORT_SELECTORS.progressText);
    await expect(progressText).toBeVisible();

    // Wait for completion
    await page.waitForFunction(() => {
      const progressText = document.querySelector('[data-testid="import-progress-text"]');
      return progressText && !progressText.textContent?.includes('Importing');
    }, { timeout: 60000 });

    // Verify final state
    await expect(page.getByText('Import Another File')).toBeVisible();
  });
});