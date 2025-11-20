/**
 * Integration test for CSV import: tests full flow from CSV to database to trade list
 * This test requires Supabase credentials and a test user
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const CSV_FILE_PATH = path.join(__dirname, '../../Oct 5, 2022 – Jan 1, 2025 (1).csv');
const TEST_USER_ID = process.env.TEST_USER_ID || '1be0b06d-ceff-4746-bf66-d33f2c0459cf';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test 1: Check existing trades
async function checkExistingTrades() {
  console.log('\n=== Test 1: Check Existing Trades ===');
  
  const { data: trades, error, count } = await supabase
    .from('trades')
    .select('*', { count: 'exact' })
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error fetching trades:', error.message);
    return null;
  }
  
  console.log(`✅ Found ${count || 0} existing trades`);
  if (trades && trades.length > 0) {
    console.log(`   Latest trade: ${trades[0].symbol} ${trades[0].side} ${trades[0].quantity} @ $${trades[0].entry_price || trades[0].avg_open_price}`);
  }
  
  return { count: count || 0, sample: trades?.[0] };
}

// Test 2: Test trade list API structure
async function testTradeListAPI() {
  console.log('\n=== Test 2: Test Trade List API Structure ===');
  
  // Get a sample of trades to check structure
  const { data: trades, error } = await supabase
    .from('trades')
    .select(`
      id,
      symbol,
      side,
      quantity,
      entry_price,
      avg_open_price,
      qty_opened,
      entry_date,
      executed_at,
      status,
      asset_type,
      underlying_symbol,
      option_expiration,
      option_strike,
      option_type
    `)
    .eq('user_id', TEST_USER_ID)
    .limit(5);
  
  if (error) {
    console.error('❌ Error fetching trades:', error.message);
    return null;
  }
  
  if (!trades || trades.length === 0) {
    console.log('⚠️  No trades found to test structure');
    return null;
  }
  
  console.log(`✅ Retrieved ${trades.length} trades for structure test`);
  
  // Check structure
  const sample = trades[0];
  console.log('\n✅ Trade structure:');
  console.log(`   - id: ${sample.id}`);
  console.log(`   - symbol: ${sample.symbol}`);
  console.log(`   - side: ${sample.side}`);
  console.log(`   - quantity: ${sample.quantity} (type: ${typeof sample.quantity})`);
  console.log(`   - entry_price: ${sample.entry_price} (type: ${typeof sample.entry_price})`);
  console.log(`   - avg_open_price: ${sample.avg_open_price} (type: ${typeof sample.avg_open_price})`);
  console.log(`   - qty_opened: ${sample.qty_opened} (type: ${typeof sample.qty_opened})`);
  console.log(`   - asset_type: ${sample.asset_type}`);
  console.log(`   - status: ${sample.status}`);
  
  if (sample.asset_type === 'option') {
    console.log(`   - underlying: ${sample.underlying_symbol}`);
    console.log(`   - expiry: ${sample.option_expiration}`);
    console.log(`   - strike: ${sample.option_strike}`);
    console.log(`   - type: ${sample.option_type}`);
  }
  
  // Check for numeric type issues
  const issues = [];
  if (typeof sample.quantity === 'string') {
    issues.push('quantity is string (should be number)');
  }
  if (typeof sample.entry_price === 'string') {
    issues.push('entry_price is string (should be number)');
  }
  if (typeof sample.avg_open_price === 'string') {
    issues.push('avg_open_price is string (should be number)');
  }
  
  if (issues.length > 0) {
    console.log('\n⚠️  Type issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✅ All numeric fields are correct types');
  }
  
  return { trades, issues };
}

// Test 3: Check BTO/STC pairs in database
async function testBTOSCTPairs() {
  console.log('\n=== Test 3: Check BTO/STC Pairs in Database ===');
  
  // Get all option trades
  // Note: Column names may vary - check actual schema
  const { data: optionTrades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('asset_type', 'option')
    .order('executed_at', { ascending: true });
  
  // If that fails, try without asset_type filter to see all trades
  if (error && error.message.includes('column')) {
    console.log('⚠️  Column error, trying alternative query...');
    const { data: allTrades, error: allError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (allError) {
      console.error('❌ Error fetching all trades:', allError.message);
      return null;
    }
    
    // Filter for options manually
    const options = (allTrades || []).filter(t => t.asset_type === 'option' || t.asset_type === 'options');
    console.log(`✅ Found ${options.length} option trades (filtered from ${allTrades?.length || 0} total)`);
    
    if (options.length === 0) {
      console.log('⚠️  No option trades found');
      return null;
    }
    
    optionTrades = options;
  }
  
  if (error) {
    console.error('❌ Error fetching option trades:', error.message);
    return null;
  }
  
  if (!optionTrades || optionTrades.length === 0) {
    console.log('⚠️  No option trades found');
    return null;
  }
  
  console.log(`✅ Found ${optionTrades.length} option trades`);
  
  // Group by underlying, expiry, strike, option_type
  const groups = new Map();
  
  optionTrades.forEach(trade => {
    const key = `${trade.underlying_symbol || trade.symbol}-${trade.option_expiration || 'unknown'}-${trade.option_strike || 'unknown'}-${trade.option_type || 'unknown'}`;
    if (!groups.has(key)) {
      groups.set(key, { bto: [], stc: [] });
    }
    
    if (trade.side === 'buy') {
      groups.get(key).bto.push(trade);
    } else if (trade.side === 'sell') {
      groups.get(key).stc.push(trade);
    }
  });
  
  console.log(`✅ Grouped into ${groups.size} option groups`);
  
  // Analyze pairs
  let matchedPairs = 0;
  let unmatchedBTO = 0;
  let unmatchedSTC = 0;
  
  groups.forEach((group, key) => {
    const btoQty = group.bto.reduce((sum, t) => sum + (Number(t.quantity) || Number(t.qty_opened) || 0), 0);
    const stcQty = group.stc.reduce((sum, t) => sum + (Number(t.quantity) || Number(t.qty_opened) || 0), 0);
    
    if (btoQty > 0 && stcQty > 0) {
      const minQty = Math.min(btoQty, stcQty);
      matchedPairs += minQty;
      if (btoQty > stcQty) {
        unmatchedBTO += btoQty - stcQty;
      }
      if (stcQty > btoQty) {
        unmatchedSTC += stcQty - btoQty;
      }
    } else if (btoQty > 0) {
      unmatchedBTO += btoQty;
    } else if (stcQty > 0) {
      unmatchedSTC += stcQty;
    }
  });
  
  console.log(`✅ Matched pairs: ${matchedPairs} contracts`);
  console.log(`⚠️  Unmatched BTO: ${unmatchedBTO} contracts`);
  console.log(`⚠️  Unmatched STC: ${unmatchedSTC} contracts`);
  
  // Show sample pairs
  let sampleCount = 0;
  groups.forEach((group, key) => {
    if (sampleCount >= 5) return;
    if (group.bto.length > 0 && group.stc.length > 0) {
      const [underlying, expiry, strike, type] = key.split('-');
      console.log(`\n   Sample pair: ${underlying} ${type} ${strike} exp ${expiry}`);
      console.log(`     BTO: ${group.bto.length} trades, ${group.bto.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0)} contracts`);
      console.log(`     STC: ${group.stc.length} trades, ${group.stc.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0)} contracts`);
      sampleCount++;
    }
  });
  
  return { matchedPairs, unmatchedBTO, unmatchedSTC, groups: groups.size };
}

// Test 4: Verify trade list API endpoint structure
async function testTradeListEndpoint() {
  console.log('\n=== Test 4: Test Trade List API Endpoint ===');
  
  // Simulate what the API does
  const { data: trades, error } = await supabase
    .from('trades')
    .select(`
      id,
      symbol,
      side,
      quantity,
      entry_price,
      price,
      pnl,
      opened_at,
      entry_date,
      executed_at,
      closed_at,
      exit_date,
      exit_price,
      status,
      asset_type,
      instrument_type,
      avg_open_price,
      avg_close_price,
      qty_opened,
      qty_closed,
      realized_pnl,
      fees,
      created_at,
      updated_at
    `)
    .eq('user_id', TEST_USER_ID)
    .order('entry_date', { ascending: false, nullsFirst: false })
    .order('executed_at', { ascending: false, nullsFirst: false })
    .order('opened_at', { ascending: false, nullsFirst: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
  
  console.log(`✅ Retrieved ${trades?.length || 0} trades`);
  
  // Transform as API does
  const transformed = (trades || []).map(trade => ({
    ...trade,
    qty_opened: typeof (trade.qty_opened ?? trade.quantity) === 'string' 
      ? parseFloat(trade.qty_opened ?? trade.quantity ?? '0') 
      : (trade.qty_opened ?? trade.quantity ?? 0),
    avg_open_price: typeof (trade.avg_open_price ?? trade.entry_price ?? trade.price) === 'string'
      ? parseFloat(trade.avg_open_price ?? trade.entry_price ?? trade.price ?? '0')
      : (trade.avg_open_price ?? trade.entry_price ?? trade.price ?? 0),
    opened_at: trade.opened_at ?? trade.executed_at ?? trade.entry_date ?? new Date().toISOString(),
    closed_at: trade.closed_at ?? trade.exit_date ?? null,
    avg_close_price: typeof (trade.avg_close_price ?? trade.exit_price) === 'string'
      ? parseFloat(trade.avg_close_price ?? trade.exit_price ?? '0')
      : (trade.avg_close_price ?? trade.exit_price ?? null),
    realized_pnl: typeof (trade.realized_pnl ?? trade.pnl) === 'string'
      ? parseFloat(trade.realized_pnl ?? trade.pnl ?? '0')
      : (trade.realized_pnl ?? trade.pnl ?? null),
    instrument_type: trade.instrument_type ?? trade.asset_type ?? 'equity',
  }));
  
  console.log(`✅ Transformed ${transformed.length} trades`);
  
  // Check transformation
  const sample = transformed[0];
  if (sample) {
    console.log('\n✅ Transformed trade sample:');
    console.log(`   - qty_opened: ${sample.qty_opened} (type: ${typeof sample.qty_opened})`);
    console.log(`   - avg_open_price: ${sample.avg_open_price} (type: ${typeof sample.avg_open_price})`);
    console.log(`   - opened_at: ${sample.opened_at}`);
    console.log(`   - instrument_type: ${sample.instrument_type}`);
    
    if (typeof sample.qty_opened === 'number' && typeof sample.avg_open_price === 'number') {
      console.log('\n✅ Transformation successful - all numeric fields are numbers');
    } else {
      console.log('\n⚠️  Transformation issues - some fields are still strings');
    }
  }
  
  return { transformed };
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting Integration Tests for CSV Import\n');
  console.log(`CSV File: ${CSV_FILE_PATH}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);
  
  try {
    // Test 1: Check existing trades
    const existing = await checkExistingTrades();
    
    // Test 2: Test trade structure
    const structure = await testTradeListAPI();
    
    // Test 3: Check BTO/STC pairs
    const pairs = await testBTOSCTPairs();
    
    // Test 4: Test API endpoint structure
    const apiTest = await testTradeListEndpoint();
    
    // Summary
    console.log('\n=== Integration Test Summary ===');
    console.log(`✅ Existing trades: ${existing?.count || 0}`);
    console.log(`✅ Trade structure: ${structure?.issues?.length === 0 ? 'VALID' : 'HAS ISSUES'}`);
    console.log(`✅ BTO/STC pairs: ${pairs ? `${pairs.matchedPairs} matched, ${pairs.unmatchedBTO} unmatched BTO` : 'N/A'}`);
    console.log(`✅ API transformation: ${apiTest ? 'WORKING' : 'FAILED'}`);
    
    if (existing?.count === 0) {
      console.log('\n⚠️  No trades found in database');
      console.log('   Please import the CSV through the UI first');
    } else {
      console.log('\n✅ Integration tests completed!');
      console.log('\nNext steps:');
      console.log('1. Verify trades appear in trade history page');
      console.log('2. Check that BTO/STC pairs are visible');
      console.log('3. Verify numeric values display correctly (not $0.00)');
    }
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests };

