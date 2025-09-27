import { Page, expect } from '@playwright/test';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login utility for e2e tests
 * Handles the sign-in flow and waits for successful authentication
 */
export async function login(page: Page, credentials: LoginCredentials): Promise<void> {
  const { email, password } = credentials;

  console.log(`🔐 Logging in with email: ${email}`);

  // Navigate to sign-in page directly
  await page.goto('/auth/sign-in');
  await page.waitForLoadState('networkidle');

  // Wait for auth form to appear
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  // Fill in credentials
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Submit the form
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
  await submitButton.click();

  // Wait for successful authentication - check for redirect to dashboard
  try {
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    console.log('✅ Successfully redirected to dashboard');
  } catch (e) {
    // If no redirect, check for user avatar or other indicators
    const successIndicators = [
      '[data-testid="user-avatar"]',
      '[data-testid="user-menu"]',
      '.avatar',
      'text=/dashboard/i',
      'text=/trades/i',
      'text=/analytics/i'
    ];

    let authenticated = false;
    for (const indicator of successIndicators) {
      try {
        await page.waitForSelector(indicator, { timeout: 5000 });
        authenticated = true;
        break;
      } catch (e) {
        // Continue checking other indicators
      }
    }

    if (!authenticated) {
      // Check for error messages
      const errorSelectors = [
        'text=/invalid/i',
        'text=/error/i',
        'text=/failed/i',
        '.error',
        '[data-testid="error-message"]'
      ];

      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          throw new Error(`Login failed: ${errorText}`);
        }
      }

      throw new Error('Login failed: No authentication indicators found');
    }
  }

  // Wait for network to be idle after successful login
  await page.waitForLoadState('networkidle');
  console.log('✅ Successfully logged in');
}

/**
 * Logout utility for e2e tests
 */
export async function logout(page: Page): Promise<void> {
  console.log('🚪 Logging out...');

  // Look for user menu or avatar
  const userMenuSelectors = [
    '[data-testid="user-menu"]',
    '[data-testid="user-avatar"]',
    '.avatar',
    'button:has-text("Profile")',
    'button:has-text("Account")'
  ];

  let userMenu = null;
  for (const selector of userMenuSelectors) {
    try {
      userMenu = page.locator(selector).first();
      if (await userMenu.isVisible()) {
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!userMenu || !(await userMenu.isVisible())) {
    throw new Error('Could not find user menu or avatar');
  }

  // Click to open user menu
  await userMenu.click();

  // Look for logout option
  const logoutSelectors = [
    'text=/log out/i',
    'text=/sign out/i',
    'text=/logout/i',
    '[data-testid="logout-button"]',
    'button:has-text("Log out")',
    'button:has-text("Sign out")'
  ];

  let logoutButton = null;
  for (const selector of logoutSelectors) {
    try {
      logoutButton = page.locator(selector).first();
      if (await logoutButton.isVisible()) {
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!logoutButton || !(await logoutButton.isVisible())) {
    throw new Error('Could not find logout button');
  }

  // Click logout
  await logoutButton.click();

  // Wait for redirect to login or home page
  await page.waitForURL(/\/(login|auth|$)/, { timeout: 10000 });

  console.log('✅ Successfully logged out');
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const loggedInIndicators = [
    '[data-testid="user-avatar"]',
    '[data-testid="user-menu"]',
    '.avatar',
    'text=/dashboard/i',
    'text=/trades/i',
    'text=/analytics/i'
  ];

  for (const indicator of loggedInIndicators) {
    try {
      const element = page.locator(indicator).first();
      if (await element.isVisible()) {
        return true;
      }
    } catch (e) {
      // Continue checking
    }
  }

  return false;
}
