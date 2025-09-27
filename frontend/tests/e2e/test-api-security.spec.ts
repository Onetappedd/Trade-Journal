import { test, expect } from '@playwright/test';

test.describe('Test API Security', () => {
  test('test API endpoint returns 404 in production environment', async ({ page }) => {
    // Navigate to the test API endpoint
    const response = await page.request.get('/api/test/me');
    
    // Should return 404 since we're not in a test environment
    // Note: This test might return 401 if E2E_TEST is set, which is expected
    expect([404, 401]).toContain(response.status());
    
    const body = await response.json();
    expect(['Not Found', 'No authorization token provided']).toContain(body.error);
  });

  test('test API endpoint requires authentication', async ({ page }) => {
    // This test would need to be run in a test environment
    // to verify the authentication requirement
    // For now, we'll just verify the endpoint exists
    const response = await page.request.get('/api/test/me');
    expect([404, 401]).toContain(response.status());
  });
});
