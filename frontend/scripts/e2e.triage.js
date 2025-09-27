#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

/**
 * E2E Test Failure Triage Script
 * 
 * Analyzes Playwright test failures and categorizes them with remediation steps.
 * Usage: node scripts/e2e.triage.js
 */

class E2ETriage {
  constructor() {
    this.reportPath = './playwright-report/report.json';
    this.failures = [];
  }

  async run() {
    console.log('🔍 Running E2E tests and analyzing failures...\n');

    try {
      // Run the e2e tests
      execSync('pnpm test:e2e', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ All tests passed!');
      return;
    } catch (error) {
      console.log('❌ Tests failed, analyzing results...\n');
    }

    // Check if report exists
    if (!existsSync(this.reportPath)) {
      console.error('❌ Playwright report not found at:', this.reportPath);
      console.log('💡 Make sure to run tests with --reporter=json or check the report path');
      process.exit(1);
    }

    // Parse and analyze the report
    await this.analyzeReport();
    this.printSummary();
  }

  async analyzeReport() {
    try {
      const reportData = readFileSync(this.reportPath, 'utf-8');
      const report = JSON.parse(reportData);
      
      // Extract all failed tests
      const failedTests = [];

      for (const suite of report.suites) {
        for (const spec of suite.specs) {
          for (const test of spec.tests) {
            if (test.status === 'failed' && test.error) {
              failedTests.push({
                test: test.title,
                file: test.location?.file || 'unknown',
                line: test.location?.line || 0,
                message: test.error.message,
                stack: test.error.stack
              });
            }
          }
        }
      }

      // Categorize failures
      this.categorizeFailures(failedTests);
    } catch (error) {
      console.error('❌ Error parsing Playwright report:', error);
      process.exit(1);
    }
  }

  categorizeFailures(failedTests) {
    const categories = new Map();

    for (const failure of failedTests) {
      const category = this.determineCategory(failure.message, failure.stack || '');
      
      if (!categories.has(category)) {
        categories.set(category, {
          category,
          count: 0,
          failures: []
        });
      }

      const cat = categories.get(category);
      cat.count++;
      cat.failures.push({
        test: failure.test,
        file: failure.file,
        line: failure.line,
        message: failure.message,
        remediation: this.getRemediationSteps(category, failure)
      });
    }

    this.failures = Array.from(categories.values());
  }

  determineCategory(message, stack) {
    const msg = message.toLowerCase();
    const stk = stack.toLowerCase();

    // (A) SELECTOR_NOT_FOUND
    if (msg.includes('timeout') && (
      msg.includes('getbyrole') || 
      msg.includes('getbytext') || 
      msg.includes('getbylabel') ||
      msg.includes('locator') ||
      msg.includes('element not found') ||
      msg.includes('strict mode violation')
    )) {
      return 'SELECTOR_NOT_FOUND';
    }

    // (B) TIMING/NETWORK
    if (msg.includes('timeout') && (
      msg.includes('waiting for') ||
      msg.includes('navigation') ||
      msg.includes('networkidle') ||
      msg.includes('url') ||
      msg.includes('load state')
    )) {
      return 'TIMING_NETWORK';
    }

    // (C) AUTH/SESSION
    if (msg.includes('login') || 
        msg.includes('sign-in') || 
        msg.includes('unauthorized') ||
        msg.includes('401') ||
        msg.includes('403') ||
        msg.includes('redirect') && msg.includes('login')
    ) {
      return 'AUTH_SESSION';
    }

    // (D) FEATURE_FLAG
    if (msg.includes('import v2') || 
        msg.includes('feature flag') ||
        msg.includes('disabled') ||
        msg.includes('not enabled')
    ) {
      return 'FEATURE_FLAG';
    }

    // (E) FILE_UPLOAD
    if (msg.includes('file') && (
      msg.includes('chooser') ||
      msg.includes('upload') ||
      msg.includes('not found') ||
      msg.includes('path')
    )) {
      return 'FILE_UPLOAD';
    }

    // (F) SUPABASE/RLS
    if (msg.includes('supabase') ||
        msg.includes('row level security') ||
        msg.includes('rls') ||
        msg.includes('insert failed') ||
        msg.includes('violates') ||
        msg.includes('permission denied')
    ) {
      return 'SUPABASE_RLS';
    }

    // (G) ENV/CONFIG
    if (msg.includes('environment') ||
        msg.includes('env') ||
        msg.includes('baseurl') ||
        msg.includes('port') ||
        msg.includes('missing') && msg.includes('variable')
    ) {
      return 'ENV_CONFIG';
    }

    return 'OTHER';
  }

  getRemediationSteps(category, failure) {
    const steps = [];

    switch (category) {
      case 'SELECTOR_NOT_FOUND':
        steps.push('🔍 Check if element exists in the DOM');
        steps.push('⏱️ Add explicit wait: await page.waitForSelector(selector)');
        steps.push('🎯 Use more specific selectors (data-testid preferred)');
        steps.push('📝 Update test to match current UI structure');
        if (failure.message.includes('strict mode')) {
          steps.push('🔧 Fix strict mode violation by making selector unique');
        }
        break;

      case 'TIMING_NETWORK':
        steps.push('⏱️ Increase timeout: await page.waitForTimeout(5000)');
        steps.push('🔄 Add retry logic for flaky network requests');
        steps.push('🌐 Check if server is running and accessible');
        steps.push('📡 Wait for specific network requests: await page.waitForResponse()');
        break;

      case 'AUTH_SESSION':
        steps.push('🔐 Implement proper authentication in test setup');
        steps.push('👤 Use test user credentials in beforeAll hook');
        steps.push('🍪 Check if session cookies are being set correctly');
        steps.push('🔄 Ensure auth state persists between test steps');
        break;

      case 'FEATURE_FLAG':
        steps.push('🚩 Set NEXT_PUBLIC_IMPORT_V2_ENABLED=true in environment');
        steps.push('🔧 Check feature flag implementation in components');
        steps.push('📝 Update test to handle feature flag states');
        break;

      case 'FILE_UPLOAD':
        steps.push('📁 Ensure test files exist in tests/fixtures/');
        steps.push('🔧 Use page.setInputFiles() for file uploads');
        steps.push('📂 Check file paths are correct and accessible');
        steps.push('🎯 Wait for file input to be ready before uploading');
        break;

      case 'SUPABASE_RLS':
        steps.push('🔒 Check RLS policies are correctly configured');
        steps.push('👤 Ensure test user has proper permissions');
        steps.push('🔑 Verify Supabase service role key is set');
        steps.push('📊 Check database schema and constraints');
        break;

      case 'ENV_CONFIG':
        steps.push('🌍 Set required environment variables');
        steps.push('📝 Check .env.local file exists and is loaded');
        steps.push('🔧 Verify Playwright config baseURL is correct');
        steps.push('🚀 Ensure test server is running on correct port');
        break;

      default:
        steps.push('🔍 Review error message and stack trace');
        steps.push('📚 Check Playwright documentation for similar issues');
        steps.push('🐛 Consider if this is a flaky test that needs retry logic');
        steps.push('💬 Add more specific error handling in test code');
    }

    return steps;
  }

  printSummary() {
    if (this.failures.length === 0) {
      console.log('✅ No failures found!');
      return;
    }

    console.log('📊 E2E Test Failure Analysis\n');
    console.log('=' .repeat(60));

    for (const category of this.failures) {
      console.log(`\n🔴 ${category.category} (${category.count} failures)`);
      console.log('-'.repeat(40));

      for (const failure of category.failures) {
        console.log(`\n📝 Test: ${failure.test}`);
        console.log(`📁 File: ${failure.file}:${failure.line}`);
        console.log(`💬 Error: ${failure.message}`);
        console.log('🔧 Remediation:');
        failure.remediation.forEach(step => console.log(`   ${step}`));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📈 Total failures: ${this.failures.reduce((sum, cat) => sum + cat.count, 0)}`);
    console.log(`📂 Categories: ${this.failures.length}`);
    
    // Print quick fix summary
    console.log('\n🚀 Quick Fixes:');
    for (const category of this.failures) {
      const quickFix = this.getQuickFix(category.category);
      console.log(`   ${category.category}: ${quickFix}`);
    }
  }

  getQuickFix(category) {
    switch (category) {
      case 'SELECTOR_NOT_FOUND':
        return 'Add data-testid attributes and explicit waits';
      case 'TIMING_NETWORK':
        return 'Increase timeouts and add retry logic';
      case 'AUTH_SESSION':
        return 'Implement proper test authentication';
      case 'FEATURE_FLAG':
        return 'Set NEXT_PUBLIC_IMPORT_V2_ENABLED=true';
      case 'FILE_UPLOAD':
        return 'Check test fixtures and file paths';
      case 'SUPABASE_RLS':
        return 'Verify RLS policies and service role key';
      case 'ENV_CONFIG':
        return 'Set required environment variables';
      default:
        return 'Review error details and implement specific fixes';
    }
  }
}

// Run the triage
async function main() {
  const triage = new E2ETriage();
  await triage.run();
  
  // Exit with non-zero if there were failures
  process.exit(1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Triage failed:', error);
    process.exit(1);
  });
}

module.exports = { E2ETriage };

