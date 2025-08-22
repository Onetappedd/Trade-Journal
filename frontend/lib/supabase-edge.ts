import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Edge-compatible Supabase client factory
export function createEdgeClient(request: Request) {
  const url = new URL(request.url);
  const cookies = request.headers.get('cookie') || '';

  // Parse cookies manually for Edge Runtime
  const cookieMap = new Map<string, string>();
  if (cookies) {
    cookies.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookieMap.set(name, decodeURIComponent(value));
      }
    });
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieMap.entries()).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          // In Edge Runtime, we can't set cookies directly
          // This would need to be handled by the response
        },
      },
    },
  );
}
