export const runtime = 'nodejs'
import { cookies, headers } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Public envs are OK to use here; server routes should still use Node runtime.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Canonical helper
export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
    headers: {
      'x-forwarded-host': headers().get('host') ?? ''
    },
  });
}

// Backward-compat: allow imports that expect createClient or createServerClient
export const createClient = createSupabaseServer; // some files used this name
export { createServerClient }; // direct re-export for callers
