/**
 * Test script to check the most recent benchmark data available from Yahoo Finance
 * Run with: node scripts/test-benchmark-dates.js
 */

const YahooFinance = require('yahoo-finance2').default;

async function testBenchmarkDates() {
  console.log('🔄 Testing Yahoo Finance API for most recent benchmark data...\n');

  const symbols = ['SPY', 'QQQ'];
  const yahooFinance = new YahooFinance();

  for (const symbol of symbols) {
    try {
      console.log(`\n📊 Testing ${symbol}...`);
      
      // Test 1: Fetch last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      console.log(`  Fetching from ${thirtyDaysAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}...`);
      
      const historical = await yahooFinance.historical(symbol, {
        period1: thirtyDaysAgo,
        period2: now,
        interval: '1d',
      });

      if (!historical || !Array.isArray(historical) || historical.length === 0) {
        console.log(`  ❌ No data returned for ${symbol}`);
        continue;
      }

      // Sort by date to get the most recent
      const sorted = historical.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      const mostRecent = sorted[0];
      const oldest = sorted[sorted.length - 1];
      
      const mostRecentDate = mostRecent.date instanceof Date 
        ? mostRecent.date 
        : new Date(mostRecent.date);
      const oldestDate = oldest.date instanceof Date 
        ? oldest.date 
        : new Date(oldest.date);

      console.log(`  ✅ Received ${historical.length} data points`);
      console.log(`  📅 Most recent date: ${mostRecentDate.toISOString().split('T')[0]}`);
      console.log(`  📅 Oldest date in range: ${oldestDate.toISOString().split('T')[0]}`);
      console.log(`  💰 Most recent close: $${mostRecent.close?.toFixed(2) || 'N/A'}`);
      console.log(`  💰 Most recent adjusted close: $${mostRecent.adjClose || mostRecent.adjustedClose || mostRecent.close || 'N/A'}`);

      // Check if the most recent date is today or a recent trading day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        console.log(`  ✅ Data is up to date (today)`);
      } else if (daysDiff === 1) {
        console.log(`  ⚠️  Data is 1 day behind (yesterday)`);
      } else if (daysDiff <= 5) {
        console.log(`  ⚠️  Data is ${daysDiff} days behind`);
      } else {
        console.log(`  ❌ Data is ${daysDiff} days behind - may be stale!`);
      }

      // Test 2: Try fetching just today
      console.log(`  \n  Testing fetch for today only...`);
      try {
        const todayData = await yahooFinance.historical(symbol, {
          period1: today,
          period2: now,
          interval: '1d',
        });
        
        if (todayData && Array.isArray(todayData) && todayData.length > 0) {
          console.log(`  ✅ Today's data is available`);
        } else {
          console.log(`  ⚠️  Today's data not yet available (may be before market close)`);
        }
      } catch (todayError) {
        console.log(`  ⚠️  Could not fetch today's data: ${todayError.message}`);
      }

    } catch (error) {
      console.error(`  ❌ Error testing ${symbol}:`, error.message);
      if (error.stack) {
        console.error(`  Stack:`, error.stack);
      }
    }
  }

  console.log('\n✅ Test complete!');
}

// Run the test
testBenchmarkDates().catch(console.error);

