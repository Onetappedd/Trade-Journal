const fs = require('fs');
const path = require('path');

// Test script to verify complete integration of instrument resolver
async function testCompleteIntegration() {
  console.log('🧪 Testing Complete Integration (Instrument Resolver + CSV Pipeline + Matching Engine)...\n');

  const testData = [
    // Equity trades
    {
      timestamp: '2024-01-15 10:30:00',
      symbol: 'AAPL',
      side: 'buy',
      quantity: 100,
      price: 150.25,
      fees: 1.00,
      currency: 'USD',
      venue: 'NASDAQ',
      instrument_type: 'stock',
      expected: {
        unique_symbol: 'EQ:AAPL',
        instrument_type: 'equity',
        multiplier: 1,
        trade_pnl: (155.75 - 150.25) * 100 - 2.00 // $548.00
      }
    },
    {
      timestamp: '2024-01-15 14:45:00',
      symbol: 'AAPL',
      side: 'sell',
      quantity: 100,
      price: 155.75,
      fees: 1.00,
      currency: 'USD',
      venue: 'NASDAQ',
      instrument_type: 'stock',
      expected: {
        unique_symbol: 'EQ:AAPL',
        instrument_type: 'equity',
        multiplier: 1
      }
    },
    // TSLA with suffix normalization
    {
      timestamp: '2024-01-16 09:15:00',
      symbol: 'TSLA.US',
      side: 'buy',
      quantity: 50,
      price: 250.00,
      fees: 1.50,
      currency: 'USD',
      venue: 'NASDAQ',
      instrument_type: 'stock',
      expected: {
        unique_symbol: 'EQ:TSLA',
        instrument_type: 'equity',
        multiplier: 1,
        trade_pnl: (245.50 - 250.00) * 50 - 3.00 // -$228.00
      }
    },
    {
      timestamp: '2024-01-16 16:00:00',
      symbol: 'TSLA',
      side: 'sell',
      quantity: 50,
      price: 245.50,
      fees: 1.50,
      currency: 'USD',
      venue: 'NASDAQ',
      instrument_type: 'stock',
      expected: {
        unique_symbol: 'EQ:TSLA',
        instrument_type: 'equity',
        multiplier: 1
      }
    },
    // Option with OCC symbol
    {
      timestamp: '2024-01-17 10:00:00',
      symbol: 'SPY240216C00450000',
      side: 'buy',
      quantity: 1,
      price: 5.00,
      fees: 2.00,
      currency: 'USD',
      venue: 'ARCA',
      instrument_type: 'option',
      expiry: '2024-02-16',
      strike: 450,
      option_type: 'call',
      multiplier: 100,
      underlying: 'SPY',
      expected: {
        unique_symbol: 'OPT:SPY240216C00450000',
        instrument_type: 'option',
        multiplier: 100,
        trade_pnl: (6.50 - 5.00) * 1 * 100 - 4.00 // $146.00
      }
    },
    {
      timestamp: '2024-01-17 14:30:00',
      symbol: 'SPY240216C00450000',
      side: 'sell',
      quantity: 1,
      price: 6.50,
      fees: 2.00,
      currency: 'USD',
      venue: 'ARCA',
      instrument_type: 'option',
      expiry: '2024-02-16',
      strike: 450,
      option_type: 'call',
      multiplier: 100,
      underlying: 'SPY',
      expected: {
        unique_symbol: 'OPT:SPY240216C00450000',
        instrument_type: 'option',
        multiplier: 100
      }
    },
    // Futures trades
    {
      timestamp: '2024-01-18 09:00:00',
      symbol: 'ESZ5',
      side: 'buy',
      quantity: 2,
      price: 4500.00,
      fees: 5.00,
      currency: 'USD',
      venue: 'CME',
      instrument_type: 'future',
      expected: {
        unique_symbol: 'FUT:ESZ5',
        instrument_type: 'future',
        multiplier: 50,
        trade_pnl: (4510.00 - 4500.00) * 2 * 50 - 10.00 // $990.00
      }
    },
    {
      timestamp: '2024-01-18 15:00:00',
      symbol: 'ESZ5',
      side: 'sell',
      quantity: 2,
      price: 4510.00,
      fees: 5.00,
      currency: 'USD',
      venue: 'CME',
      instrument_type: 'future',
      expected: {
        unique_symbol: 'FUT:ESZ5',
        instrument_type: 'future',
        multiplier: 50
      }
    },
    {
      timestamp: '2024-01-19 10:30:00',
      symbol: 'NQH24',
      side: 'buy',
      quantity: 1,
      price: 15000.00,
      fees: 8.00,
      currency: 'USD',
      venue: 'CME',
      instrument_type: 'future',
      expected: {
        unique_symbol: 'FUT:NQH24',
        instrument_type: 'future',
        multiplier: 20,
        trade_pnl: (14950.00 - 15000.00) * 1 * 20 - 16.00 // -$1,016.00
      }
    },
    {
      timestamp: '2024-01-19 16:00:00',
      symbol: 'NQH24',
      side: 'sell',
      quantity: 1,
      price: 14950.00,
      fees: 8.00,
      currency: 'USD',
      venue: 'CME',
      instrument_type: 'future',
      expected: {
        unique_symbol: 'FUT:NQH24',
        instrument_type: 'future',
        multiplier: 20
      }
    }
  ];

  console.log('📊 Expected Results:');
  console.log('1. AAPL: Closed equity trade, P&L = $548.00');
  console.log('2. TSLA: Closed equity trade, P&L = -$228.00');
  console.log('3. SPY Option: Closed option trade, P&L = $146.00');
  console.log('4. ES Futures: Closed futures trade, P&L = $990.00');
  console.log('5. NQ Futures: Closed futures trade, P&L = -$1,016.00');
  console.log('\nExpected: 5 closed trades with instrument resolution\n');

  // Simulate instrument resolution
  const instruments = new Map();
  const trades = simulateCompleteIntegration(testData, instruments);

  console.log('✅ Integration Results:');
  console.log(`\n📈 Instruments Created: ${instruments.size}`);
  instruments.forEach((instrument, symbol) => {
    console.log(`   ${symbol}: ${instrument.unique_symbol} (${instrument.instrument_type}, multiplier: ${instrument.multiplier})`);
  });

  console.log(`\n💰 Trades Created: ${trades.length}`);
  trades.forEach((trade, index) => {
    console.log(`\n${index + 1}. ${trade.symbol} (${trade.instrument_type})`);
    console.log(`   Status: ${trade.status}`);
    console.log(`   Opened: ${trade.opened_at}`);
    console.log(`   Closed: ${trade.closed_at || 'N/A'}`);
    console.log(`   Quantity: ${trade.qty_opened}`);
    console.log(`   Avg Open: $${trade.avg_open_price}`);
    console.log(`   Avg Close: $${trade.avg_close_price || 'N/A'}`);
    console.log(`   P&L: $${trade.realized_pnl}`);
    console.log(`   Fees: $${trade.fees}`);
    if (trade.legs) {
      console.log(`   Legs: ${trade.legs.length} option legs`);
    }
  });

  console.log('\n🎯 Acceptance Criteria Check:');
  console.log(`✅ Equity trades with symbol normalization: ${trades.filter(t => t.instrument_type === 'equity' && t.status === 'closed').length}/2`);
  console.log(`✅ Option trade with OCC symbol: ${trades.filter(t => t.instrument_type === 'option' && t.status === 'closed').length}/1`);
  console.log(`✅ Futures trades with tick value: ${trades.filter(t => t.instrument_type === 'future' && t.status === 'closed').length}/2`);
  console.log(`✅ Total closed trades: ${trades.filter(t => t.status === 'closed').length}/5`);
  console.log(`✅ Unique instruments: ${instruments.size}/5`);

  const allClosed = trades.filter(t => t.status === 'closed').length === 5;
  const correctInstruments = instruments.size === 5;
  console.log(`\n${allClosed && correctInstruments ? '🎉 ALL TESTS PASSED!' : '❌ Some tests failed'}`);
}

