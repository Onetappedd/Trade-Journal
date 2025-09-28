import { z } from 'zod';

/**
 * Environment variable validation schema
 * Centralizes all environment variable access with type safety
 */

// Client-side environment variables (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  NEXT_PUBLIC_E2E_TEST: z.string().optional().default('false'),
  NEXT_PUBLIC_IMPORT_V2_ENABLED: z.string().optional().default('false'),
});

// Server-only environment variables
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required'),
  STRIPE_PRICE_BASIC: z.string().min(1, 'Stripe basic price ID is required'),
  STRIPE_PRICE_PRO: z.string().min(1, 'Stripe pro price ID is required'),
  SENTRY_DSN: z.string().url().optional(),
});

// Combined schema for runtime validation
const envSchema = clientEnvSchema.merge(serverEnvSchema);

// Type definitions for type safety
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validates and returns client-side environment variables
 * Safe to use in client components
 */
export function getClientEnv(): ClientEnv {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_E2E_TEST: process.env.NEXT_PUBLIC_E2E_TEST,
      NEXT_PUBLIC_IMPORT_V2_ENABLED: process.env.NEXT_PUBLIC_IMPORT_V2_ENABLED,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Missing or invalid client environment variables:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validates and returns server-only environment variables
 * Only safe to use in server-side code (API routes, middleware, etc.)
 */
export function getServerEnv(): ServerEnv {
  try {
    return serverEnvSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC,
      STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
      SENTRY_DSN: process.env.SENTRY_DSN,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Missing or invalid server environment variables:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validates all environment variables (client + server)
 * Use this in server-side code that needs access to both
 */
export function getEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Missing or invalid environment variables:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Runtime validation for server-side code
 * Call this at the top of server-side files to fail fast
 */
export function validateServerEnv(): void {
  try {
    getServerEnv();
  } catch (error) {
    console.error('❌ Server environment validation failed:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Runtime validation for client-side code
 * Call this at the top of client-side files to fail fast
 */
export function validateClientEnv(): void {
  try {
    getClientEnv();
  } catch (error) {
    console.error('❌ Client environment validation failed:');
    console.error(error);
    // In client-side, we can't exit the process, so we throw
    throw error;
  }
}

/**
 * Helper to check if we're in a test environment
 */
export function isTestEnv(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true';
}

/**
 * Helper to check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Helper to check if import v2 is enabled
 */
export function isImportV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_IMPORT_V2_ENABLED === 'true';
}

