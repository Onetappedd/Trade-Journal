'use client';

import { PnlChartWrapper } from './PnlChartWrapper';
import { type GenericTrade } from '@/hooks/usePnlData';

// Use local TradeRow type for analytics page compatibility
interface LocalTradeRow {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  entry_date: string;
  exit_price?: number | null;
  exit_date?: string | null;
  status?: string;
  asset_type?: string;
  multiplier?: number | null;
  underlying?: string | null;
  option_type?: string | null;
  strike_price?: number | null;
  expiration_date?: string | null;
  fees?: number | null;
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
    qty_opened: trade.quantity,
    avg_open_price: trade.entry_price,
    opened_at: trade.entry_date,
    avg_close_price: trade.exit_price,
    closed_at: trade.exit_date,
    instrument_type: trade.asset_type,
    fees: trade.fees,
    pnl: undefined, // Analytics trades don't have pre-calculated P&L
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
