import { test, expect } from '@playwright/test';

test.describe('Bulletproof CSV Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import page
    await page.goto('/import');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should handle file upload with validation', async ({ page }) => {
    // Check that the bulletproof importer is mounted
    await expect(page.locator('[data-testid="csv-file-input"]')).toBeVisible();
    
    // Test file size validation
    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.csv', { type: 'text/csv' });
    await page.setInputFiles('[data-testid="csv-file-input"]', largeFile);
    
    // Should show error for large file
    await expect(page.locator('text=File size must be less than 50MB')).toBeVisible();
  });

  test('should handle MIME type validation', async ({ page }) => {
    // Test invalid file type
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    await page.setInputFiles('[data-testid="csv-file-input"]', invalidFile);
    
    // Should show error for invalid file type
    await expect(page.locator('text=Please select a CSV file')).toBeVisible();
  });

  test('should show broker presets', async ({ page }) => {
    // Check that broker preset dropdown is visible
    const presetSelect = page.locator('text=Select your broker for automatic mapping');
    await expect(presetSelect).toBeVisible();
    
    // Click to open dropdown
    await presetSelect.click();
    
    // Check that broker options are available
    await expect(page.locator('text=E*TRADE')).toBeVisible();
    await expect(page.locator('text=TD Ameritrade')).toBeVisible();
    await expect(page.locator('text=Charles Schwab')).toBeVisible();
    await expect(page.locator('text=Fidelity')).toBeVisible();
    await expect(page.locator('text=Robinhood')).toBeVisible();
  });

  test('should show import options', async ({ page }) => {
    // Check that import options are visible
    await expect(page.locator('text=Skip Duplicates')).toBeVisible();
    await expect(page.locator('text=Normalize Timestamps')).toBeVisible();
    await expect(page.locator('text=Map Fees & Commissions')).toBeVisible();
    
    // Check that switches are enabled by default
    const skipDuplicates = page.locator('#skip-duplicates');
    const normalizeTimestamps = page.locator('#normalize-timestamps');
    const mapFees = page.locator('#map-fees');
    
    await expect(skipDuplicates).toBeChecked();
    await expect(normalizeTimestamps).toBeChecked();
    await expect(mapFees).toBeChecked();
  });

  test('should show bulletproof features info', async ({ page }) => {
    // Check that features info card is visible
    await expect(page.locator('text=Bulletproof Import Features')).toBeVisible();
    
    // Check that all features are listed
    await expect(page.locator('text=File size & MIME validation')).toBeVisible();
    await expect(page.locator('text=Streaming/chunked parsing')).toBeVisible();
    await expect(page.locator('text=Row-level idempotency')).toBeVisible();
    await expect(page.locator('text=UTC timestamp normalization')).toBeVisible();
    await expect(page.locator('text=Broker preset support')).toBeVisible();
    await expect(page.locator('text=Real-time status updates')).toBeVisible();
  });

  test('should handle CSV upload and show status', async ({ page }) => {
    // Create a test CSV file
    const csvContent = `Symbol,Side,Quantity,Price,Date,Commission
AAPL,BUY,100,150.00,2024-01-01,1.00
MSFT,SELL,50,300.00,2024-01-02,1.50`;
    
    const csvFile = new File([csvContent], 'test-trades.csv', { type: 'text/csv' });
    
    // Upload file
    await page.setInputFiles('[data-testid="csv-file-input"]', csvFile);
    
    // Wait for file to be selected
    await expect(page.locator('text=test-trades.csv')).toBeVisible();
    
    // Start import
    await page.click('[data-testid="start-import-button"]');
    
    // Should show status card
    await expect(page.locator('text=Import Status')).toBeVisible();
    
    // Should show queued status initially
    await expect(page.locator('text=QUEUED')).toBeVisible();
  });

  test('should handle import retry on failure', async ({ page }) => {
    // Create a test CSV file with invalid data
    const csvContent = `Symbol,Side,Quantity,Price,Date,Commission
INVALID,INVALID,invalid,invalid,invalid,invalid`;
    
    const csvFile = new File([csvContent], 'invalid-trades.csv', { type: 'text/csv' });
    
    // Upload file
    await page.setInputFiles('[data-testid="csv-file-input"]', csvFile);
    
    // Start import
    await page.click('[data-testid="start-import-button"]');
    
    // Wait for status card
    await expect(page.locator('text=Import Status')).toBeVisible();
    
    // Should eventually show failed status
    await expect(page.locator('text=FAILED')).toBeVisible({ timeout: 10000 });
    
    // Should show retry button
    await expect(page.locator('text=Retry Import')).toBeVisible();
    
    // Click retry
    await page.click('text=Retry Import');
    
    // Should reset to file selection
    await expect(page.locator('[data-testid="csv-file-input"]')).toBeVisible();
  });

  test('should show real-time status updates', async ({ page }) => {
    // Create a test CSV file
    const csvContent = `Symbol,Side,Quantity,Price,Date,Commission
AAPL,BUY,100,150.00,2024-01-01,1.00
MSFT,SELL,50,300.00,2024-01-02,1.50
GOOGL,BUY,25,2500.00,2024-01-03,2.00`;
    
    const csvFile = new File([csvContent], 'test-trades.csv', { type: 'text/csv' });
    
    // Upload file
    await page.setInputFiles('[data-testid="csv-file-input"]', csvFile);
    
    // Start import
    await page.click('[data-testid="start-import-button"]');
    
    // Should show status card
    await expect(page.locator('text=Import Status')).toBeVisible();
    
    // Should show progress updates
    await expect(page.locator('text=Processing...')).toBeVisible({ timeout: 5000 });
    
    // Should eventually show completed status
    await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 15000 });
    
    // Should show results
    await expect(page.locator('text=View Results')).toBeVisible();
  });

  test('should handle duplicate file uploads', async ({ page }) => {
    // Create a test CSV file
    const csvContent = `Symbol,Side,Quantity,Price,Date,Commission
AAPL,BUY,100,150.00,2024-01-01,1.00`;
    
    const csvFile = new File([csvContent], 'test-trades.csv', { type: 'text/csv' });
    
    // Upload file first time
    await page.setInputFiles('[data-testid="csv-file-input"]', csvFile);
    await page.click('[data-testid="start-import-button"]');
    
    // Wait for completion
    await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 10000 });
    
    // Upload same file again
    await page.click('text=Retry Import');
    await page.setInputFiles('[data-testid="csv-file-input"]', csvFile);
    await page.click('[data-testid="start-import-button"]');
    
    // Should show status card again
    await expect(page.locator('text=Import Status')).toBeVisible();
    
    // Should process without errors (idempotency)
    await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 10000 });
  });

  test('should show matched trades after import', async ({ page }) => {
    // Create a test CSV file with matching trades
    const csvContent = `Symbol,Side,Quantity,Price,Date,Commission
AAPL,BUY,100,150.00,2024-01-01,1.00
AAPL,SELL,100,155.00,2024-01-01,1.00`;
    
    const csvFile = new File([csvContent], 'matching-trades.csv', { type: 'text/csv' });
    
    // Upload file
    await page.setInputFiles('[data-testid="csv-file-input"]', csvFile);
    await page.click('[data-testid="start-import-button"]');
    
    // Wait for completion
    await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 10000 });
    
    // Click view results
    await page.click('text=View Results');
    
    // Should navigate to trades page
    await expect(page).toHaveURL(/.*\/trades/);
    
    // Should show the imported trades
    await expect(page.locator('text=AAPL')).toBeVisible();
  });
});
