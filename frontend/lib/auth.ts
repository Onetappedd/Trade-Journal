import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getUserIdFromRequest(_req: Request) {
  const supabase = createServerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}
