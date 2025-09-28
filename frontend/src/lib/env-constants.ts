/**
 * Environment variable constants
 * This file contains the names of environment variables used in the application
 * It's safe to commit this file as it only contains variable names, not values
 */

// Server-only environment variables (never exposed to client)
export const ENV_KEYS = {
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  
  // Stripe
  STRIPE_WEBHOOK_SECRET: 'STRIPE_WEBHOOK_SECRET',
  STRIPE_PRICE_BASIC: 'STRIPE_PRICE_BASIC',
  STRIPE_PRICE_PRO: 'STRIPE_PRICE_PRO',
  
  // Monitoring
  SENTRY_DSN: 'SENTRY_DSN',
} as const;

// Client-safe environment variables (exposed to browser)
export const CLIENT_ENV_KEYS = {
  // Supabase
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  
  // Feature flags
  E2E_TEST: 'NEXT_PUBLIC_E2E_TEST',
  IMPORT_V2_ENABLED: 'NEXT_PUBLIC_IMPORT_V2_ENABLED',
} as const;

// Type for server-only environment variables
export type ServerEnvKey = keyof typeof ENV_KEYS;

// Type for client-safe environment variables  
export type ClientEnvKey = keyof typeof CLIENT_ENV_KEYS;
