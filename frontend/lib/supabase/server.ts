import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export function getServerSupabase() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerSupabase can only be used on the server side');
  }
  
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// Alternative function for use in API routes
export async function createSupabaseWithToken(request: NextRequest) {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseWithToken can only be used on the server side');
  }
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No authorization token provided');
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {}
      }
    }
  );
  
  // Set the session using the token
  const { data: { session }, error } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: '', // Not needed for API routes
  });
  
  if (error) {
    console.error('[Supabase] Error setting session:', error);
  }
  
  return supabase;
}

// Admin client for privileged operations
export function createSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseAdmin can only be used on the server side');
  }
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      cookies: {
        getAll() { return []; },
        setAll() {}
      }
    }
  );
}