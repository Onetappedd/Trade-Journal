#!/usr/bin/env node

/**
 * E2E Test Runner Script
 * Handles test user seeding and teardown for e2e tests
 */

const { execSync } = require('child_process');
const path = require('path');

async function runE2ETests() {
  console.log('🚀 Starting E2E Tests...');
  
  try {
    // Set environment variables for test
    process.env.NODE_ENV = 'test';
    process.env.PLAYWRIGHT_TEST_MODE = 'true';
    
    // Run Playwright tests
    console.log('📋 Running Playwright tests...');
    execSync('npx playwright test tests/e2e/import.spec.ts --reporter=list', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ E2E tests completed successfully!');
  } catch (error) {
    console.error('❌ E2E tests failed:', error.message);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted, cleaning up...');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated, cleaning up...');
  process.exit(1);
});

runE2ETests();
