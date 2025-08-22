#!/usr/bin/env node

// Test the real data integration
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const finnhubKey = process.env.FINNHUB_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealDataIntegration() {
  console.log('🚀 Testing Real Data Integration...\n');

  // Test 1: Market Data APIs
  console.log('📈 Testing Market Data APIs:');
  console.log('=============================');

  try {
    // Test trending stocks endpoint
    const trendingResponse = await fetch('http://localhost:3000/api/market/trending');
    if (trendingResponse.ok) {
      const trending = await trendingResponse.json();
      console.log(`��� Trending stocks API: ${trending.length} stocks loaded`);
      console.log(`   Sample: ${trending[0]?.symbol} - $${trending[0]?.price}`);
    } else {
      console.log('❌ Trending stocks API not responding (app may not be running)');
    }
  } catch (err) {
    console.log('❌ Market data API test failed - make sure your Next.js app is running');
    console.log('   Run: npm run dev');
  }

  // Test 2: Direct API calls
  console.log('\n🔗 Testing Direct API Calls:');
  console.log('==============================');

  try {
    // Test Finnhub directly
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${finnhubKey}`);
    const data = await response.json();

    if (data.c) {
      console.log(`✅ Direct Finnhub API: AAPL = $${data.c}`);
      console.log(`   Change: ${data.d > 0 ? '+' : ''}${data.d} (${data.dp}%)`);
    }
  } catch (err) {
    console.log('❌ Direct API call failed:', err.message);
  }

  // Test 3: Database Structure Verification
  console.log('\n🗄️  Testing Database Structure:');
  console.log('================================');

  try {
    // Check trades table structure
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(0); // Just get structure, no data

    if (tradesError) {
      console.log('❌ Trades table error:', tradesError.message);
    } else {
      console.log('✅ Trades table accessible');
    }

    // Check profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);

    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
    }

    // Check watchlist table
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlist')
      .select('*')
      .limit(0);

    if (watchlistError) {
      console.log('❌ Watchlist table error:', watchlistError.message);
    } else {
      console.log('✅ Watchlist table accessible');
    }
  } catch (err) {
    console.log('❌ Database test error:', err.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('===============');
  console.log('1. Start your Next.js app: npm run dev');
  console.log('2. Visit: http://localhost:3000/dashboard/trending-tickers');
  console.log('3. You should see REAL market data instead of mock data!');
  console.log('4. Sign up/login to test user-specific features');
  console.log('5. Add some trades to see real portfolio calculations');
}

testRealDataIntegration().catch(console.error);
