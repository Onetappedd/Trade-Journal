'use client';

import type { TradeRow } from '@/types/trade';
import { PnlChartWrapper } from './PnlChartWrapper';
import { type GenericTrade } from '@/hooks/usePnlData';

interface DashboardPnlProps {
  trades: TradeRow[];
  className?: string;
}

export default function DashboardPnl({ trades, className = '' }: DashboardPnlProps) {
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
