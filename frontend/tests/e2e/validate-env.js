#!/usr/bin/env node

/**
 * Environment Validation Script for E2E Tests
 * Ensures all required environment variables are set before running tests
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_IMPORT_V2_ENABLED',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

function validateEnvironment() {
  console.log('🔍 Validating E2E test environment...');
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  // Check for E2E_TEST flag
  if (!process.env.E2E_TEST) {
    warnings.push('E2E_TEST not set (will be set automatically)');
    process.env.E2E_TEST = 'true';
  }
  
  // Check for NODE_ENV
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    warnings.push('NODE_ENV should be "test" or "development" for E2E tests');
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\nPlease set these environment variables before running E2E tests.');
    console.error('You can create a .env.test file or set them in your CI environment.');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log('✅ Environment validation passed');
  console.log('📋 Environment summary:');
  console.log(`  - NEXT_PUBLIC_IMPORT_V2_ENABLED: ${process.env.NEXT_PUBLIC_IMPORT_V2_ENABLED}`);
  console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}`);
  console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'}`);
  console.log(`  - E2E_TEST: ${process.env.E2E_TEST}`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };

