'use client';

import type { TradeRow } from '@/types/trade';
import { PnlChartWrapper } from './PnlChartWrapper';
import { type GenericTrade } from '@/hooks/usePnlData';

interface DashboardPnlProps {
  trades: TradeRow[];
  className?: string;
}

export default function DashboardPnl({ trades, className = '' }: DashboardPnlProps) {
  // DEBUG: Log raw trades data
  console.log('🔍 DASHBOARD PNL - Raw trades count:', trades.length);
  if (trades.length > 0) {
    console.log('🔍 DASHBOARD PNL - Sample trade:', {
      id: trades[0].id,
      symbol: trades[0].symbol,
      side: trades[0].side,
      status: trades[0].status,
      entry_price: trades[0].entry_price,
      exit_price: trades[0].exit_price,
      entry_date: trades[0].entry_date,
      exit_date: trades[0].exit_date,
      pnl: trades[0].pnl,
      fees: trades[0].fees,
      asset_type: trades[0].asset_type,
      multiplier: trades[0].multiplier
    });
  }

  // TEMPORARY: Test P&L calculation with sample data
  if (trades.length === 0) {
    console.log('🔍 DASHBOARD PNL - No trades found, testing with sample data');
    const sampleTrades: GenericTrade[] = [
      {
        id: 'test-1',
        symbol: 'AAPL',
        side: 'buy',
        quantity: 100,
        entry_price: 150.00,
        entry_date: '2024-01-01T10:00:00Z',
        exit_price: 155.00,
        exit_date: '2024-01-02T15:00:00Z',
        status: 'closed',
        asset_type: 'stock',
        fees: 5.00,
        pnl: null
      },
      {
        id: 'test-2',
        symbol: 'TSLA',
        side: 'sell',
        quantity: 50,
        entry_price: 200.00,
        entry_date: '2024-01-03T09:00:00Z',
        exit_price: 195.00,
        exit_date: '2024-01-04T14:00:00Z',
        status: 'closed',
        asset_type: 'stock',
        fees: 3.00,
        pnl: null
      },
      {
        id: 'test-3',
        symbol: 'SPY',
        side: 'buy',
        quantity: 1,
        entry_price: 2.50,
        entry_date: '2024-01-05T11:00:00Z',
        exit_price: 3.00,
        exit_date: '2024-01-06T16:00:00Z',
        status: 'closed',
        asset_type: 'option',
        multiplier: 100,
        fees: 2.00,
        pnl: null
      }
    ];
    
    console.log('🔍 DASHBOARD PNL - Testing with sample trades:', sampleTrades);
    
    return (
      <PnlChartWrapper
        trades={sampleTrades}
        title="Portfolio P&L (Test Data)"
        description="Your cumulative profit and loss over time"
        className={className}
        chartHeight={300}
        variant="dashboard"
        showSummaryBar={true}
        showTradeCounts={true}
      />
    );
  }

  // Convert TradeRow to GenericTrade for the shared hook
  const genericTrades: GenericTrade[] = trades.map(trade => ({
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    entry_price: trade.entry_price,
    entry_date: trade.entry_date,
    exit_price: trade.exit_price,
    exit_date: trade.exit_date,
    status: trade.status,
    asset_type: trade.asset_type,
    multiplier: trade.multiplier,
    underlying: trade.underlying,
    option_type: trade.option_type,
    strike_price: trade.strike_price,
    expiration_date: trade.expiration_date,
    fees: trade.fees,
    pnl: trade.pnl,
    mark_price: undefined, // TradeRow doesn't have mark_price
    last_price: undefined, // TradeRow doesn't have last_price
  }));

  console.log('🔍 DASHBOARD PNL - Generic trades count:', genericTrades.length);

  return (
    <PnlChartWrapper
      trades={genericTrades}
      title="Portfolio P&L"
      description="Your cumulative profit and loss over time"
      className={className}
      chartHeight={300}
      variant="dashboard"
      showSummaryBar={true}
      showTradeCounts={true}
    />
  );
}
