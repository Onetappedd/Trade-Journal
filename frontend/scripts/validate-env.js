#!/usr/bin/env node

/**
 * Environment validation script
 * Run this at startup to ensure all required environment variables are present
 */

// Import the env validation functions
// Note: This is a CommonJS script, so we need to use dynamic import for ES modules
async function validateEnvironment() {
  try {
    const { validateServerEnv, validateClientEnv, isTestEnv } = await import('../src/lib/env.ts');
    
    console.log('🔍 Validating environment variables...');

    // Always validate client env (safe for both client and server)
    validateClientEnv();
    console.log('✅ Client environment variables validated');

    // Only validate server env if not in test mode
    if (!isTestEnv()) {
      validateServerEnv();
      console.log('✅ Server environment variables validated');
    } else {
      console.log('⚠️  Skipping server env validation in test mode');
    }

    console.log('🎉 All environment variables are valid!');
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

validateEnvironment();