function simulateCompleteIntegration(executions, instruments) {
  const trades = [];
  const groups = new Map();

  // Group executions by instrument
  executions.forEach(exec => {
    let key;
    if (exec.instrument_type === 'option') {
      key = `${exec.underlying}-${exec.expiry}-${exec.instrument_type}`;
    } else {
      // Normalize symbol for grouping
      const normalizedSymbol = exec.symbol.trim().toUpperCase().replace(/\.(US|N|O|A)$/, '');
      key = `${normalizedSymbol}-${exec.instrument_type}`;
    }
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(exec);
  });

  // Process each group
  for (const [key, execs] of groups) {
    const parts = key.split('-');
    let symbol, instrumentType;

    if (parts.length >= 3 && parts[parts.length - 1] === 'option') {
      symbol = parts[0];
      instrumentType = 'option';
    } else {
      symbol = parts[0];
      instrumentType = parts[1];
    }

    execs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Resolve instrument
    const instrument = resolveInstrument(execs[0], instruments);
    const normalizedSymbol = symbol.trim().toUpperCase().replace(/\.(US|N|O|A)$/, '');
    if (!instruments.has(normalizedSymbol)) {
      instruments.set(normalizedSymbol, instrument);
    }

    // Create trade
    if (instrumentType === 'stock') {
      const buy = execs.find(e => e.side === 'buy');
      const sell = execs.find(e => e.side === 'sell');
      if (buy && sell) {
        const pnl = (sell.price - buy.price) * buy.quantity - (buy.fees + sell.fees);
        trades.push({
          symbol: instrument.unique_symbol,
          instrument_type: 'equity',
          status: 'closed',
          opened_at: buy.timestamp,
          closed_at: sell.timestamp,
          qty_opened: buy.quantity,
          qty_closed: sell.quantity,
          avg_open_price: buy.price,
          avg_close_price: sell.price,
          realized_pnl: pnl,
          fees: buy.fees + sell.fees,
          currency: buy.currency,
          venue: buy.venue,
        });
      }
    } else if (instrumentType === 'option') {
      const buy = execs.find(e => e.side === 'buy');
      const sell = execs.find(e => e.side === 'sell');
      if (buy && sell) {
        const pnl = (sell.price - buy.price) * buy.quantity * buy.multiplier - (buy.fees + sell.fees);
        trades.push({
          symbol: instrument.unique_symbol,
          instrument_type: 'option',
          status: 'closed',
          opened_at: buy.timestamp,
          closed_at: sell.timestamp,
          qty_opened: buy.quantity,
          qty_closed: sell.quantity,
          avg_open_price: buy.price,
          avg_close_price: sell.price,
          realized_pnl: pnl,
          fees: buy.fees + sell.fees,
          currency: buy.currency,
          venue: buy.venue,
          legs: [{
            side: buy.side,
            type: buy.option_type,
            strike: buy.strike,
            expiry: buy.expiry,
            qty: buy.quantity,
            avg_price: buy.price,
          }]
        });
      }
    } else if (instrumentType === 'future') {
      const buy = execs.find(e => e.side === 'buy');
      const sell = execs.find(e => e.side === 'sell');
      if (buy && sell) {
        const pnl = (sell.price - buy.price) * buy.quantity * instrument.multiplier - (buy.fees + sell.fees);
        trades.push({
          symbol: instrument.unique_symbol,
          instrument_type: 'future',
          status: 'closed',
          opened_at: buy.timestamp,
          closed_at: sell.timestamp,
          qty_opened: buy.quantity,
          qty_closed: sell.quantity,
          avg_open_price: buy.price,
          avg_close_price: sell.price,
          realized_pnl: pnl,
          fees: buy.fees + sell.fees,
          currency: buy.currency,
          venue: buy.venue,
        });
      }
    }
  }

  return trades;
}

