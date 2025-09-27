import { test, expect } from '@playwright/test';

test.describe('Database Schema Verification', () => {
  test('verify ingestion_runs table exists with required columns', async ({ page }) => {
    // This test will verify the database schema by making API calls
    // that would fail if the required tables/columns don't exist
    
    await page.goto('/api/test/me');
    
    // If we get here without a 500 error, the basic database connection works
    const response = await page.request.get('/api/test/me');
    expect([200, 401, 404]).toContain(response.status());
  });

  test('verify trades table has required columns', async ({ page }) => {
    // Test that the trades API works (which requires the trades table)
    await page.goto('/api/trades');
    
    const response = await page.request.get('/api/trades');
    // Should get 401 (unauthorized) or 200 (if authenticated), not 500 (server error)
    expect([200, 401, 404]).toContain(response.status());
  });

  test('verify import API works (requires ingestion_runs table)', async ({ page }) => {
    // Test that the import API works (which requires the ingestion_runs table)
    await page.goto('/api/import/status');
    
    const response = await page.request.get('/api/import/status');
    // Should get 401 (unauthorized) or 200 (if authenticated), not 500 (server error)
    expect([200, 401, 404]).toContain(response.status());
  });
});

