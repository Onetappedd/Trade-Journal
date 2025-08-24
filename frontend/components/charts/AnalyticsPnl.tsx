'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentSize } from '@visx/responsive';
import PnlAreaChart from './PnlAreaChart';

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

interface PnlDataPoint {
  date: string;
  value: number;
}

interface AnalyticsPnlProps {
  trades: LocalTradeRow[];
  className?: string;
}

// Calculate P&L for a single trade
function calculateTradePnl(trade: LocalTradeRow): number {
  // If no entry price, can't calculate P&L
  if (!trade.entry_price) return 0;

  // For closed trades, calculate from entry/exit prices
  if (trade.exit_price && trade.exit_date) {
    const quantity = trade.quantity;
    const entryPrice = trade.entry_price;
    const exitPrice = trade.exit_price;

    let pnl = 0;

    switch (trade.asset_type) {
      case 'option':
        const multiplier = trade.multiplier || 100;
        pnl = (exitPrice - entryPrice) * quantity * multiplier;
        break;

      case 'futures':
        // Use point values for futures
        const pointValues: Record<string, number> = {
          ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5, RTY: 50, M2K: 5,
          CL: 1000, MCL: 100, GC: 100, MGC: 10, SI: 5000, SIL: 1000,
        };
        const pointValue = Object.entries(pointValues).find(([key]) => 
          trade.symbol.toUpperCase().startsWith(key)
        )?.[1] || 1;
        pnl = (exitPrice - entryPrice) * quantity * pointValue;
        break;

      case 'stock':
      case 'crypto':
      default:
        pnl = (exitPrice - entryPrice) * quantity;
        break;
    }

    return pnl;
  }

  // For open trades, we can't calculate realized P&L yet
  return 0;
}

// Build cumulative P&L series from trades
function buildPnlSeries(trades: LocalTradeRow[]): PnlDataPoint[] {
  if (!trades || trades.length === 0) return [];

  // Filter trades that have P&L data (closed trades with entry/exit prices)
  const tradesWithPnl = trades.filter(trade => {
    // Include closed trades that we can calculate P&L for
    if (trade.exit_price && trade.exit_date && trade.entry_price) return true;
    return false;
  });

  if (tradesWithPnl.length === 0) return [];

  // Sort by exit date
  const sortedTrades = tradesWithPnl.sort((a, b) => {
    return new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime();
  });

  // Group trades by date and calculate daily P&L
  const dailyPnl = new Map<string, number>();
  
  sortedTrades.forEach(trade => {
    const date = trade.exit_date!.split('T')[0]; // Get just the date part
    const pnl = calculateTradePnl(trade);
    dailyPnl.set(date, (dailyPnl.get(date) || 0) + pnl);
  });

  // Convert to cumulative series
  let cumulativePnl = 0;
  const series: PnlDataPoint[] = [];

  Array.from(dailyPnl.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, dailyPnl]) => {
      cumulativePnl += dailyPnl;
      series.push({
        date,
        value: cumulativePnl,
      });
    });

  return series;
}

export default function AnalyticsPnl({ trades, className = '' }: AnalyticsPnlProps) {
  const pnlData = useMemo(() => buildPnlSeries(trades), [trades]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (pnlData.length === 0) {
      return { totalPnl: 0, currentPnl: 0, change: 0 };
    }

    const totalPnl = pnlData[pnlData.length - 1].value;
    const previousPnl = pnlData.length > 1 ? pnlData[pnlData.length - 2].value : 0;
    const change = totalPnl - previousPnl;

    return {
      totalPnl,
      currentPnl: totalPnl,
      change,
    };
  }, [pnlData]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cumulative P&L</CardTitle>
        <CardDescription>Your profit and loss performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${summary.totalPnl.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${summary.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.change >= 0 ? '+' : ''}${summary.change.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Latest Change</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {trades.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[400px] w-full">
            <ParentSize>
              {({ width, height }) => (
                <PnlAreaChart
                  data={pnlData}
                  width={width}
                  height={height}
                  margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                />
              )}
            </ParentSize>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
