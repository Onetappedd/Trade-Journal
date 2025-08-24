'use client';

import { useSearchParams } from 'next/navigation';
import PnlAreaChart from '@/components/charts/PnlAreaChart';
import RangeToggle from '@/components/charts/RangeToggle';
import { usePnlSeries } from '@/components/charts/usePnlSeries';
import { PnlSummary } from '@/components/charts/PnlSummary';
import type { Trade } from '@/lib/domain/pnl';
import { convertTradeRow } from '@/lib/domain/pnl';
import type { TradeRow } from '@/types/trade';

interface DashboardPnlProps {
  trades: TradeRow[];
  className?: string;
}

export default function DashboardPnl({ trades, className = '' }: DashboardPnlProps) {
  const searchParams = useSearchParams();
  const range = (searchParams.get('range') || 'ALL') as any;
  
  // Convert TradeRow to Trade for the chart
  const convertedTrades: Trade[] = trades.map(convertTradeRow);
  const series = usePnlSeries(convertedTrades, range, 'total');

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Portfolio P&L</h3>
        <RangeToggle />
      </div>
      <PnlSummary trades={convertedTrades} />
      <div className="rounded-2xl border p-4 bg-card">
        <PnlAreaChart data={series} height={280} />
      </div>
    </div>
  );
}
