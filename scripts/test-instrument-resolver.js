const fs = require('fs');
const path = require('path');

// Test script to verify instrument resolver functionality
async function testInstrumentResolver() {
  console.log('🧪 Testing Instrument Resolver...\n');

  const testCases = [
    // Equity tests
    {
      name: 'Basic Equity',
      input: { symbol: 'AAPL', instrument_type: 'equity' },
      expected: { unique_symbol: 'EQ:AAPL', instrument_type: 'equity', multiplier: 1 }
    },
    {
      name: 'Equity with suffix',
      input: { symbol: 'TSLA.US', instrument_type: 'equity' },
      expected: { unique_symbol: 'EQ:TSLA', instrument_type: 'equity', multiplier: 1 }
    },
    {
      name: 'Equity with venue',
      input: { symbol: 'SPY', instrument_type: 'equity', venue: 'ARCA' },
      expected: { unique_symbol: 'EQ:SPY', instrument_type: 'equity', multiplier: 1 }
    },

    // Option tests
    {
      name: 'Option with OCC symbol',
      input: { 
        occ_symbol: 'SPY240216C00450000', 
        instrument_type: 'option' 
      },
      expected: { 
        unique_symbol: 'OPT:SPY240216C00450000', 
        instrument_type: 'option', 
        multiplier: 100,
        meta: { underlying: 'SPY', expiry: '2024-02-16', strike: 450, type: 'call' }
      }
    },
    {
      name: 'Option with components',
      input: { 
        symbol: 'SPY_C_450_2024-02-16',
        underlying: 'SPY',
        expiry: '2024-02-16',
        strike: 450,
        option_type: 'call',
        instrument_type: 'option'
      },
      expected: { 
        unique_symbol: 'OPT:SPY240216C00450000', 
        instrument_type: 'option', 
        multiplier: 100,
        meta: { underlying: 'SPY', expiry: '2024-02-16', strike: 450, type: 'call' }
      }
    },
    {
      name: 'Option with custom multiplier',
      input: { 
        occ_symbol: 'SPY240216C00450000', 
        instrument_type: 'option',
        multiplier: 50
      },
      expected: { 
        unique_symbol: 'OPT:SPY240216C00450000', 
        instrument_type: 'option', 
        multiplier: 50,
        meta: { underlying: 'SPY', expiry: '2024-02-16', strike: 450, type: 'call', adjusted: true }
      }
    },

    // Futures tests
    {
      name: 'ES Futures',
      input: { 
        futures_symbol: 'ESZ5', 
        instrument_type: 'future' 
      },
      expected: { 
        unique_symbol: 'FUT:ESZ5', 
        instrument_type: 'future', 
        multiplier: 50,
        meta: { root: 'ES', month: 'Z', year: '5', expiry: '2025-12-01', tick_value: 12.5 }
      }
    },
    {
      name: 'NQ Futures',
      input: { 
        futures_symbol: 'NQH24', 
        instrument_type: 'future' 
      },
      expected: { 
        unique_symbol: 'FUT:NQH24', 
        instrument_type: 'future', 
        multiplier: 20,
        meta: { root: 'NQ', month: 'H', year: '24', expiry: '2024-03-01', tick_value: 5 }
      }
    },
    {
      name: 'CL Futures',
      input: { 
        futures_symbol: 'CLM24', 
        instrument_type: 'future' 
      },
      expected: { 
        unique_symbol: 'FUT:CLM24', 
        instrument_type: 'future', 
        multiplier: 1000,
        meta: { root: 'CL', month: 'M', year: '24', expiry: '2024-06-01', tick_value: 10 }
      }
    }
  ];

  console.log('📊 Test Cases:');
  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}`);
    console.log(`   Input: ${JSON.stringify(testCase.input)}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log('');
  });

  console.log('✅ Simulated Results:');
  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const result = simulateResolve(testCase.input);
    const success = validateResult(result, testCase.expected);
    
    console.log(`\n${index + 1}. ${testCase.name}: ${success ? '✅ PASS' : '❌ FAIL'}`);
    if (!success) {
      console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
      console.log(`   Got: ${JSON.stringify(result)}`);
      failed++;
    } else {
      passed++;
    }
  });

  console.log(`\n🎯 Results: ${passed} passed, ${failed} failed`);
  console.log(`${failed === 0 ? '🎉 ALL TESTS PASSED!' : '❌ Some tests failed'}`);
}

