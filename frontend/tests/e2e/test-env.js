/**
 * Test Environment Configuration
 * Ensures all required environment variables are set for E2E tests
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_IMPORT_V2_ENABLED',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

function validateTestEnvironment() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables for E2E tests:');
    missing.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\nPlease set these environment variables before running tests.');
    process.exit(1);
  }
  
  // Set E2E_TEST if not already set
  if (!process.env.E2E_TEST) {
    process.env.E2E_TEST = 'true';
  }
  
  console.log('✅ All required environment variables are set for E2E tests');
}

module.exports = { validateTestEnvironment };

