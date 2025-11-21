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
export async function createSupabaseWithToken(request: NextRequest) {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseWithToken can only be used on the server side');
  }
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No authorization token provided');
  }
  
  // Use the standard Supabase JS client with the token in headers
  // This allows RLS to work by passing the JWT in the Authorization header
  const supabase = createClient(
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
  
  // Validate the token by getting the user
  // This ensures the token is valid and sets up the auth context for RLS
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    console.error('[Supabase] Auth validation error:', authError);
    // Don't throw here - let individual routes handle auth errors
    // But the client will still have the token in headers for RLS
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