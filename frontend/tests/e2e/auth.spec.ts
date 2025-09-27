import { test, expect } from '@playwright/test';

// Test user credentials (will be seeded before tests)
const TEST_USER = {
  email: 'e2e_user+test@riskr.local',
  password: 'Test!23456'
};

test.describe('Authentication Flow', () => {
  test('should login with test user', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Look for sign in button or link
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
    
    // Click sign in
    await signInButton.click();

    // Wait for auth form to appear
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill in credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or authenticated area
    await page.waitForURL(/dashboard|trades|analytics/, { timeout: 15000 });

    // Verify we're logged in by checking for user-specific content
    await expect(page.getByText(/dashboard|trades|analytics/i)).toBeVisible();
  });

  test('should display user profile in header', async ({ page }) => {
    // This test assumes the user is already logged in
    // In a real scenario, you'd either seed the session or login first
    
    await page.goto('/dashboard');

    // Check for user avatar or profile indicator in header
    const userAvatar = page.locator('[data-testid="user-avatar"], .avatar, [alt*="User"]').first();
    await expect(userAvatar).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Navigate to a protected page
    await page.goto('/dashboard');

    // Click on user menu/avatar
    const userMenu = page.locator('[data-testid="user-menu"], .user-menu').first();
    await userMenu.click();

    // Look for logout option
    const logoutButton = page.getByRole('menuitem', { name: /log out|sign out/i });
    await expect(logoutButton).toBeVisible();
    
    // Click logout
    await logoutButton.click();

    // Should redirect to login or home page
    await page.waitForURL(/\/(login|auth|$)/, { timeout: 10000 });
  });
});
