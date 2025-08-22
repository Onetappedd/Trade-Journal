#!/usr/bin/env node

// Test Polygon.io API integration
require('dotenv').config({ path: '.env.local' });

const polygonApiKey = process.env.POLYGON_API_KEY;

async function testPolygonAPI() {
  console.log('🔍 Testing Polygon.io API Integration...\n');

  if (!polygonApiKey) {
    console.log('❌ POLYGON_API_KEY not found in environment');
    return;
  }

  console.log('✅ POLYGON_API_KEY found');
  console.log(
    `   Key: ${polygonApiKey.substring(0, 8)}...${polygonApiKey.substring(polygonApiKey.length - 4)}`,
  );

  // Test 1: Market Movers (Gainers)
  console.log('\n📈 Testing Market Movers (Gainers):');
  console.log('====================================');

  try {
    const response = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apikey=${polygonApiKey}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      console.log(`✅ Found ${data.results.length} gainers`);
      const topGainer = data.results[0];
      console.log(
        `   Top Gainer: ${topGainer.ticker} - $${topGainer.value} (${topGainer.change_percentage?.toFixed(2)}%)`,
      );
    } else {
      console.log('❌ No gainers data received:', data);
    }
  } catch (err) {
    console.log('❌ Gainers API error:', err.message);
  }

  // Test 2: Ticker Snapshot (AAPL)
  console.log('\n🍎 Testing Ticker Snapshot (AAPL):');
  console.log('===================================');

  try {
    const response = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/AAPL?apikey=${polygonApiKey}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const aapl = data.results[0];
      console.log(`✅ AAPL Snapshot:`);
      console.log(`   Price: $${aapl.value || aapl.day?.c}`);
      console.log(
        `   Change: ${aapl.todaysChange?.toFixed(2)} (${aapl.todaysChangePerc?.toFixed(2)}%)`,
      );
      console.log(`   Volume: ${((aapl.day?.v || 0) / 1000000).toFixed(1)}M`);
      console.log(`   Market Status: ${aapl.market_status}`);
    } else {
      console.log('❌ No AAPL data received:', data);
    }
  } catch (err) {
    console.log('❌ AAPL snapshot error:', err.message);
  }

  // Test 3: Historical Data (NVDA - last 5 days)
  console.log('\n💎 Testing Historical Data (NVDA):');
  console.log('===================================');

  try {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/NVDA/range/1/day/${from}/${to}?adjusted=true&sort=asc&apikey=${polygonApiKey}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      console.log(`✅ NVDA Historical Data (${data.results.length} days):`);
      const latest = data.results[data.results.length - 1];
      console.log(`   Latest Close: $${latest.c}`);
      console.log(`   High: $${latest.h}`);
      console.log(`   Low: $${latest.l}`);
      console.log(`   Volume: ${(latest.v / 1000000).toFixed(1)}M`);
    } else {
      console.log('❌ No NVDA historical data received:', data);
    }
  } catch (err) {
    console.log('❌ NVDA historical data error:', err.message);
  }

  // Test 4: Search Tickers
  console.log('\n🔍 Testing Ticker Search (Tesla):');
  console.log('==================================');

  try {
    const response = await fetch(
      `https://api.polygon.io/v3/reference/tickers?search=Tesla&active=true&limit=5&apikey=${polygonApiKey}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      console.log(`✅ Found ${data.results.length} Tesla-related tickers:`);
      data.results.forEach((ticker) => {
        console.log(`   ${ticker.ticker}: ${ticker.name}`);
      });
    } else {
      console.log('❌ No Tesla search results:', data);
    }
  } catch (err) {
    console.log('❌ Tesla search error:', err.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('===============');
  console.log('1. Start your Next.js app: npm run dev');
  console.log('2. Visit: http://localhost:3000/dashboard/trending-tickers');
  console.log('3. You should see REAL Polygon.io data with current prices!');
  console.log('4. Click on any ticker to see detailed snapshot modal');
  console.log('5. Use the search tab to look up any stock');
}

testPolygonAPI().catch(console.error);
