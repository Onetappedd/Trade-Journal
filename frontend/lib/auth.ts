// frontend/lib/auth.ts
import { createClient } from '@/lib/supabase-server';

export async function getUserIdFromRequest(): Promise<string | null> {
  try {
    console.log('getUserIdFromRequest - Creating Supabase client');
    const supabase = await createClient();
    
    console.log('getUserIdFromRequest - Getting user');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('getUserIdFromRequest - Auth error:', error);
      return null;
    }
    
    console.log('getUserIdFromRequest - User found:', user?.id ? 'Yes' : 'No');
    return user?.id ?? null;
  } catch (err) {
    console.error('getUserIdFromRequest - Unexpected error:', err);
    return null;
  }
}
