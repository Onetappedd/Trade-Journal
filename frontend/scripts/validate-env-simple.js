#!/usr/bin/env node

/**
 * Simple environment validation script
 * Validates required environment variables without TypeScript dependencies
 */

// Import environment variable constants
const { ENV_KEYS, CLIENT_ENV_KEYS } = require('../src/lib/env-constants.js');

const requiredClientVars = [
  CLIENT_ENV_KEYS.SUPABASE_URL,
  CLIENT_ENV_KEYS.SUPABASE_ANON_KEY
];

const requiredServerVars = [
  ENV_KEYS.SUPABASE_SERVICE_ROLE_KEY
];

const optionalServerVars = [
  ENV_KEYS.STRIPE_WEBHOOK_SECRET,
  ENV_KEYS.STRIPE_PRICE_BASIC,
  ENV_KEYS.STRIPE_PRICE_PRO,
  ENV_KEYS.SENTRY_DSN
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...');
  
  const missingVars = [];
  const invalidVars = [];
  
  // Check client variables
  requiredClientVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else if (varName === 'NEXT_PUBLIC_SUPABASE_URL' && !value.startsWith('http')) {
      invalidVars.push(`${varName}: must be a valid URL`);
    }
  });
  
  // Check server variables (only if not in test mode)
  const isTestMode = process.env.NEXT_PUBLIC_E2E_TEST === 'true' || process.env.NODE_ENV === 'test';
  if (!isTestMode) {
    // Check required server variables
    requiredServerVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        missingVars.push(varName);
      }
    });
    
    // Check optional server variables and warn if missing
    const missingOptionalVars = [];
    optionalServerVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        missingOptionalVars.push(varName);
      }
    });
    
    if (missingOptionalVars.length > 0) {
      console.log('⚠️  Optional environment variables not set:');
      missingOptionalVars.forEach(varName => {
        console.log(`  - ${varName}`);
      });
      console.log('These features will be disabled if not configured.');
    }
  } else {
    console.log('⚠️  Skipping server env validation in test mode');
  }
  
  // Report results
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env.local file');
    process.exit(1);
  }
  
  if (invalidVars.length > 0) {
    console.error('❌ Invalid environment variables:');
    invalidVars.forEach(error => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Client environment variables validated');
  if (!isTestMode) {
    console.log('✅ Server environment variables validated');
  }
  console.log('🎉 All environment variables are valid!');
}

validateEnvironment();

