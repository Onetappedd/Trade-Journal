import { test, expect } from '@playwright/test';

test.describe('Subscription System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test subscription page
    await page.goto('/test-subscription');
    await page.waitForLoadState('networkidle');
  });

  test('should load subscription status from server', async ({ page }) => {
    // Check that subscription API is called
    const subscriptionRequest = page.waitForRequest(request => 
      request.url().includes('/api/me/subscription') && request.method() === 'GET'
    );
    
    // Refresh subscription status
    await page.click('button:has-text("Refresh")');
    
    // Wait for subscription request
    const request = await subscriptionRequest;
    expect(request.url()).toContain('/api/me/subscription');
    
    // Check that subscription status is displayed
    await expect(page.locator('text=Subscription Status')).toBeVisible();
    await expect(page.locator('text=Entitled:')).toBeVisible();
    await expect(page.locator('text=Status:')).toBeVisible();
  });

  test('should show server-calculated subscription status', async ({ page }) => {
    // Check that subscription status shows server-calculated values
    const entitledStatus = page.locator('text=Entitled:').locator('..').locator('text=Yes, text=No');
    const tierBadge = page.locator('[class*="bg-"]').first();
    
    // Values should be displayed (not loading states)
    await expect(entitledStatus).toBeVisible();
    await expect(tierBadge).toBeVisible();
    
    // Should show tier information
    await expect(tierBadge).toMatch(/(Free|Basic|Pro|Enterprise)/);
  });

  test('should gate premium features based on server verification', async ({ page }) => {
    // Check that premium feature gates are working
    await expect(page.locator('text=Premium Feature Tests')).toBeVisible();
    
    // Check Basic feature gate
    await expect(page.locator('text=Basic Feature (requires Basic tier)')).toBeVisible();
    
    // Check Pro feature gate
    await expect(page.locator('text=Pro Feature (requires Pro tier)')).toBeVisible();
    
    // Check Enterprise feature gate
    await expect(page.locator('text=Enterprise Feature (requires Enterprise tier)')).toBeVisible();
  });

  test('should show upgrade prompts for non-premium users', async ({ page }) => {
    // Mock subscription API to return free tier
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entitled: false,
          tier: 'free',
          status: 'active',
          features: ['basic_features'],
          limits: {
            maxTrades: 100,
            maxImports: 3,
            maxStorage: 104857600
          }
        })
      });
    });
    
    // Refresh subscription status
    await page.click('button:has-text("Refresh")');
    
    // Should show free tier
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Entitled: No')).toBeVisible();
    
    // Should show upgrade prompts for premium features
    await expect(page.locator('text=Basic imports require Basic subscription')).toBeVisible();
    await expect(page.locator('text=Advanced analytics require Pro subscription')).toBeVisible();
    await expect(page.locator('text=White label requires Enterprise subscription')).toBeVisible();
  });

  test('should show premium features for pro users', async ({ page }) => {
    // Mock subscription API to return pro tier
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entitled: true,
          tier: 'pro',
          status: 'active',
          features: [
            'unlimited_trades',
            'unlimited_imports',
            'advanced_analytics',
            'custom_reports',
            'api_access',
            'priority_support',
            'data_export',
            'real_time_data'
          ],
          limits: {
            maxTrades: -1,
            maxImports: -1,
            maxStorage: 10737418240
          }
        })
      });
    });
    
    // Refresh subscription status
    await page.click('button:has-text("Refresh")');
    
    // Should show pro tier
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Entitled: Yes')).toBeVisible();
    
    // Should show premium features as available
    await expect(page.locator('text=Basic imports are available')).toBeVisible();
    await expect(page.locator('text=Advanced analytics are available')).toBeVisible();
    
    // Enterprise features should still be gated
    await expect(page.locator('text=White label requires Enterprise subscription')).toBeVisible();
  });

  test('should handle subscription API errors gracefully', async ({ page }) => {
    // Mock subscription API to return error
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Subscription service unavailable' })
      });
    });
    
    // Refresh subscription status
    await page.click('button:has-text("Refresh")');
    
    // Should show error state or fallback
    await expect(page.locator('text=Failed to load subscription status')).toBeVisible();
  });

  test('should show security information', async ({ page }) => {
    // Check that security test section is visible
    await expect(page.locator('text=Security Test')).toBeVisible();
    
    // Should show security information
    await expect(page.locator('text=Client-side flags cannot spoof access:')).toBeVisible();
    await expect(page.locator('text=All premium features are gated by server-side verification')).toBeVisible();
    await expect(page.locator('text=Subscription status is fetched from /api/me/subscription')).toBeVisible();
    await expect(page.locator('text=No local storage or client flags are trusted')).toBeVisible();
    await expect(page.locator('text=UI updates only after server confirms subscription change')).toBeVisible();
  });

  test('should display subscription limits correctly', async ({ page }) => {
    // Mock subscription API to return basic tier with limits
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entitled: true,
          tier: 'basic',
          status: 'active',
          features: ['limited_trades', 'basic_imports', 'standard_analytics', 'email_support'],
          limits: {
            maxTrades: 1000,
            maxImports: 10,
            maxStorage: 1073741824
          }
        })
      });
    });
    
    // Refresh subscription status
    await page.click('button:has-text("Refresh")');
    
    // Should show limits
    await expect(page.locator('text=Trades: 1000')).toBeVisible();
    await expect(page.locator('text=Imports: 10')).toBeVisible();
    await expect(page.locator('text=Storage: 1024MB')).toBeVisible();
  });

  test('should display unlimited limits for pro users', async ({ page }) => {
    // Mock subscription API to return pro tier with unlimited limits
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entitled: true,
          tier: 'pro',
          status: 'active',
          features: ['unlimited_trades', 'unlimited_imports', 'advanced_analytics'],
          limits: {
            maxTrades: -1,
            maxImports: -1,
            maxStorage: 10737418240
          }
        })
      });
    });
    
    // Refresh subscription status
    await page.click('button:has-text("Refresh")');
    
    // Should show unlimited limits
    await expect(page.locator('text=Trades: ∞')).toBeVisible();
    await expect(page.locator('text=Imports: ∞')).toBeVisible();
    await expect(page.locator('text=Storage: 10240MB')).toBeVisible();
  });

  test('should show features list for subscription tier', async ({ page }) => {
    // Mock subscription API to return pro tier with features
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entitled: true,
          tier: 'pro',
          status: 'active',
          features: [
            'unlimited_trades',
            'unlimited_imports',
            'advanced_analytics',
            'custom_reports',
            'api_access',
            'priority_support',
            'data_export',
            'real_time_data'
          ],
          limits: {}
        })
      });
    });
    
    // Refresh subscription status
    await page.click('button:has-text("Refresh")');
    
    // Should show features
    await expect(page.locator('text=Features:')).toBeVisible();
    await expect(page.locator('text=unlimited_trades')).toBeVisible();
    await expect(page.locator('text=advanced_analytics')).toBeVisible();
    await expect(page.locator('text=api_access')).toBeVisible();
  });

  test('should handle test mode toggle', async ({ page }) => {
    // Check that test mode toggle is visible
    await expect(page.locator('text=Test Mode')).toBeVisible();
    
    // Toggle test mode
    const testModeSwitch = page.locator('input[type="checkbox"]');
    await testModeSwitch.click();
    
    // Should be checked
    await expect(testModeSwitch).toBeChecked();
  });
});

