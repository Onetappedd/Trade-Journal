/**
 * Supabase Client for Browser Usage
 * 
 * Only use this wrapper in the browser/client-side code.
 * This file provides a typed Supabase client that automatically
 * consumes environment variables from the centralized env system.
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { getClientEnv } from '@/lib/env';

// Get validated client environment variables
const clientEnv = getClientEnv();

/**
 * Creates a Supabase client for browser usage
 * Automatically uses the correct environment variables
 */
export function createSupabaseClient() {
  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}

// Export a default instance for convenience
export const supabase = createSupabaseClient();

// Export the createClient function for custom configurations
export { createClient };
