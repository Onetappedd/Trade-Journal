#!/usr/bin/env node

// Database Structure Checker for Supabase
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error(
    'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Supabase Database Structure...\n');

  try {
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);

      // Try alternative method - check specific tables we need
      console.log('\n🔄 Trying alternative method - checking specific tables...\n');

      const requiredTables = ['trades', 'profiles', 'watchlist'];

      for (const tableName of requiredTables) {
        try {
          const { data, error } = await supabase.from(tableName).select('*').limit(1);

          if (error) {
            console.log(`❌ Table '${tableName}' - ${error.message}`);
          } else {
            console.log(`✅ Table '${tableName}' - EXISTS`);

            // Get column info by examining the first row structure
            if (data && data.length > 0) {
              console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
            } else {
              console.log(`   (Table is empty, cannot determine columns)`);
            }
          }
        } catch (err) {
          console.log(`❌ Table '${tableName}' - ${err.message}`);
        }
        console.log('');
      }
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('❌ No tables found in the public schema');
      return;
    }

    console.log('📋 Found Tables:');
    console.log('================');

    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n🔹 Table: ${tableName}`);

      try {
        // Get a sample row to understand the structure
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (sampleError) {
          console.log(`   ❌ Error accessing table: ${sampleError.message}`);
        } else if (sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]);
          console.log(`   ✅ Columns (${columns.length}): ${columns.join(', ')}`);

          // Show sample data types
          const sampleRow = sampleData[0];
          console.log(`   📊 Sample data types:`);
          columns.forEach((col) => {
            const value = sampleRow[col];
            const type = value === null ? 'null' : typeof value;
            console.log(`      ${col}: ${type}`);
          });
        } else {
          console.log(`   📝 Table exists but is empty`);
        }

        // Get row count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          console.log(`   📊 Row count: ${count || 0}`);
        }
      } catch (err) {
        console.log(`   ❌ Error examining table: ${err.message}`);
      }
    }

    // Check for required tables
    console.log('\n\n🎯 Required Tables Check:');
    console.log('==========================');

    const requiredTables = {
      trades: 'User trading data',
      profiles: 'User profile information',
      watchlist: 'User watchlist (optional)',
    };

    const existingTableNames = tables.map((t) => t.table_name);

    for (const [tableName, description] of Object.entries(requiredTables)) {
      if (existingTableNames.includes(tableName)) {
        console.log(`✅ ${tableName} - ${description}`);
      } else {
        console.log(`❌ ${tableName} - ${description} (MISSING)`);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Test API connection
async function testApiKeys() {
  console.log('\n🔑 Testing API Keys...');
  console.log('======================');

  const finnhubKey = process.env.FINNHUB_API_KEY;
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!finnhubKey) {
    console.log('❌ FINNHUB_API_KEY not found in environment');
  } else {
    console.log('✅ FINNHUB_API_KEY found');

    // Test Finnhub API
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${finnhubKey}`,
      );
      const data = await response.json();

      if (data.c && data.c > 0) {
        console.log(`✅ Finnhub API working - AAPL price: $${data.c}`);
      } else {
        console.log('❌ Finnhub API test failed:', data);
      }
    } catch (err) {
      console.log('❌ Finnhub API error:', err.message);
    }
  }

  if (!alphaVantageKey) {
    console.log('❌ ALPHA_VANTAGE_API_KEY not found in environment');
  } else {
    console.log('✅ ALPHA_VANTAGE_API_KEY found');

    // Test Alpha Vantage API
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${alphaVantageKey}`,
      );
      const data = await response.json();

      if (data['Global Quote'] && data['Global Quote']['05. price']) {
        console.log(
          `✅ Alpha Vantage API working - AAPL price: $${data['Global Quote']['05. price']}`,
        );
      } else {
        console.log('❌ Alpha Vantage API test failed:', data);
      }
    } catch (err) {
      console.log('❌ Alpha Vantage API error:', err.message);
    }
  }
}

async function main() {
  await checkDatabaseStructure();
  await testApiKeys();

  console.log('\n🎉 Database structure check complete!');
  console.log('\nNext steps:');
  console.log("1. If any required tables are missing, I'll create the SQL for you");
  console.log("2. If tables exist but have different columns, I'll provide migration scripts");
  console.log('3. Test the real data integration with your actual database structure');
}

main().catch(console.error);
