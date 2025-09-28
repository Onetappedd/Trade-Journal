import { createSupabaseWithToken } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export async function getUserOrThrow(request: NextRequest): Promise<User> {
  try {
    const supabase = await createSupabaseWithToken(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Unauthorized');
    }
    
    return user;
  } catch (error) {
    throw new Error('Failed to authenticate user');
  }
}

export async function getUserOrRedirect(request: NextRequest): Promise<User> {
  try {
    return await getUserOrThrow(request);
  } catch (error) {
    // In a real implementation, this would redirect to login
    throw new Error('Authentication required');
  }
}
