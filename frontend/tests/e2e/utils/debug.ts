import { Page, expect } from '@playwright/test';

/**
 * Debug utilities for E2E tests
 * Provides functions to verify authentication, flags, and capture debugging info
 */

export interface SessionInfo {
  ok: boolean;
  user: { id: string; email: string };
  flags: { IMPORT_V2: boolean; IS_E2E: boolean };
  now: string;
}

/**
 * Assert that the user is authenticated by calling the test session API
 */
export async function assertAuthed(page: Page): Promise<SessionInfo> {
  console.log('🔐 Checking authentication status...');
  
  const response = await page.request.get('/api/test/session');
  
  if (response.status() === 404) {
    throw new Error('Test session API disabled - set NEXT_PUBLIC_E2E_TEST=true');
  }
  
  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Session API error: ${response.status()} - ${errorText}`);
  }
  
  const sessionInfo: SessionInfo = await response.json();
  
  if (!sessionInfo.ok) {
    throw new Error(`Session not authenticated: ${JSON.stringify(sessionInfo)}`);
  }
  
  if (!sessionInfo.user?.id) {
    throw new Error('No user ID in session response');
  }
  
  console.log(`✅ User authenticated: ${sessionInfo.user.email} (${sessionInfo.user.id})`);
  return sessionInfo;
}

/**
 * Assert that the import flag is enabled
 */
export async function assertImportFlagOn(page: Page): Promise<void> {
  console.log('🚩 Checking import flag status...');
  
  // Try to get the flag from the page element first
  try {
    const flagElement = page.getByTestId('import-flag');
    const flagText = await flagElement.textContent();
    
    if (flagText === 'enabled') {
      console.log('✅ Import flag is enabled (from page element)');
      return;
    } else if (flagText === 'disabled') {
      throw new Error('Import flag is disabled on page');
    }
  } catch (e) {
    console.log('⚠️ Could not find import-flag element, trying session API...');
  }
  
  // Fallback to session API
  const sessionInfo = await assertAuthed(page);
  
  if (!sessionInfo.flags.IMPORT_V2) {
    throw new Error('Import v2 flag is disabled in session');
  }
  
  console.log('✅ Import flag is enabled (from session API)');
}

/**
 * Capture a screenshot with a descriptive name
 */
export async function captureScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `artifacts/${name}-${timestamp}.png`;
  
  await page.screenshot({ 
    path: filename, 
    fullPage: true 
  });
  
  console.log(`📸 Screenshot saved: ${filename}`);
}

/**
 * Wait for network to be idle and capture console errors
 */
export async function waitForStablePage(page: Page): Promise<void> {
  console.log('⏳ Waiting for page to stabilize...');
  
  // Set up console error collection
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      console.log('🚨 CONSOLE ERROR:', errorText);
      consoleErrors.push(errorText);
    }
  });
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for any async operations
  await page.waitForTimeout(1000);
  
  if (consoleErrors.length > 0) {
    console.log(`⚠️ Found ${consoleErrors.length} console errors`);
  } else {
    console.log('✅ No console errors detected');
  }
}

/**
 * Check if a page is in an error state
 */
export async function checkForErrorStates(page: Page): Promise<string[]> {
  const errorSelectors = [
    'text=/error/i',
    'text=/failed/i',
    'text=/unauthorized/i',
    'text=/forbidden/i',
    'text=/not found/i',
    '.error',
    '[data-testid="error-message"]',
    '[data-testid="settings-error"]',
    '[data-testid="settings-loading"]'
  ];
  
  const errors: string[] = [];
  
  for (const selector of errorSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        const text = await element.textContent();
        if (text && text.trim()) {
          errors.push(`${selector}: ${text.trim()}`);
        }
      }
    } catch (e) {
      // Continue checking other selectors
    }
  }
  
  return errors;
}

/**
 * Comprehensive page health check
 */
export async function performHealthCheck(page: Page, pageName: string): Promise<void> {
  console.log(`🏥 Performing health check for ${pageName}...`);
  
  // Wait for page to stabilize
  await waitForStablePage(page);
  
  // Check for error states
  const errors = await checkForErrorStates(page);
  if (errors.length > 0) {
    console.log('❌ Error states detected:');
    errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('✅ No error states detected');
  }
  
  // Capture screenshot for debugging
  await captureScreenshot(page, `${pageName}-health-check`);
  
  // Check authentication if not on login page
  if (!page.url().includes('/auth/') && !page.url().includes('/login')) {
    try {
      await assertAuthed(page);
    } catch (e) {
      console.log('⚠️ Authentication check failed:', e.message);
    }
  }
}

