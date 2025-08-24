import { tradePnl, buildCumulativeSeries, convertTradeRow } from './pnl';

// Simple test to verify P&L calculations
const testTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    asset_type: 'stock' as const,
    side: 'buy' as const,
    quantity: 100,
    entry_price: 150,
    exit_price: 160,
    fees: 5,
    entry_date: '2024-01-01',
    exit_date: '2024-01-02',
  },
  {
    id: '2',
    symbol: 'TSLA',
    asset_type: 'option' as const,
    side: 'buy' as const,
    quantity: 1,
    entry_price: 5,
    exit_price: 8,
    fees: 2,
    multiplier: 100,
    entry_date: '2024-01-03',
    exit_date: '2024-01-04',
  },
  {
    id: '3',
    symbol: 'ES',
    asset_type: 'futures' as const,
    side: 'sell' as const,
    quantity: 1,
    entry_price: 5000,
    exit_price: 4950,
    fees: 10,
    entry_date: '2024-01-05',
    exit_date: '2024-01-06',
  }
];

console.log('Testing P&L calculations...');

// Test individual trade P&L
testTrades.forEach((trade, i) => {
  const pnl = tradePnl(trade);
  console.log(`Trade ${i + 1} (${trade.symbol}):`, pnl);
});

// Test cumulative series
const series = buildCumulativeSeries(testTrades);
console.log('Cumulative series:', series);

// Test conversion
const converted = testTrades.map(convertTradeRow);
console.log('Converted trades:', converted.length);

console.log('P&L calculations test completed!');
