#!/usr/bin/env node

/**
 * Test script to directly test yahoo-finance2 library
 */

const yahooFinance = require('yahoo-finance2').default;

async function test() {
  try {
    console.log('🔄 Testing yahoo-finance2 directly...');
    
    const symbol = 'SPY';
    const period1 = new Date('2020-01-01');
    const period2 = new Date();
    
    console.log(`Fetching ${symbol} from ${period1.toISOString()} to ${period2.toISOString()}`);
    
    const queryOptions = {
      period1: period1,
      period2: period2,
      interval: '1d',
    };
    
    const historical = await yahooFinance.historical(symbol, queryOptions);
    
    console.log(`\n✅ Received data:`);
    console.log(`   Type: ${typeof historical}`);
    console.log(`   Is Array: ${Array.isArray(historical)}`);
    if (Array.isArray(historical)) {
      console.log(`   Length: ${historical.length}`);
      if (historical.length > 0) {
        console.log(`   First item:`, JSON.stringify(historical[0], null, 2));
        console.log(`   Last item:`, JSON.stringify(historical[historical.length - 1], null, 2));
      }
    } else {
      console.log(`   Value:`, JSON.stringify(historical, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

test();

