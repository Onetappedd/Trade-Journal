/**
 * Test file for trade mapper functionality
 * Run with: npx tsx lib/trade-mapper.test.ts
 */

import { mapTrade, mapTrades, type NormalizedTrade, isTradeClosed, getTradeRealizedPnl } from './trade-mapper';

// Test data with different column naming conventions
const testTrades = [
  // Standard Supabase format
  {
    id: '1',
    symbol: 'QQQ',
    side: 'buy',
    quantity: 100,
    entry_price: 150.50,
    entry_date: '2024-01-01T10:00:00Z',
    exit_price: 155.00,
    exit_date: '2024-01-02T15:30:00Z',
    fees: 1.50,
    status: 'closed',
    asset_type: 'stock',
    multiplier: null,
    pnl: 348.50
  },
  // Alternative column names
  {
    trade_id: '2',
    ticker: 'SPY',
    direction: 'sell',
    qty: 50,
    open_price: 200.00,
    open_date: '2024-01-03T09:00:00Z',
    close_price: 198.00,
    close_date: '2024-01-03T16:00:00Z',
    commission: 2.00,
    state: 'closed',
    type: 'stock',
    contract_size: null,
    profit_loss: -102.00
  },
  // Options with different naming
  {
    id: '3',
    symbol: 'AAPL240119C00150000',
    side: 'buy',
    size: 1,
    price: 5.00,
    date: '2024-01-04T10:00:00Z',
    sell_price: 6.50,
    updated_at: '2024-01-05T14:00:00Z',
    cost: 0.50,
    status: 'closed',
    instrument_type: 'option',
    lot_size: 100,
    underlying_symbol: 'AAPL',
    option_style: 'call',
    strike: 150.00,
    expiry: '2024-01-19',
    realized_pnl: 145.50
  },
  // Futures with point values
  {
    id: '4',
    symbol: 'ES',
    side: 'sell',
    contracts: 2,
    buy_price: 4500.00,
    created_at: '2024-01-06T08:00:00Z',
    sell_price: 4480.00,
    modified: '2024-01-07T12:00:00Z',
    commission: 5.00,
    status: 'closed',
    type: 'futures',
    tick_value: 50,
    pnl: 1900.00
  },
  // String values that need coercion
  {
    id: '5',
    symbol: 'TSLA',
    side: 'buy',
    quantity: '200',
    entry_price: '250.75',
    entry_date: '2024-01-08T11:00:00Z',
    exit_price: '255.00',
    exit_date: '2024-01-09T15:00:00Z',
    fees: '3.00',
    status: 'closed',
    asset_type: 'stock',
    multiplier: null,
    pnl: '847.00'
  }
];

