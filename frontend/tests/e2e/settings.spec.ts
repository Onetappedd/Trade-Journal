import { test, expect } from '@playwright/test';
import { login, logout } from './utils/auth';
import { SETTINGS_SELECTORS, AUTH_SELECTORS, settingsSelectors } from './utils/selectors';
import { seedE2EUser, teardownE2EUser } from './utils/seed-helper';

// Test user credentials (will be seeded before tests)
let testUser: { email: string; password: string; userId: string } | null = null;
let collisionUser: { email: string; password: string; userId: string } | null = null;

test.describe('Settings Page E2E Tests', () => {
  test.beforeAll(async () => {
    // Seed primary test user
    console.log('🌱 Seeding primary test user for settings tests...');
    testUser = await seedE2EUser();
    console.log('✅ Primary test user created:', testUser.email);

    // Seed collision test user for username uniqueness testing
    console.log('🌱 Seeding collision test user...');
    collisionUser = await seedE2EUser();
    console.log('✅ Collision test user created:', collisionUser.email);
  });

  test.afterAll(async () => {
    // Teardown both test users
    if (testUser) {
      console.log('🧹 Cleaning up primary test user...');
      await teardownE2EUser({ userId: testUser.userId });
      console.log('✅ Primary test user cleaned up');
    }
    
    if (collisionUser) {
      console.log('🧹 Cleaning up collision test user...');
      await teardownE2EUser({ userId: collisionUser.userId });
      console.log('✅ Collision test user cleaned up');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    if (!testUser) {
      throw new Error('Test user not created');
    }
    
    await login(page, { email: testUser.email, password: testUser.password });
    
    // Navigate to settings page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('loads settings page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Settings/);
    
    // Assert settings form is present
    const nameInput = page.locator(SETTINGS_SELECTORS.nameInput);
    const usernameInput = page.locator(SETTINGS_SELECTORS.usernameInput);
    const emailInput = page.locator(SETTINGS_SELECTORS.emailInput);
    
    await expect(nameInput).toBeVisible();
    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
  });

  test('update display name', async ({ page }) => {
    const newName = `Test User ${Date.now()}`;
    
    // Change name field using stable selector
    const nameInput = settingsSelectors.nameInput(page);
    await nameInput.clear();
    await nameInput.fill(newName);
    
    // Click save
    const saveButton = settingsSelectors.saveProfile(page);
    await saveButton.click();
    
    // Wait for success toast
    await expect(settingsSelectors.toastSuccess(page)).toBeVisible({ timeout: 10000 });
    
    // Reload page and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const updatedNameInput = settingsSelectors.nameInput(page);
    await expect(updatedNameInput).toHaveValue(newName);
    
    // Verify in DB via test API
    const response = await page.request.get('/api/test/me');
    expect(response.status()).toBe(200);
    const userData = await response.json();
    expect(userData.display_name).toBe(newName);
  });

  test('update username', async ({ page }) => {
    const newUsername = `testuser${Date.now()}`;
    
    // Change username field using stable selector
    const usernameInput = settingsSelectors.usernameInput(page);
    await usernameInput.clear();
    await usernameInput.fill(newUsername);
    
    // Click save
    const saveButton = settingsSelectors.saveProfile(page);
    await saveButton.click();
    
    // Wait for success toast
    await expect(settingsSelectors.toastSuccess(page)).toBeVisible({ timeout: 10000 });
    
    // Reload page and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const updatedUsernameInput = page.locator(SETTINGS_SELECTORS.usernameInput);
    await expect(updatedUsernameInput).toHaveValue(newUsername);
    
    // Verify in DB via test API
    const response = await page.request.get('/api/test/me');
    expect(response.status()).toBe(200);
    const userData = await response.json();
    expect(userData.username).toBe(newUsername);
  });

  test('username uniqueness constraint', async ({ page }) => {
    if (!collisionUser) {
      throw new Error('Collision user not created');
    }
    
    // Try to use the collision user's username
    const usernameInput = page.locator(SETTINGS_SELECTORS.usernameInput);
    await usernameInput.clear();
    await usernameInput.fill('existing'); // This should be taken by collision user
    
    // Click save
    const saveButton = page.locator(SETTINGS_SELECTORS.profileSaveButton);
    await saveButton.click();
    
    // Expect inline error for username uniqueness
    const errorMessage = page.locator('[data-testid="settings-username-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Username already taken');
    
    // Save button should be disabled
    await expect(saveButton).toBeDisabled();
  });

  test('update email', async ({ page }) => {
    const newEmail = `new+${Date.now()}@riskr.local`;
    
    // Change email field using stable selector
    const emailInput = settingsSelectors.emailInput(page);
    await emailInput.clear();
    await emailInput.fill(newEmail);
    
    // Click save
    const saveButton = settingsSelectors.saveProfile(page);
    await saveButton.click();
    
    // Wait for success toast
    await expect(settingsSelectors.toastSuccess(page)).toBeVisible({ timeout: 10000 });
    
    // Reload page and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const updatedEmailInput = page.locator(SETTINGS_SELECTORS.emailInput);
    await expect(updatedEmailInput).toHaveValue(newEmail);
    
    // Verify in DB via test API
    const response = await page.request.get('/api/test/me');
    expect(response.status()).toBe(200);
    const userData = await response.json();
    expect(userData.email).toBe(newEmail);
  });

  test('update password', async ({ page }) => {
    const newPassword = 'New!23456';
    
    // Fill password fields using stable selectors
    const currentPasswordInput = settingsSelectors.passwordInput(page);
    const newPasswordInput = page.locator(SETTINGS_SELECTORS.newPasswordInput);
    const confirmPasswordInput = page.locator(SETTINGS_SELECTORS.confirmPasswordInput);
    
    await currentPasswordInput.fill(testUser!.password);
    await newPasswordInput.fill(newPassword);
    await confirmPasswordInput.fill(newPassword);
    
    // Click save
    const saveButton = settingsSelectors.saveSecurity(page);
    await saveButton.click();
    
    // Wait for success toast
    await expect(settingsSelectors.toastSuccess(page)).toBeVisible({ timeout: 10000 });
    
    // Logout and login with new password
    await logout(page);
    await login(page, { email: testUser!.email, password: newPassword });
    
    // Verify successful login
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('toggle notification settings', async ({ page }) => {
    // Toggle email notifications
    const emailToggle = page.locator(SETTINGS_SELECTORS.emailNotificationsToggle);
    await emailToggle.click();
    
    // Toggle push notifications
    const pushToggle = page.locator(SETTINGS_SELECTORS.pushNotificationsToggle);
    await pushToggle.click();
    
    // Toggle trade alerts
    const tradeAlertsToggle = page.locator(SETTINGS_SELECTORS.tradeAlertsToggle);
    await tradeAlertsToggle.click();
    
    // Toggle weekly reports
    const weeklyReportsToggle = page.locator(SETTINGS_SELECTORS.weeklyReportsToggle);
    await weeklyReportsToggle.click();
    
    // Click save
    const saveButton = page.locator(SETTINGS_SELECTORS.profileSaveButton);
    await saveButton.click();
    
    // Expect success toast
    const successToast = page.locator(SETTINGS_SELECTORS.successToast);
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Profile Updated');
    
    // Reload page and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify toggles are in new state
    await expect(emailToggle).toBeChecked();
    await expect(pushToggle).toBeChecked();
    await expect(tradeAlertsToggle).toBeChecked();
    await expect(weeklyReportsToggle).toBeChecked();
    
    // Verify in DB via test API
    const response = await page.request.get('/api/test/me');
    expect(response.status()).toBe(200);
    const userData = await response.json();
    expect(userData.email_notifications).toBe(true);
    expect(userData.push_notifications).toBe(true);
    expect(userData.trade_alerts).toBe(true);
    expect(userData.weekly_reports).toBe(true);
  });

  test('missing required fields validation', async ({ page }) => {
    // Clear required fields
    const nameInput = page.locator(SETTINGS_SELECTORS.nameInput);
    const usernameInput = page.locator(SETTINGS_SELECTORS.usernameInput);
    const emailInput = page.locator(SETTINGS_SELECTORS.emailInput);
    
    await nameInput.clear();
    await usernameInput.clear();
    await emailInput.clear();
    
    // Try to save
    const saveButton = page.locator(SETTINGS_SELECTORS.profileSaveButton);
    await saveButton.click();
    
    // Expect inline validation errors
    const nameError = page.locator('[data-testid="settings-name-error"]');
    const usernameError = page.locator('[data-testid="settings-username-error"]');
    const emailError = page.locator('[data-testid="settings-email-error"]');
    
    await expect(nameError).toBeVisible();
    await expect(usernameError).toBeVisible();
    await expect(emailError).toBeVisible();
    
    // Save button should be disabled
    await expect(saveButton).toBeDisabled();
  });

  test('RLS check - unauthorized access', async ({ page }) => {
    // Clear storage to simulate no session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Try to access settings page
    await page.goto('/settings');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator(AUTH_SELECTORS.signInButton)).toBeVisible();
  });

  test('delete all trades functionality', async ({ page }) => {
    // Click delete all trades button
    const deleteButton = page.locator(SETTINGS_SELECTORS.deleteAllTradesButton);
    await deleteButton.click();
    
    // Confirm deletion
    const confirmInput = page.locator(SETTINGS_SELECTORS.deleteConfirmInput);
    await confirmInput.fill('DELETE ALL TRADES');
    
    const confirmButton = page.locator(SETTINGS_SELECTORS.confirmDeleteButton);
    await confirmButton.click();
    
    // Expect success toast
    const successToast = page.locator(SETTINGS_SELECTORS.successToast);
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Trades Deleted');
    
    // Verify trades are deleted by navigating to trades page
    await page.goto('/trades');
    await expect(page.getByText('No trades found')).toBeVisible();
  });

  test('theme toggle functionality', async ({ page }) => {
    // Check if theme toggle is present
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      // Toggle theme
      await themeToggle.click();
      
      // Verify theme change (check for dark/light class on body)
      const body = page.locator('body');
      const hasDarkClass = await body.evaluate(el => el.classList.contains('dark'));
      
      // Toggle again to verify it works
      await themeToggle.click();
      const hasLightClass = await body.evaluate(el => !el.classList.contains('dark'));
      
      expect(hasLightClass).toBe(true);
    }
  });

  test('profile picture upload', async ({ page }) => {
    // Check if profile picture upload is present
    const profilePictureInput = page.locator('[data-testid="settings-profile-picture-input"]');
    if (await profilePictureInput.isVisible()) {
      // Create a small test image
      const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      
      // Upload test image
      await profilePictureInput.setInputFiles({
        name: 'test-avatar.png',
        mimeType: 'image/png',
        buffer: testImage
      });
      
      // Expect success toast
      const successToast = page.locator(SETTINGS_SELECTORS.successToast);
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText('Profile picture updated');
    }
  });
});