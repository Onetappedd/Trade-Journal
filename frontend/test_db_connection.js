// Test script to verify Supabase database connection
// Run with: node test_db_connection.js

const { createClient } = require('@supabase/supabase-js');

// Use the environment variables from the setup
const supabaseUrl = 'https://lobigrwmngwirucuklmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjAzODgsImV4cCI6MjA2OTQ5NjM4OH0.FZvlw06ILW7TutkrakBLdEIEkuf5f69nGxXaycaMGQQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase database connection...');
  
  try {
    // Test connection by querying a system table
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📋 Available tables:', data.map(row => row.table_name));
    
    // Check if our tables exist
    const requiredTables = ['trades', 'import_runs', 'profiles'];
    const existingTables = data.map(row => row.table_name);
    
    console.log('\n🔍 Checking required tables...');
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ ${table} table exists`);
      } else {
        console.log(`❌ ${table} table missing`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database connection test completed successfully!');
    console.log('💡 If tables are missing, run the setup_database.sql script in Supabase SQL Editor');
  } else {
    console.log('\n💥 Database connection test failed!');
    console.log('💡 Check your Supabase project settings and environment variables');
  }
});