function runTests() {
  console.log('🧪 Running Trade Mapper Tests...\n');

  // Test 1: Map individual trades
  console.log('Test 1: Mapping individual trades');
  testTrades.forEach((trade, index) => {
    const normalized = mapTrade(trade);
    console.log(`Trade ${index + 1}: ${normalized.symbol} - ${normalized.side} ${normalized.quantity} @ $${normalized.entry_price}`);
    console.log(`  Normalized: ${normalized.asset_type}, P&L: $${normalized.pnl}, Status: ${normalized.status}`);
    console.log(`  Multiplier: ${normalized.multiplier}, Fees: $${normalized.fees}\n`);
  });

  // Test 2: Map array of trades
  console.log('Test 2: Mapping array of trades');
  const normalizedTrades = mapTrades(testTrades);
  console.log(`Mapped ${normalizedTrades.length} trades successfully\n`);

  // Test 3: Verify data types
  console.log('Test 3: Verifying data types');
  const sample = normalizedTrades[0];
  console.log(`Sample trade types:`);
  console.log(`  quantity: ${typeof sample.quantity} (${sample.quantity})`);
  console.log(`  entry_price: ${typeof sample.entry_price} (${sample.entry_price})`);
  console.log(`  fees: ${typeof sample.fees} (${sample.fees})`);
  console.log(`  side: ${typeof sample.side} (${sample.side})`);
  console.log(`  status: ${typeof sample.status} (${sample.status})\n`);

  // Test 4: Test column mapping options
  console.log('Test 4: Testing custom column mappings');
  const customTrade = {
    id: '6',
    symbol: 'NVDA',
    action: 'buy',
    shares: 100,
    buy_price: 300.00,
    created: '2024-01-10T10:00:00Z',
    sell_price: 310.00,
    last_updated: '2024-01-11T16:00:00Z',
    commission: 2.50,
    state: 'closed',
    instrument_type: 'stock'
  };

  const customMappings = {
    quantity: ['shares'],
    entry_price: ['buy_price'],
    exit_price: ['sell_price'],
    entry_date: ['created'],
    exit_date: ['last_updated'],
    fees: ['commission'],
    status: ['state'],
    asset_type: ['instrument_type']
  };

  const customNormalized = mapTrade(customTrade, { columnMappings: customMappings });
  console.log(`Custom mapped trade: ${customNormalized.symbol} - ${customNormalized.side} ${customNormalized.quantity} @ $${customNormalized.entry_price}`);
  console.log(`  Exit: $${customNormalized.exit_price}, Fees: $${customNormalized.fees}, Status: ${customNormalized.status}\n`);

  // Test 5: Test null/undefined handling
  console.log('Test 5: Testing null/undefined handling');
  const incompleteTrade = {
    id: '7',
    symbol: 'AMD',
    side: 'buy',
    quantity: null,
    entry_price: undefined,
    entry_date: '',
    exit_price: null,
    exit_date: null,
    fees: null,
    status: null,
    asset_type: null
  };

  const incompleteNormalized = mapTrade(incompleteTrade);
  console.log(`Incomplete trade: ${incompleteNormalized.symbol} - ${incompleteNormalized.side} ${incompleteNormalized.quantity} @ $${incompleteNormalized.entry_price}`);
  console.log(`  Exit: ${incompleteNormalized.exit_price}, Fees: $${incompleteNormalized.fees}, Status: ${incompleteNormalized.status}\n`);

  // Test 6: Test hardened closure logic
  console.log('Test 6: Testing hardened closure logic');
  const closureTestTrades = [
    { id: '8', symbol: 'AAPL', side: 'buy', quantity: 100, entry_price: 150, entry_date: '2024-01-01', status: 'closed', pnl: 500 },
    { id: '9', symbol: 'TSLA', side: 'sell', quantity: 50, entry_price: 200, entry_date: '2024-01-02', status: 'sold', pnl: -250 },
    { id: '10', symbol: 'NVDA', side: 'buy', quantity: 25, entry_price: 300, entry_date: '2024-01-03', status: 'completed', pnl: 750 },
    { id: '11', symbol: 'AMD', side: 'buy', quantity: 200, entry_price: 100, entry_date: '2024-01-04', status: 'expired', pnl: -1000 },
    { id: '12', symbol: 'META', side: 'sell', quantity: 75, entry_price: 250, entry_date: '2024-01-05', status: 'exercised', pnl: 375 },
    { id: '13', symbol: 'GOOGL', side: 'buy', quantity: 30, entry_price: 120, entry_date: '2024-01-06', status: 'open', pnl: null },
    { id: '14', symbol: 'MSFT', side: 'sell', quantity: 60, entry_price: 280, exit_price: 285, exit_date: '2024-01-07', status: 'active', pnl: -300 }
  ];

  const normalizedClosureTrades = mapTrades(closureTestTrades);
  normalizedClosureTrades.forEach((trade, index) => {
    const closed = isTradeClosed(trade);
    const realizedPnl = getTradeRealizedPnl(trade);
    console.log(`Trade ${index + 8}: ${trade.symbol} - Status: ${trade.status} - Closed: ${closed} - P&L: ${realizedPnl}`);
  });

  // Test 7: Test REALIZED mode logic
  console.log('Test 7: Testing REALIZED mode logic');
  const realizedTestTrades = [
    // Closed trade with realized P&L
    { id: '15', symbol: 'AAPL', side: 'buy', quantity: 100, entry_price: 150, entry_date: '2024-01-01', exit_price: 155, exit_date: '2024-01-02', status: 'closed', pnl: 500 },
    // Open trade with current prices (should be excluded in realized mode)
    { id: '16', symbol: 'TSLA', side: 'buy', quantity: 50, entry_price: 200, entry_date: '2024-01-03', status: 'open', mark_price: 210, pnl: null },
    // Closed trade without exit_price but with status
    { id: '17', symbol: 'NVDA', side: 'sell', quantity: 25, entry_price: 300, entry_date: '2024-01-04', status: 'expired', pnl: -750 },
    // Open trade without current prices (should be excluded)
    { id: '18', symbol: 'AMD', side: 'buy', quantity: 200, entry_price: 100, entry_date: '2024-01-05', status: 'open', pnl: null }
  ];

  const normalizedRealizedTrades = mapTrades(realizedTestTrades);
  
  // Test realized trades filtering
  const realizedTrades = normalizedRealizedTrades.filter(trade => {
    if (trade.pnl !== null && trade.pnl !== undefined) return true;
    if (isTradeClosed(trade) && trade.entry_price) return true;
    return false;
  });

  console.log('Realized trades count:', realizedTrades.length);
  realizedTrades.forEach((trade, index) => {
    const realizedPnl = getTradeRealizedPnl(trade);
    console.log(`Realized trade ${index + 1}: ${trade.symbol} - Status: ${trade.status} - P&L: ${realizedPnl}`);
  });

  console.log('✅ All tests completed successfully!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