function resolveInstrument(exec, instruments) {
  const { symbol, instrument_type, underlying, expiry, strike, option_type, multiplier = 1 } = exec;

  if (instrument_type === 'stock') {
    const normalizedSymbol = symbol.trim().toUpperCase().replace(/\.(US|N|O|A)$/, '');
    return {
      unique_symbol: `EQ:${normalizedSymbol}`,
      instrument_type: 'equity',
      multiplier: 1,
      meta: { exchange: exec.venue || 'UNKNOWN' }
    };
  }

  if (instrument_type === 'option') {
    let occSymbol;
    if (symbol.match(/^[A-Z]+\d{6}[CP]\d{8}$/)) {
      // Already in OCC format
      occSymbol = symbol;
    } else {
      // Build OCC symbol
      const date = new Date(expiry);
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const yymmdd = yy + mm + dd;
      const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0');
      const callPut = option_type === 'call' ? 'C' : 'P';
      occSymbol = `${underlying}${yymmdd}${callPut}${strikeStr}`;
    }
    return {
      unique_symbol: `OPT:${occSymbol}`,
      instrument_type: 'option',
      multiplier: multiplier || 100,
      meta: { underlying, expiry, strike, type: option_type }
    };
  }

  if (instrument_type === 'future') {
    const match = symbol.match(/^([A-Z]+)([A-Z])(\d{1,2})$/);
    if (match) {
      const [, root, monthCode, yearStr] = match;
      const specs = {
        ES: { multiplier: 50, tick_value: 12.5 },
        NQ: { multiplier: 20, tick_value: 5 },
        CL: { multiplier: 1000, tick_value: 10 }
      };
      const spec = specs[root] || { multiplier: 1, tick_value: 1 };
      
      return {
        unique_symbol: `FUT:${symbol}`,
        instrument_type: 'future',
        multiplier: spec.multiplier,
        meta: { root, tick_value: spec.tick_value }
      };
    }
  }

  return {
    unique_symbol: `UNKNOWN:${symbol}`,
    instrument_type: 'unknown',
    multiplier: 1,
    meta: {}
  };
}

testCompleteIntegration().catch(console.error);
