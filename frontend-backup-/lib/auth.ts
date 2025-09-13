import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getUserIdFromRequest(_req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}
