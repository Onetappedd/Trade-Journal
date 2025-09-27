#!/usr/bin/env ts-node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * E2E Test Failure Triage Script
 * Categorizes test failures and provides actionable fixes
 */

interface TestFailure {
  test: string;
  error: string;
  category: string;
  fix: string;
}

const FAILURE_PATTERNS = {
  AUTH_SESSION: [
    'Test session API disabled',
    'Session not authenticated',
    'No user ID in session',
    'Unauthorized',
    '401',
    '403'
  ],
  FEATURE_FLAG: [
    'Import v2 is disabled',
    'Import flag is disabled',
    'NEXT_PUBLIC_IMPORT_V2_ENABLED',
    'feature flag'
  ],
  SELECTOR_NOT_FOUND: [
    'getByTestId',
    'not found',
    'timeout',
    'element not visible',
    'selector'
  ],
  TIMING_NETWORK: [
    'timeout',
    'networkidle',
    'waitForLoadState',
    'navigation timeout'
  ],
  ENV_CONFIG: [
    '404',
    'Test session API disabled',
    'NEXT_PUBLIC_E2E_TEST',
    'environment'
  ]
};

function categorizeFailure(error: string): { category: string; fix: string } {
  const errorLower = error.toLowerCase();
  
  for (const [category, patterns] of Object.entries(FAILURE_PATTERNS)) {
    for (const pattern of patterns) {
      if (errorLower.includes(pattern.toLowerCase())) {
        return getFixForCategory(category);
      }
    }
  }
  
  return { category: 'UNKNOWN', fix: 'Manual investigation required' };
}

function getFixForCategory(category: string): { category: string; fix: string } {
  const fixes = {
    AUTH_SESSION: {
      category: 'AUTH/SESSION',
      fix: 'Check login flow, ensure session persistence, verify RLS policies'
    },
    FEATURE_FLAG: {
      category: 'FEATURE_FLAG', 
      fix: 'Set NEXT_PUBLIC_IMPORT_V2_ENABLED=true, verify flags helper usage'
    },
    SELECTOR_NOT_FOUND: {
      category: 'SELECTOR_NOT_FOUND',
      fix: 'Add missing data-testid attributes, update selectors in tests'
    },
    TIMING_NETWORK: {
      category: 'TIMING/NETWORK',
      fix: 'Add waitForLoadState, increase timeouts, check for race conditions'
    },
    ENV_CONFIG: {
      category: 'ENV/CONFIG',
      fix: 'Set NEXT_PUBLIC_E2E_TEST=true, verify environment variables'
    }
  };
  
  return fixes[category] || { category: 'UNKNOWN', fix: 'Manual investigation required' };
}

function parseTestResults(): TestFailure[] {
  const reportPath = join(process.cwd(), 'playwright-report', 'report.json');
  
  if (!existsSync(reportPath)) {
    console.log('❌ No test report found at:', reportPath);
    console.log('Run tests first with: pnpm test:e2e');
    return [];
  }
  
  try {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    const failures: TestFailure[] = [];
    
    for (const suite of report.suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          if (test.results && test.results.some(r => r.status === 'failed')) {
            const failedResult = test.results.find(r => r.status === 'failed');
            if (failedResult && failedResult.error) {
              const { category, fix } = categorizeFailure(failedResult.error.message);
              failures.push({
                test: `${spec.title} > ${test.title}`,
                error: failedResult.error.message,
                category,
                fix
              });
            }
          }
        }
      }
    }
    
    return failures;
  } catch (error) {
    console.error('❌ Failed to parse test report:', error);
    return [];
  }
}

function printTriageReport(failures: TestFailure[]): void {
  if (failures.length === 0) {
    console.log('🎉 No test failures found!');
    return;
  }
  
  console.log(`\n📊 Test Failure Triage Report (${failures.length} failures)\n`);
  
  // Group by category
  const byCategory = failures.reduce((acc, failure) => {
    if (!acc[failure.category]) {
      acc[failure.category] = [];
    }
    acc[failure.category].push(failure);
    return acc;
  }, {} as Record<string, TestFailure[]>);
  
  // Print each category
  for (const [category, categoryFailures] of Object.entries(byCategory)) {
    console.log(`🔍 ${category} (${categoryFailures.length} failures)`);
    console.log(`   Fix: ${categoryFailures[0].fix}`);
    console.log('');
    
    for (const failure of categoryFailures) {
      console.log(`   ❌ ${failure.test}`);
      console.log(`      Error: ${failure.error.substring(0, 100)}...`);
      console.log('');
    }
  }
  
  // Summary
  console.log('📋 Summary of Actions Needed:');
  for (const [category, categoryFailures] of Object.entries(byCategory)) {
    console.log(`   • ${category}: ${categoryFailures[0].fix}`);
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Fix issues by category (start with AUTH/SESSION)');
  console.log('   2. Re-run tests: pnpm test:e2e');
  console.log('   3. Check artifacts/ folder for screenshots');
  console.log('   4. Open playwright-report/index.html for detailed traces');
}

// Main execution
function main() {
  console.log('🔍 Analyzing E2E test failures...\n');
  
  const failures = parseTestResults();
  printTriageReport(failures);
  
  if (failures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { parseTestResults, printTriageReport };