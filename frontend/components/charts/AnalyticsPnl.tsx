'use client';

import { PnlChartWrapper } from './PnlChartWrapper';
import { type GenericTrade } from '@/hooks/usePnlData';

// Use local TradeRow type for analytics page compatibility
interface LocalTradeRow {
  id: string;
  symbol: string;
  instrument_type: string;
  qty_opened: number;
  avg_open_price: number;
  opened_at: string;
  avg_close_price?: number | null;
  closed_at?: string | null;
  status?: string;
  legs?: any | null;
  fees?: number | null;
  realized_pnl?: number | null;
}

interface AnalyticsPnlProps {
  trades: LocalTradeRow[];
  className?: string;
}

export default function AnalyticsPnl({ trades, className = '' }: AnalyticsPnlProps) {
  // Convert LocalTradeRow to GenericTrade for the shared hook
  const genericTrades: GenericTrade[] = trades.map(trade => ({
    id: trade.id,
    symbol: trade.symbol,
    status: trade.status || 'open',
    qty_opened: trade.qty_opened,
    avg_open_price: trade.avg_open_price,
    opened_at: trade.opened_at,
    avg_close_price: trade.avg_close_price,
    closed_at: trade.closed_at,
    instrument_type: trade.instrument_type,
    fees: trade.fees,
    pnl: trade.realized_pnl, // Use realized_pnl from the database
    mark_price: undefined,
    last_price: undefined,
  }));

  return (
    <PnlChartWrapper
      trades={genericTrades}
      title="Cumulative P&L"
      description="Your profit and loss performance over time"
      className={className}
      chartHeight={400}
      variant="analytics"
      showSummaryBar={true}
      showTradeCounts={true}
    />
  );
}