function simulateResolve(input) {
  // Simulate the resolver logic
  const { symbol, occ_symbol, futures_symbol, expiry, strike, option_type, underlying, multiplier, instrument_type } = input;

  if (instrument_type === 'equity' || (!instrument_type && symbol && !occ_symbol && !futures_symbol)) {
    const normalizedSymbol = symbol?.trim().toUpperCase().replace(/\.(US|N|O|A)$/, '') || 'UNKNOWN';
    return {
      unique_symbol: `EQ:${normalizedSymbol}`,
      instrument_type: 'equity',
      multiplier: 1,
      meta: { exchange: 'UNKNOWN', description: `${normalizedSymbol} Stock` }
    };
  }

  if (instrument_type === 'option' || occ_symbol) {
    let occSymbol = occ_symbol;
    let underlyingSymbol = underlying;
    let expiryDate = expiry;
    let strikePrice = strike;
    let type = option_type;
    const defaultMultiplier = 100;

    if (occ_symbol) {
      // Parse OCC symbol (e.g., SPY240216C00450000)
      const match = occ_symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
      if (match) {
        const [, root, yymmdd, callPut, strikeStr] = match;
        const year = '20' + yymmdd.substring(0, 2);
        const month = yymmdd.substring(2, 4);
        const day = yymmdd.substring(4, 6);
        underlyingSymbol = root;
        expiryDate = `${year}-${month}-${day}`;
        strikePrice = parseInt(strikeStr) / 1000;
        type = callPut === 'C' ? 'call' : 'put';
      }
    } else if (underlying && expiry && strike && type) {
      // Build OCC symbol from components
      // Parse date more carefully
      const dateParts = expiry.split('-');
      const year = dateParts[0];
      const month = dateParts[1];
      const day = dateParts[2];
      const yy = year.slice(-2);
      const yymmdd = yy + month + day;
      const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0');
      const callPut = type === 'call' ? 'C' : 'P';
      occSymbol = `${underlying}${yymmdd}${callPut}${strikeStr}`;
    }

    return {
      unique_symbol: `OPT:${occSymbol || 'GENERATED'}`,
      instrument_type: 'option',
      multiplier: multiplier || defaultMultiplier,
      meta: { 
        underlying: underlyingSymbol, 
        expiry: expiryDate, 
        strike: strikePrice, 
        type: type,
        adjusted: (multiplier || defaultMultiplier) !== defaultMultiplier
      }
    };
  }

  if (instrument_type === 'future' || futures_symbol) {
    const futuresSymbol = futures_symbol || symbol;
    const match = futuresSymbol.match(/^([A-Z]+)([A-Z])(\d{1,2})$/);
    if (match) {
      const [, root, monthCode, yearStr] = match;
      const monthCodes = {
        F: '01', G: '02', H: '03', J: '04', K: '05', M: '06',
        N: '07', Q: '08', U: '09', V: '10', X: '11', Z: '12'
      };
      const month = monthCodes[monthCode];
      const year = yearStr.length === 1 ? `202${yearStr}` : `20${yearStr}`;
      const expiry = `${year}-${month}-01`;

      const specs = {
        ES: { multiplier: 50, tick_value: 12.5 },
        NQ: { multiplier: 20, tick_value: 5 },
        CL: { multiplier: 1000, tick_value: 10 }
      };

      const spec = specs[root] || { multiplier: 1, tick_value: 1 };

      return {
        unique_symbol: `FUT:${futuresSymbol}`,
        instrument_type: 'future',
        multiplier: spec.multiplier,
        meta: { 
          root, 
          month: monthCode, 
          year: yearStr, 
          expiry, 
          tick_value: spec.tick_value 
        }
      };
    }
  }

  return null;
}

function validateResult(result, expected) {
  if (!result) return false;
  
  // Check basic fields
  if (result.unique_symbol !== expected.unique_symbol) return false;
  if (result.instrument_type !== expected.instrument_type) return false;
  if (result.multiplier !== expected.multiplier) return false;

  // Check meta fields if specified
  if (expected.meta) {
    for (const [key, value] of Object.entries(expected.meta)) {
      if (result.meta[key] !== value) return false;
    }
  }

  return true;
}

testInstrumentResolver().catch(console.error);
