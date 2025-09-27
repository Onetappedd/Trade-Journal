import { createSupabaseClient } from '@/lib/supabase/client';
import { randomBytes } from 'crypto';

export interface SeedResult {
  email: string;
  password: string;
  userId: string;
}

/**
 * Simple seed function that doesn't use spawnSync
 * This avoids the ES module loading issues
 */
export async function createTestUser(): Promise<SeedResult> {
  // Read environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Generate unique test user credentials
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  const email = `e2e_user+${timestamp}_${randomSuffix}@riskr.local`;
  const password = 'Test!23456';
  const displayName = `E2E Test User ${timestamp}`;

  console.log(`🌱 Creating E2E test user: ${email}`);

  try {
    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: displayName,
        display_name: displayName
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log(`✅ Created auth user: ${userId}`);

    // Create profile in public.profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, clean up the auth user
      console.error(`❌ Failed to create profile: ${profileError.message}`);
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log(`✅ Created profile: ${profileData.id}`);

    const result: SeedResult = {
      email,
      password,
      userId
    };

    console.log('🎉 E2E test user created successfully!');
    return result;

  } catch (error) {
    console.error('❌ Failed to create E2E user:', error);
    throw error;
  }
}

/**
 * Delete test user
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Delete from auth.users (this will cascade to profiles due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error(`Failed to delete user ${userId}:`, deleteError.message);
    } else {
      console.log(`✅ Deleted auth user: ${userId}`);
    }

    // Also explicitly delete from profiles table (in case cascade didn't work)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.log(`⚠️ Profile cleanup warning for ${userId}:`, profileError.message);
    } else {
      console.log(`✅ Deleted profile: ${userId}`);
    }

  } catch (error) {
    console.error(`❌ Error deleting user ${userId}:`, error);
    throw error;
  }
}
