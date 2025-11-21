/**
 * Test script to check for gaps in benchmark data from October 2024 to today
 * Run with: node scripts/test-benchmark-gap.js
 */

const YahooFinance = require('yahoo-finance2').default;

async function testBenchmarkGap() {
  console.log('🔄 Testing Yahoo Finance API for data from October 2024 to today...\n');

  const symbols = ['SPY', 'QQQ'];
  const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

  for (const symbol of symbols) {
    try {
      console.log(`\n📊 Testing ${symbol}...`);
      
      // Test: Fetch from October 1, 2024 to today
      const october2024 = new Date('2024-10-01');
      const now = new Date();
      
      console.log(`  Fetching from ${october2024.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}...`);
      
      const historical = await yahooFinance.historical(symbol, {
        period1: october2024,
        period2: now,
        interval: '1d',
      });

      if (!historical || !Array.isArray(historical) || historical.length === 0) {
        console.log(`  ❌ No data returned for ${symbol}`);
        continue;
      }

      // Sort by date
      const sorted = historical.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      const firstDate = first.date instanceof Date ? first.date : new Date(first.date);
      const lastDate = last.date instanceof Date ? last.date : new Date(last.date);

      console.log(`  ✅ Received ${historical.length} data points`);
      console.log(`  📅 First date: ${firstDate.toISOString().split('T')[0]}`);
      console.log(`  📅 Last date: ${lastDate.toISOString().split('T')[0]}`);

      // Check for gaps
      const dates = sorted.map(q => {
        const d = q.date instanceof Date ? q.date : new Date(q.date);
        return d.toISOString().split('T')[0];
      });

      // Find the last date in October 2024
      const octoberDates = dates.filter(d => d.startsWith('2024-10'));
      const lastOctoberDate = octoberDates.length > 0 
        ? octoberDates[octoberDates.length - 1] 
        : null;

      console.log(`  📅 Last October 2024 date: ${lastOctoberDate || 'None found'}`);

      // Check what dates we have after October 2024
      const afterOctober = dates.filter(d => d > '2024-10-31');
      console.log(`  📅 Dates after October 2024: ${afterOctober.length}`);
      
      if (afterOctober.length > 0) {
        console.log(`  📅 First date after October: ${afterOctober[0]}`);
        console.log(`  📅 Last date after October: ${afterOctober[afterOctober.length - 1]}`);
      } else {
        console.log(`  ❌ NO DATA AFTER OCTOBER 2024!`);
      }

      // Show sample of recent dates
      console.log(`  \n  Recent dates (last 10):`);
      const recentDates = dates.slice(-10);
      recentDates.forEach(d => console.log(`    - ${d}`));

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
testBenchmarkGap().catch(console.error);

