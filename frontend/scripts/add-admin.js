#!/usr/bin/env node

/**
 * Script to add the first admin user
 * Usage: node scripts/add-admin.js <email>
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAdminUser(email) {
  try {
    console.log(`Adding admin user: ${email}`);
    
    // Call the add_admin_user function
    const { error } = await supabase.rpc('add_admin_user', {
      admin_email: email.toLowerCase()
    });
    
    if (error) {
      console.error('Error adding admin user:', error);
      process.exit(1);
    }
    
    console.log(`✅ Successfully added ${email} as admin user`);
    
    // Verify the user was added
    const { data: adminUsers, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase());
    
    if (fetchError) {
      console.error('Error fetching admin users:', fetchError);
    } else {
      console.log('Admin users in database:');
      adminUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Added: ${new Date(user.created_at).toLocaleDateString()}`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/add-admin.js <email>');
  console.error('Example: node scripts/add-admin.js admin@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Invalid email format');
  process.exit(1);
}

// Run the script
addAdminUser(email);
