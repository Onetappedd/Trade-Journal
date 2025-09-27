#!/usr/bin/env ts-node

import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * E2E Test User Teardown Script
 * Deletes test users created during e2e testing
 */

interface TeardownOptions {
  userId?: string;
  email?: string;
  deleteAll?: boolean;
}

async function teardownE2EUser(options: TeardownOptions = {}): Promise<void> {
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

  try {
    if (options.deleteAll) {
      // Delete all e2e test users (users with @riskr.local email domain)
      console.log('🧹 Cleaning up all E2E test users...');
      
      // First, get all users with @riskr.local emails
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const e2eUsers = users.users.filter(user => 
        user.email?.includes('@riskr.local') || 
        user.email?.includes('e2e_user')
      );

      console.log(`Found ${e2eUsers.length} E2E test users to delete`);

      for (const user of e2eUsers) {
        if (user.id) {
          await deleteUserById(supabase, user.id);
        }
      }

      console.log('✅ All E2E test users cleaned up');

    } else if (options.userId) {
      // Delete specific user by ID
      console.log(`🧹 Cleaning up E2E test user: ${options.userId}`);
      await deleteUserById(supabase, options.userId);
      console.log('✅ E2E test user cleaned up');

    } else if (options.email) {
      // Find and delete user by email
      console.log(`🧹 Cleaning up E2E test user: ${options.email}`);
      
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const user = users.users.find(u => u.email === options.email);
      
      if (!user) {
        console.log('⚠️ User not found, may have been already deleted');
        return;
      }

      await deleteUserById(supabase, user.id);
      console.log('✅ E2E test user cleaned up');

    } else {
      throw new Error('Must provide userId, email, or deleteAll option');
    }

  } catch (error) {
    console.error('❌ Failed to teardown E2E user:', error);
    throw error;
  }
}

async function deleteUserById(supabase: any, userId: string): Promise<void> {
  try {
    // Delete from auth.users (this will cascade to profiles due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error(`Failed to delete user ${userId}:`, deleteError.message);
      // Continue with cleanup even if auth deletion fails
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

// Run the teardown function if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  let options: TeardownOptions = {};
  
  if (args.includes('--all')) {
    options.deleteAll = true;
  } else if (args[0]) {
    // Check if it's a UUID (userId) or email
    if (args[0].includes('@')) {
      options.email = args[0];
    } else {
      options.userId = args[0];
    }
  } else {
    console.error('Usage:');
    console.error('  npm run e2e:teardown -- --all                    # Delete all E2E users');
    console.error('  npm run e2e:teardown -- <userId>                 # Delete by user ID');
    console.error('  npm run e2e:teardown -- <email>                  # Delete by email');
    process.exit(1);
  }

  teardownE2EUser(options)
    .then(() => {
      console.log('\n🎉 Teardown completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Teardown failed:', error.message);
      process.exit(1);
    });
}

export { teardownE2EUser };
