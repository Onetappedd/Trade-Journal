#!/usr/bin/env ts-node

import { createSupabaseClient } from '@/lib/supabase/client';
import { randomBytes } from 'crypto';

/**
 * E2E Test User Seed Script
 * Creates a test user for end-to-end testing
 */

interface SeedResult {
  email: string;
  password: string;
  userId: string;
}

async function seedE2EUser(): Promise<SeedResult> {
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

  console.log(`🌱 Seeding E2E test user: ${email}`);

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
        email: email,
        display_name: displayName,
        timezone: 'America/New_York',
        default_broker: 'webull',
        default_asset_type: 'stock',
        risk_tolerance: 'moderate',
        email_notifications: true,
        push_notifications: false,
        trade_alerts: true,
        weekly_reports: true
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
    
    // Write result to stdout for tests to read
    console.log('SEED_RESULT_START');
    console.log(JSON.stringify(result));
    console.log('SEED_RESULT_END');

    return result;

  } catch (error) {
    console.error('❌ Failed to seed E2E user:', error);
    throw error;
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedE2EUser()
    .then((result) => {
      console.log('\n📤 Seed result (copy this for your tests):');
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed failed:', error.message);
      process.exit(1);
    });
}

export { seedE2EUser };
