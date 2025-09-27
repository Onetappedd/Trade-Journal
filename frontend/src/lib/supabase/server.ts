/**
 * Supabase Client for Server Usage
 * 
 * Only use this wrapper in server-side code (API routes, middleware, etc.).
 * This file provides typed Supabase clients that automatically
 * consume environment variables from the centralized env system.
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { getClientEnv, getServerEnv } from '@/lib/env';

// Get validated environment variables
const clientEnv = getClientEnv();
const serverEnv = getServerEnv();

/**
 * Creates a Supabase client for server usage with anon key
 * Use this for operations that should respect RLS policies
 */
export function createSupabaseClient() {
  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/**
 * Creates a Supabase client with service role key
 * Use this for admin operations that bypass RLS
 * WARNING: Only use for operations that require elevated privileges
 */
export function createSupabaseAdmin() {
  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/**
 * Creates a Supabase client with user token for authenticated requests
 * Use this when you have a user token and want to make authenticated requests
 */
export function createSupabaseWithToken(token: string) {
  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

// Export the createClient function for custom configurations
export { createClient };
