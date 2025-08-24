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
  // If pnl is already calculated, use it
  if (trade.pnl !== null && trade.pnl !== undefined) {
    return trade.pnl;
  }

  // If no entry price, can't calculate P&L
  if (!trade.entry_price) return 0;

  // For closed trades, calculate from entry/exit prices
  if (trade.exit_price && trade.exit_date) {
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

  // For open trades, we can't calculate realized P&L yet
  return 0;
}

// Build cumulative P&L series from trades
function buildPnlSeries(trades: TradeRow[]): PnlDataPoint[] {
  if (!trades || trades.length === 0) return [];

  // Filter trades that have P&L data (either calculated pnl or closed trades)
  const tradesWithPnl = trades.filter(trade => {
    // Include trades with calculated P&L
    if (trade.pnl !== null && trade.pnl !== undefined) return true;
    // Include closed trades that we can calculate P&L for
    if (trade.exit_price && trade.exit_date && trade.entry_price) return true;
    return false;
  });

  if (tradesWithPnl.length === 0) return [];

  // Sort by date (use exit_date for closed trades, entry_date for open trades)
  const sortedTrades = tradesWithPnl.sort((a, b) => {
    const dateA = a.exit_date || a.entry_date;
    const dateB = b.exit_date || b.entry_date;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Group trades by date and calculate daily P&L
  const dailyPnl = new Map<string, number>();
  
  sortedTrades.forEach(trade => {
    const date = (trade.exit_date || trade.entry_date).split('T')[0]; // Get just the date part
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
  // Debug logging
  console.log('DashboardPnl - Total trades:', trades.length);
  console.log('DashboardPnl - Trades with P&L:', trades.filter(t => t.pnl !== null && t.pnl !== undefined).length);
  console.log('DashboardPnl - Closed trades:', trades.filter(t => t.exit_price && t.exit_date).length);
  
  const pnlData = useMemo(() => buildPnlSeries(trades), [trades]);
  
  console.log('DashboardPnl - P&L data points:', pnlData.length);
  if (pnlData.length > 0) {
    console.log('DashboardPnl - First P&L point:', pnlData[0]);
    console.log('DashboardPnl - Last P&L point:', pnlData[pnlData.length - 1]);
  }

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
                {trades.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
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
