import { test, expect } from '@playwright/test';

test.describe('KPI System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should load KPI data from canonical API', async ({ page }) => {
    // Check that KPI API is called
    const kpiRequest = page.waitForRequest(request => 
      request.url().includes('/api/kpi/summary') && request.method() === 'GET'
    );
    
    // Refresh dashboard to trigger KPI fetch
    await page.click('text=Refresh');
    
    // Wait for KPI request
    const request = await kpiRequest;
    expect(request.url()).toContain('/api/kpi/summary');
    
    // Check that KPI data is displayed
    await expect(page.locator('text=Total Trades')).toBeVisible();
    await expect(page.locator('text=Total P&L')).toBeVisible();
    await expect(page.locator('text=Win Rate')).toBeVisible();
    await expect(page.locator('text=Sharpe Ratio')).toBeVisible();
  });

  test('should show server-calculated KPIs', async ({ page }) => {
    // Check that KPI cards show server-calculated values
    const totalTrades = page.locator('text=Total Trades').locator('..').locator('.text-2xl');
    const totalPnl = page.locator('text=Total P&L').locator('..').locator('.text-2xl');
    const winRate = page.locator('text=Win Rate').locator('..').locator('.text-2xl');
    const sharpe = page.locator('text=Sharpe Ratio').locator('..').locator('.text-2xl');
    
    // Values should be displayed (not loading states)
    await expect(totalTrades).not.toContainText('Loading');
    await expect(totalPnl).not.toContainText('Loading');
    await expect(winRate).not.toContainText('Loading');
    await expect(sharpe).not.toContainText('Loading');
    
    // Should show numeric values
    await expect(totalTrades).toMatch(/\d+/);
    await expect(totalPnl).toMatch(/\$[\d,.-]+/);
    await expect(winRate).toMatch(/\d+\.\d+%/);
    await expect(sharpe).toMatch(/\d+\.\d+/);
  });

  test('should refresh KPIs after import completion', async ({ page }) => {
    // Navigate to import page
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
    
    // Create a test CSV file
    const csvContent = `Symbol,Side,Quantity,Price,Date,Commission
AAPL,BUY,100,150.00,2024-01-01,1.00
MSFT,SELL,50,300.00,2024-01-02,1.50`;
    
    const csvFile = new File([csvContent], 'test-trades.csv', { type: 'text/csv' });
    
    // Upload file
    await page.setInputFiles('[data-testid="csv-file-input"]', csvFile);
    await page.click('[data-testid="start-import-button"]');
    
    // Wait for import to complete
    await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 15000 });
    
    // Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check that KPI data has been updated
    const totalTrades = page.locator('text=Total Trades').locator('..').locator('.text-2xl');
    await expect(totalTrades).toContainText('2'); // Should show 2 trades from CSV
    
    // Check that P&L reflects the imported trades
    const totalPnl = page.locator('text=Total P&L').locator('..').locator('.text-2xl');
    await expect(totalPnl).toBeVisible();
  });

  test('should handle KPI API errors gracefully', async ({ page }) => {
    // Mock KPI API to return error
    await page.route('/api/kpi/summary', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'KPI calculation failed' })
      });
    });
    
    // Refresh dashboard
    await page.click('text=Refresh');
    
    // Should show error state or fallback values
    await expect(page.locator('text=Total Trades')).toBeVisible();
    await expect(page.locator('text=Total P&L')).toBeVisible();
    
    // Values should be 0 or show error state
    const totalTrades = page.locator('text=Total Trades').locator('..').locator('.text-2xl');
    await expect(totalTrades).toContainText('0');
  });

  test('should support different KPI periods', async ({ page }) => {
    // Test different period parameters
    const periods = ['all', 'ytd', 'mtd', '30d', '90d', '1y'];
    
    for (const period of periods) {
      // Mock KPI API to capture period parameter
      let capturedPeriod = '';
      await page.route('/api/kpi/summary*', route => {
        const url = new URL(route.request().url());
        capturedPeriod = url.searchParams.get('period') || 'all';
        route.continue();
      });
      
      // Navigate to dashboard with period parameter
      await page.goto(`/dashboard?period=${period}`);
      await page.waitForLoadState('networkidle');
      
      // Check that correct period was requested
      expect(capturedPeriod).toBe(period);
    }
  });

  test('should cache KPI data appropriately', async ({ page }) => {
    let requestCount = 0;
    
    // Track KPI API requests
    await page.route('/api/kpi/summary*', route => {
      requestCount++;
      route.continue();
    });
    
    // First load
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Refresh multiple times
    await page.click('text=Refresh');
    await page.waitForTimeout(1000);
    await page.click('text=Refresh');
    await page.waitForTimeout(1000);
    
    // Should make multiple requests (no aggressive caching in test)
    expect(requestCount).toBeGreaterThan(1);
  });

  test('should show KPI metadata', async ({ page }) => {
    // Check that KPI cards show additional metadata
    await expect(page.locator('text=Realized P&L')).toBeVisible();
    await expect(page.locator('text=Unrealized P&L')).toBeVisible();
    
    // Should show calculated values
    const realizedPnl = page.locator('text=Realized P&L').locator('..').locator('.text-2xl');
    const unrealizedPnl = page.locator('text=Unrealized P&L').locator('..').locator('.text-2xl');
    
    await expect(realizedPnl).toMatch(/\$[\d,.-]+/);
    await expect(unrealizedPnl).toMatch(/\$[\d,.-]+/);
  });

  test('should handle empty KPI data', async ({ page }) => {
    // Mock KPI API to return empty data
    await page.route('/api/kpi/summary', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalPnl: 0,
          winRate: 0,
          totalTrades: 0,
          sharpe: 0,
          period: { start: '2024-01-01T00:00:00.000Z', end: '2024-12-31T23:59:59.999Z' },
          realizedPnl: 0,
          unrealizedPnl: 0,
          maxDrawdown: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          totalVolume: 0,
          lastUpdated: new Date().toISOString(),
          calculationMethod: 'server'
        })
      });
    });
    
    // Refresh dashboard
    await page.click('text=Refresh');
    
    // Should show zero values
    const totalTrades = page.locator('text=Total Trades').locator('..').locator('.text-2xl');
    const totalPnl = page.locator('text=Total P&L').locator('..').locator('.text-2xl');
    
    await expect(totalTrades).toContainText('0');
    await expect(totalPnl).toContainText('$0.00');
  });
});

