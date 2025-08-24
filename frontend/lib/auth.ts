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
    
    if (!user) {
      console.log('getUserIdFromRequest - No user found in session');
      return null;
    }
    
    console.log('getUserIdFromRequest - User found with ID:', user.id);
    return user.id;
  } catch (err) {
    console.error('getUserIdFromRequest - Unexpected error:', err);
    if (err instanceof Error) {
      console.error('getUserIdFromRequest - Error message:', err.message);
      console.error('getUserIdFromRequest - Error stack:', err.stack);
    }
    return null;
  }
}
