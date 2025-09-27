import { test, expect } from '@playwright/test';

test.describe('Simple E2E Tests', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RiskR/);
  });

  test('loads home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'ProfitPad Home' })).toBeVisible();
  });

  test('test API endpoint security', async ({ page }) => {
    const response = await page.request.get('/api/test/me');
    expect([404, 401]).toContain(response.status());
  });
});
