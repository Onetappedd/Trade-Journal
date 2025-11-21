import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
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
export function createSupabaseWithToken(request: NextRequest) {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseWithToken can only be used on the server side');
  }
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No authorization token provided');
  }
  
  // Use the standard Supabase JS client with the token in the auth header
  // This properly authenticates the client for RLS
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
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