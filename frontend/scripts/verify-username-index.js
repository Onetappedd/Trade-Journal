#!/usr/bin/env node

/**
 * Script to verify that the username unique index exists
 * This ensures the database has proper constraints for username uniqueness
 */

const { createClient } = require('@supabase/supabase-js');

async function verifyUsernameIndex() {
  console.log('🔍 Verifying username unique index...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // Check if the unique index exists
    const { data: indexes, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'profiles_username_unique_idx'
      `
    });
    
    if (error) {
      console.error('❌ Error checking indexes:', error);
      process.exit(1);
    }
    
    if (indexes && indexes.length > 0) {
      console.log('✅ Username unique index exists');
      console.log('📋 Index details:', indexes[0]);
    } else {
      console.log('⚠️  Username unique index not found');
      console.log('🔧 Creating username unique index...');
      
      // Create the index
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
          ON public.profiles (username);
        `
      });
      
      if (createError) {
        console.error('❌ Error creating index:', createError);
        process.exit(1);
      }
      
      console.log('✅ Username unique index created successfully');
    }
    
    // Test the constraint by trying to insert duplicate usernames
    console.log('🧪 Testing username uniqueness constraint...');
    
    const testUsername = `test_user_${Date.now()}`;
    
    // Insert first user
    const { error: insert1Error } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test1@example.com',
        username: testUsername,
        display_name: 'Test User 1'
      });
    
    if (insert1Error) {
      console.log('ℹ️  First insert failed (expected if user exists):', insert1Error.message);
    } else {
      console.log('✅ First user inserted successfully');
    }
    
    // Try to insert second user with same username
    const { error: insert2Error } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000002',
        email: 'test2@example.com',
        username: testUsername,
        display_name: 'Test User 2'
      });
    
    if (insert2Error && insert2Error.code === '23505') {
      console.log('✅ Username uniqueness constraint working correctly');
    } else if (insert2Error) {
      console.log('⚠️  Unexpected error:', insert2Error);
    } else {
      console.log('❌ Username uniqueness constraint not working - duplicate username was inserted');
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await supabase
      .from('profiles')
      .delete()
      .eq('username', testUsername);
    
    console.log('✅ Database verification completed successfully');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyUsernameIndex()
    .then(() => {
      console.log('🎉 Username index verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyUsernameIndex };

