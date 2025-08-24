// frontend/lib/auth.ts
import { createClient } from '@/lib/supabase-server';

export async function getUserIdFromRequest(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user?.id ?? null;
}
