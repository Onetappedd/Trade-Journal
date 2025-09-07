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
    status: trade.status,
    qty_opened: trade.qty_opened,
    avg_open_price: trade.avg_open_price,
    opened_at: trade.opened_at,
    avg_close_price: trade.avg_close_price,
    closed_at: trade.closed_at,
    instrument_type: trade.instrument_type,
    fees: trade.fees,
    pnl: trade.realized_pnl,
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
