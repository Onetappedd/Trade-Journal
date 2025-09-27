import { test, expect } from '@playwright/test';

test.describe('Error Handling System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to error handling test page
    await page.goto('/test-errors');
    await page.waitForLoadState('networkidle');
  });

  test('should display error handling test page', async ({ page }) => {
    // Check that the test page loads
    await expect(page.locator('text=Error Handling Test')).toBeVisible();
    await expect(page.locator('text=API Error Tests')).toBeVisible();
    await expect(page.locator('text=Simulated Error Tests')).toBeVisible();
    await expect(page.locator('text=Error Boundary Test')).toBeVisible();
  });

  test('should show toast notifications for API errors', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/kpi/summary', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch KPI data',
            timestamp: new Date().toISOString()
          }
        })
      });
    });
    
    // Click test KPI API button
    await page.click('button:has-text("Test KPI API")');
    
    // Wait for error toast
    await expect(page.locator('text=KPI Load Failed')).toBeVisible();
    await expect(page.locator('text=Failed to fetch KPI data')).toBeVisible();
  });

  test('should show success toast for successful API calls', async ({ page }) => {
    // Mock API to return success
    await page.route('/api/kpi/summary', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            totalPnl: 1000,
            winRate: 75,
            totalTrades: 50,
            sharpe: 1.5
          },
          success: true
        })
      });
    });
    
    // Click test KPI API button
    await page.click('button:has-text("Test KPI API")');
    
    // Wait for success toast
    await expect(page.locator('text=KPI Data Loaded')).toBeVisible();
    await expect(page.locator('text=Successfully fetched KPI data from server')).toBeVisible();
  });

  test('should show loading state during API calls', async ({ page }) => {
    // Mock API with delay
    await page.route('/api/kpi/summary', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {}, success: true })
        });
      }, 1000);
    });
    
    // Click test KPI API button
    await page.click('button:has-text("Test KPI API")');
    
    // Check loading state
    await expect(page.locator('text=Loading...')).toBeVisible();
    await expect(page.locator('button:has-text("Test KPI API")')).toBeDisabled();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('/api/kpi/summary', route => {
      route.abort('failed');
    });
    
    // Click test KPI API button
    await page.click('button:has-text("Test KPI API")');
    
    // Wait for error toast
    await expect(page.locator('text=KPI Load Failed')).toBeVisible();
  });

  test('should show simulated error toasts', async ({ page }) => {
    // Test 500 error simulation
    await page.click('button:has-text("500 Error")');
    await expect(page.locator('text=Server Error')).toBeVisible();
    await expect(page.locator('text=Internal server error occurred')).toBeVisible();
    
    // Test network error simulation
    await page.click('button:has-text("Network Error")');
    await expect(page.locator('text=Network Error')).toBeVisible();
    await expect(page.locator('text=Failed to connect to server')).toBeVisible();
    
    // Test validation error simulation
    await page.click('button:has-text("Validation Error")');
    await expect(page.locator('text=Validation Error')).toBeVisible();
    await expect(page.locator('text=Please check your input and try again')).toBeVisible();
    
    // Test auth error simulation
    await page.click('button:has-text("Auth Error")');
    await expect(page.locator('text=Authentication Error')).toBeVisible();
    await expect(page.locator('text=Please log in again')).toBeVisible();
  });

  test('should show error boundary when JavaScript error occurs', async ({ page }) => {
    // Click trigger error boundary button
    await page.click('button:has-text("Trigger Error Boundary")');
    
    // Check that error boundary is displayed
    await expect(page.locator('text=Something went wrong')).toBeVisible();
    await expect(page.locator('text=Try Again')).toBeVisible();
    await expect(page.locator('text=Reload Page')).toBeVisible();
    await expect(page.locator('text=Go Home')).toBeVisible();
  });

  test('should show error details in development mode', async ({ page }) => {
    // Click trigger error boundary button
    await page.click('button:has-text("Trigger Error Boundary")');
    
    // Check that error details are shown in development
    await expect(page.locator('text=Error Details')).toBeVisible();
    await expect(page.locator('text=Test error for error boundary')).toBeVisible();
  });

  test('should handle retry actions in toasts', async ({ page }) => {
    // Mock API to return error first, then success
    let callCount = 0;
    await page.route('/api/kpi/summary', route => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to fetch KPI data'
            }
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {}, success: true })
        });
      }
    });
    
    // Click test KPI API button
    await page.click('button:has-text("Test KPI API")');
    
    // Wait for error toast with retry action
    await expect(page.locator('text=KPI Load Failed')).toBeVisible();
    
    // Click retry action in toast
    await page.click('text=Retry');
    
    // Wait for success toast
    await expect(page.locator('text=KPI Data Loaded')).toBeVisible();
  });

  test('should show error handling features', async ({ page }) => {
    // Check that error handling features are displayed
    await expect(page.locator('text=Error Handling Features')).toBeVisible();
    await expect(page.locator('text=Standardized Error Responses')).toBeVisible();
    await expect(page.locator('text=User Experience')).toBeVisible();
    
    // Check feature lists
    await expect(page.locator('text=Consistent JSON error shape')).toBeVisible();
    await expect(page.locator('text=Toast notifications for errors')).toBeVisible();
    await expect(page.locator('text=Loading skeletons during requests')).toBeVisible();
    await expect(page.locator('text=Error boundaries for crashes')).toBeVisible();
  });

  test('should handle subscription API errors', async ({ page }) => {
    // Mock subscription API to return error
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch subscription status'
          }
        })
      });
    });
    
    // Click test subscription API button
    await page.click('button:has-text("Test Subscription API")');
    
    // Wait for error toast
    await expect(page.locator('text=Subscription Load Failed')).toBeVisible();
    await expect(page.locator('text=Failed to fetch subscription status')).toBeVisible();
  });

  test('should show error state in API test cards', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/kpi/summary', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch KPI data'
          }
        })
      });
    });
    
    // Click test KPI API button
    await page.click('button:has-text("Test KPI API")');
    
    // Check that error state is shown in the card
    await expect(page.locator('text=Failed to fetch KPI data')).toBeVisible();
  });

  test('should handle multiple simultaneous API calls', async ({ page }) => {
    // Mock both APIs to return success
    await page.route('/api/kpi/summary', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, success: true })
      });
    });
    
    await page.route('/api/me/subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, success: true })
      });
    });
    
    // Click both API test buttons
    await page.click('button:has-text("Test KPI API")');
    await page.click('button:has-text("Test Subscription API")');
    
    // Wait for both success toasts
    await expect(page.locator('text=KPI Data Loaded')).toBeVisible();
    await expect(page.locator('text=Subscription Loaded')).toBeVisible();
  });
});
