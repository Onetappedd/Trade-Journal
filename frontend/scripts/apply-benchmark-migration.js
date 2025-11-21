#!/usr/bin/env node

/**
 * Script to apply the benchmark_prices migration to the Supabase database
 * This creates the benchmark_prices table for storing SPY/QQQ daily data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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
  console.log('🚀 Applying benchmark_prices migration...');
  
  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250201000001_add_benchmark_prices.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    
    // Execute the migration using raw SQL query
    // Note: This requires the exec_sql function or we can execute directly
    // Try direct execution first
    const statements = migrationSQL.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length === 0) continue;
      
      // Skip comments
      if (trimmed.startsWith('--')) continue;
      
      console.log(`📝 Executing: ${trimmed.substring(0, 50)}...`);
      
      // Use rpc if exec_sql exists, otherwise try direct query
      const { error } = await supabase.rpc('exec_sql', { sql: trimmed + ';' }).catch(async () => {
        // If exec_sql doesn't exist, try using the REST API directly
        // For CREATE TABLE, we need to use the PostgREST API or SQL editor
        console.log('⚠️  exec_sql RPC not available. Please apply migration manually via Supabase SQL Editor.');
        return { error: { message: 'exec_sql RPC not available' } };
      });
      
      if (error) {
        // If exec_sql fails, provide manual instructions
        if (error.message && error.message.includes('exec_sql')) {
          console.log('');
          console.log('⚠️  Automatic migration not available.');
          console.log('📋 Please apply the migration manually:');
          console.log('');
          console.log('1. Go to your Supabase Dashboard');
          console.log('2. Navigate to SQL Editor');
          console.log('3. Copy and paste the contents of:');
          console.log(`   ${migrationPath}`);
          console.log('4. Execute the SQL');
          console.log('');
          process.exit(0);
        } else {
          console.error('❌ Migration failed:', error);
          process.exit(1);
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('🔧 Created benchmark_prices table with:');
    console.log('   - symbol (text)');
    console.log('   - date (date)');
    console.log('   - close (numeric)');
    console.log('   - adjusted_close (numeric)');
    console.log('   - volume (bigint)');
    console.log('   - created_at (timestamptz)');
    console.log('   - Primary key: (symbol, date)');
    console.log('   - RLS enabled with authenticated read policy');
    console.log('');
    console.log('🎯 You can now run the benchmark cron job!');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    console.log('');
    console.log('📋 Please apply the migration manually via Supabase SQL Editor:');
    console.log(`   ${path.join(__dirname, '../supabase/migrations/20250201000001_add_benchmark_prices.sql')}`);
    process.exit(1);
  }
}

// Run the migration
applyMigration();

