import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// For use in client components
export const supabase = createSupabaseClient();

// Legacy export for backward compatibility
export const createClient = createSupabaseClient;