#!/usr/bin/env node

/**
 * Script to apply the idempotency migration to the Supabase database
 * This adds the required columns to the trades table for Webull imports
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please set these in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying idempotency migration to trades table...');
  
  try {
    // Read the migration SQL
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250128000001_add_idempotency_and_meta_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('🔧 Added columns to trades table:');
    console.log('   - idempotency_key (text)');
    console.log('   - symbol_raw (text)');
    console.log('   - meta (jsonb)');
    console.log('   - broker (text)');
    console.log('   - external_id (text)');
    console.log('   - asset_type (text)');
    console.log('   - fees (numeric)');
    console.log('   - commission (numeric)');
    console.log('   - executed_at (timestamptz)');
    console.log('');
    console.log('🎯 You can now try the Webull import again!');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
