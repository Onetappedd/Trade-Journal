#!/usr/bin/env node

/**
 * Test script for idempotency migration
 * This script applies the migration and tests the functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting idempotency migration test...');
  
  try {
    // 1. Read and apply the migration
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250128000001_add_idempotency_and_meta_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Applying migration...');
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      return false;
    }
    
    console.log('✅ Migration applied successfully');
    
    // 2. Test the schema changes
    console.log('🔍 Testing schema changes...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'trades')
      .eq('table_schema', 'public')
      .in('column_name', ['idempotency_key', 'symbol_raw', 'meta', 'broker', 'external_id', 'asset_type', 'fees', 'commission', 'executed_at']);
    
    if (columnsError) {
      console.error('❌ Failed to check columns:', columnsError);
      return false;
    }
    
    console.log('✅ New columns found:', columns.map(c => c.column_name).join(', '));
    
    // 3. Test the idempotency key generation function
    console.log('🔑 Testing idempotency key generation...');
    const { data: keyResult, error: keyError } = await supabase
      .rpc('generate_idempotency_key', {
        p_broker: 'webull',
        p_external_id: 'test123',
        p_symbol_raw: 'AAPL',
        p_executed_at: '2025-01-28T10:00:00Z',
        p_side: 'buy',
        p_price: 150.50,
        p_quantity: 100
      });
    
    if (keyError) {
      console.error('❌ Failed to generate idempotency key:', keyError);
      return false;
    }
    
    console.log('✅ Idempotency key generated:', keyResult);
    
    // 4. Test inserting a trade with idempotency
    console.log('📊 Testing trade insertion with idempotency...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    const { data: insertResult, error: insertError } = await supabase
      .from('trades')
      .insert({
        user_id: testUserId,
        symbol: 'AAPL',
        symbol_raw: 'AAPL',
        side: 'buy',
        quantity: 100,
        entry_price: 150.50,
        entry_date: '2025-01-28',
        broker: 'webull',
        external_id: 'test123',
        asset_type: 'equity',
        fees: 1.00,
        commission: 0.00,
        executed_at: '2025-01-28T10:00:00Z',
        meta: { rowIndex: 1, source: 'webull-csv' }
      })
      .select();
    
    if (insertError) {
      console.error('❌ Failed to insert trade:', insertError);
      return false;
    }
    
    console.log('✅ Trade inserted successfully');
    
    // 5. Test that idempotency_key was generated
    const { data: tradeData, error: tradeError } = await supabase
      .from('trades')
      .select('id, symbol, idempotency_key, broker, external_id')
      .eq('user_id', testUserId)
      .eq('symbol', 'AAPL')
      .single();
    
    if (tradeError) {
      console.error('❌ Failed to fetch trade:', tradeError);
      return false;
    }
    
    console.log('✅ Trade found with idempotency_key:', tradeData.idempotency_key);
    
    // 6. Test duplicate prevention
    console.log('🔄 Testing duplicate prevention...');
    const { data: duplicateResult, error: duplicateError } = await supabase
      .from('trades')
      .insert({
        user_id: testUserId,
        symbol: 'AAPL',
        symbol_raw: 'AAPL',
        side: 'buy',
        quantity: 100,
        entry_price: 150.50,
        entry_date: '2025-01-28',
        broker: 'webull',
        external_id: 'test123', // Same external_id
        asset_type: 'equity',
        fees: 1.00,
        commission: 0.00,
        executed_at: '2025-01-28T10:00:00Z',
        meta: { rowIndex: 1, source: 'webull-csv' }
      });
    
    if (duplicateError) {
      console.log('✅ Duplicate prevention working:', duplicateError.message);
    } else {
      console.log('❌ Duplicate was not prevented!');
      return false;
    }
    
    // 7. Test the trades_with_meta view
    console.log('👁️ Testing trades_with_meta view...');
    const { data: viewData, error: viewError } = await supabase
      .from('trades_with_meta')
      .select('id, symbol, symbol_raw, broker, row_index, import_source')
      .eq('user_id', testUserId)
      .eq('symbol', 'AAPL')
      .single();
    
    if (viewError) {
      console.error('❌ Failed to query view:', viewError);
      return false;
    }
    
    console.log('✅ View working correctly:', viewData);
    
    // 8. Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', testUserId);
    
    if (deleteError) {
      console.error('❌ Failed to clean up:', deleteError);
      return false;
    }
    
    console.log('✅ Test data cleaned up');
    
    console.log('🎉 All tests passed! Idempotency migration is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
runMigration().then(success => {
  process.exit(success ? 0 : 1);
});
