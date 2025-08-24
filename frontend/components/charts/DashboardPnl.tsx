'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentSize } from '@visx/responsive';
import PnlAreaChart from './PnlAreaChart';
import type { TradeRow } from '@/types/trade';

interface PnlDataPoint {
  date: string;
  value: number;
}

interface DashboardPnlProps {
  trades: TradeRow[];
  className?: string;
}

// Calculate P&L for a single trade
function calculateTradePnl(trade: TradeRow): number {
  if (!trade.entry_price || !trade.exit_price) return 0;

  const quantity = trade.quantity;
  const entryPrice = trade.entry_price;
  const exitPrice = trade.exit_price;
  const fees = trade.fees || 0;

  let pnl = 0;

  switch (trade.asset_type) {
    case 'option':
      const multiplier = trade.multiplier || 100;
      pnl = (exitPrice - entryPrice) * quantity * multiplier - fees;
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
      pnl = (exitPrice - entryPrice) * quantity * pointValue - fees;
      break;

    case 'stock':
    case 'crypto':
    default:
      pnl = (exitPrice - entryPrice) * quantity - fees;
      break;
  }

  return pnl;
}

// Build cumulative P&L series from trades
function buildPnlSeries(trades: TradeRow[]): PnlDataPoint[] {
  if (!trades || trades.length === 0) return [];

  // Filter only closed trades and sort by exit date
  const closedTrades = trades
    .filter(trade => trade.exit_price && trade.exit_date)
    .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime());

  if (closedTrades.length === 0) return [];

  // Group trades by date and calculate daily P&L
  const dailyPnl = new Map<string, number>();
  
  closedTrades.forEach(trade => {
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

export default function DashboardPnl({ trades, className = '' }: DashboardPnlProps) {
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
        <CardTitle>Portfolio P&L</CardTitle>
        <CardDescription>Your cumulative profit and loss over time</CardDescription>
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
              <div className="text-sm text-muted-foreground">Today's Change</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {trades.filter(t => t.exit_price && t.exit_date).length}
              </div>
              <div className="text-sm text-muted-foreground">Closed Trades</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[300px] w-full">
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
