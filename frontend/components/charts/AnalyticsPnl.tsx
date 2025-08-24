'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PnlAreaChart from '@/components/charts/PnlAreaChart';
import RangeToggle from '@/components/charts/RangeToggle';
import { usePnlSeries } from '@/components/charts/usePnlSeries';
import { PnlSummary } from '@/components/charts/PnlSummary';
import type { Trade } from '@/lib/domain/pnl';
import { convertTradeRow } from '@/lib/domain/pnl';
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
}

interface AnalyticsPnlProps {
  trades: LocalTradeRow[];
  className?: string;
}

export default function AnalyticsPnl({ trades, className = '' }: AnalyticsPnlProps) {
  const searchParams = useSearchParams();
  const range = (searchParams.get('range') || 'ALL') as any;
  
  // Convert TradeRow to Trade for the chart
  const convertedTrades: Trade[] = trades.map(convertTradeRow);
  const series = usePnlSeries(convertedTrades, range, 'total');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cumulative P&L</CardTitle>
            <CardDescription>Portfolio performance over time</CardDescription>
          </div>
          <RangeToggle />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PnlSummary trades={convertedTrades} />
        <div className="h-[400px]">
          <PnlAreaChart data={series} height={400} />
        </div>
      </CardContent>
    </Card>
  );
}
