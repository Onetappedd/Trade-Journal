'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  ComposedChart,
  Customized,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { usePortfolioAnalytics, usePortfolioPositions } from '@/hooks/usePortfolio';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase';
import AnalyticsPnl from '@/components/charts/AnalyticsPnl';

// Import new analytics components
import { AnalyticsTables } from '@/components/analytics/AnalyticsTables';
import { ExpectancyChart } from '@/components/analytics/ExpectancyChart';
import { CalendarHeatmap } from '@/components/analytics/CalendarHeatmap';
import { DrawdownRecoveryTable } from '@/components/analytics/DrawdownRecoveryTable';
import { useDailyPnl } from '@/hooks/useAnalytics';
import { type TradeRow } from '@/types/trade';

// --- THEME ---
const COLORS = {
  bgDark: '#1E1E1E',
  bgElevated: '#2D2D2D',
  bgMuted: '#404040',
  text: '#E5E7EB',
  subtext: '#9CA3AF',
  gain: '#00C896',
  loss: '#FF6B6B',
  grid: '#404040',
};

// --- TYPES ---
interface Candle {
  t: string; // label for X-axis
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}


// --- HELPERS ---
function formatCurrency(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function randomWalk(start: number, steps: number, scale = 1.0) {
  const arr: number[] = [start];
  for (let i = 1; i < steps; i++) {
    const drift = (Math.random() - 0.5) * scale;
    const prev = arr[i - 1];
    arr.push(Math.max(1, prev * (1 + drift / 100)));
  }
  return arr;
}

function genOHLC(base: number, count: number, labelPrefix: string): Candle[] {
  const closes = randomWalk(base, count, 0.9);
  const candles: Candle[] = closes.map((c, i) => {
    const prev = i > 0 ? closes[i - 1] : c * (1 - (Math.random() - 0.5) * 0.01);
    const open = prev;
    const close = c;
    const spread = Math.max(0.05, Math.abs(close - open) * (0.7 + Math.random() * 0.6));
    const high = Math.max(open, close) + spread;
    const low = Math.min(open, close) - spread;
    return {
      t: `${labelPrefix}-${i + 1}`,
      open,
      high,
      low,
      close,
      volume: Math.round(1000 + Math.random() * 10000),
    };
  });
  return candles;
}

function mean(a: number[]) {
  if (!a.length) return 0;
  return a.reduce((s, v) => s + v, 0) / a.length;
}

function std(a: number[]) {
  if (a.length < 2) return 0;
  const m = mean(a);
  const v = mean(a.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function calcExpectancy(winRatePct: number, avgWin: number, avgLoss: number) {
  const p = winRatePct / 100;
  const q = 1 - p;
  return p * avgWin - q * avgLoss;
}

// --- REUSABLE UI ---
function MetricCard({
  title,
  value,
  delta,
  positive = true,
  ariaLabel,
}: {
  title: string;
  value: string;
  delta?: string;
  positive?: boolean;
  ariaLabel?: string;
}) {
  return (
    <Card
      className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm hover:shadow-md transition-shadow"
      aria-label={ariaLabel || title}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {positive ? (
          <TrendingUp className="h-4 w-4 text-[#00C896]" />
        ) : (
          <TrendingDown className="h-4 w-4 text-[#FF6B6B]" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {delta && (
                      <p className="text-xs text-muted-foreground mt-1">
            {positive ? (
              <ArrowUpRight className="inline h-3 w-3 mr-1 text-[#00C896]" />
            ) : (
              <ArrowDownRight className="inline h-3 w-3 mr-1 text-[#FF6B6B]" />
            )}
            {delta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- CANDLESTICK RENDERER USING Recharts Customized (kept for price chart aesthetic) ---
function CandlestickSeries({
  data,
  colorUp,
  colorDown,
}: {
  data: Candle[];
  colorUp: string;
  colorDown: string;
}) {
  return (
    <Customized
      component={(props: any) => {
        const { xAxisMap, yAxisMap, offset } = props;
        const xKey = Object.keys(xAxisMap)[0];
        const yKey = Object.keys(yAxisMap)[0];
        const xScale = xAxisMap[xKey].scale;
        const yScale = yAxisMap[yKey].scale;
        const left = offset?.left || 0;
        const top = offset?.top || 0;

        let cw = 6;
        if (data.length > 1) {
          const x0 = xScale(data[0].t);
          const x1 = xScale(data[1].t);
          const gap = Math.abs(x1 - x0);
          cw = Math.max(3, Math.min(10, Math.floor(gap * 0.6)));
        }

        return (
          <g aria-label="candlestick-series">
            {data.map((d, idx) => {
              const x = xScale(d.t) + left;
              const yOpen = yScale(d.open) + top;
              const yClose = yScale(d.close) + top;
              const yHigh = yScale(d.high) + top;
              const yLow = yScale(d.low) + top;
              const up = d.close >= d.open;
              const fill = up ? colorUp : colorDown;
              const bodyY = Math.min(yOpen, yClose);
              const bodyH = Math.max(1, Math.abs(yClose - yOpen));
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    x2={x}
                    y1={yHigh}
                    y2={yLow}
                    stroke={fill}
                    strokeWidth={1}
                    opacity={0.9}
                  />
                  <rect
                    x={x - cw / 2}
                    y={bodyY}
                    width={cw}
                    height={bodyH}
                    fill={fill}
                    rx={1}
                    ry={1}
                    opacity={0.9}
                  />
                </g>
              );
            })}
          </g>
        );
      }}
    />
  );
}

// Fetch all trades for top gainers/losers calculation
function useRecentTrades(limit: number = 5000) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function fetchTrades() {
      try {
        if (!user) {
          setTrades([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        const { data, error } = await supabase
          .from('trades')
          .select(
            'id, symbol, instrument_type, qty_opened, qty_closed, avg_open_price, avg_close_price, opened_at, closed_at, status, realized_pnl, fees, legs',
          )
          .eq('user_id', user.id)
          .order('closed_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        if (!mounted) return;
        setTrades((data as any) || []);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Error fetching trades');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTrades();
    const id = setInterval(fetchTrades, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user?.id, limit]);

  return { trades, loading, error };
}

export function AnalyticsPage() {
  // Use real analytics + positions
  const { analytics, isLoading: analyticsLoading } = usePortfolioAnalytics(60000);
  const {
    positions,
    summary: posSummary,
    isLoading: positionsLoading,
  } = usePortfolioPositions(30000);
  const { trades: recentTrades, loading: tradesLoading } = useRecentTrades(1000);

  const isLoading = analyticsLoading || positionsLoading;



  // Overview metrics (real data)
  // Get initial capital (default to 10000 if not set)
  const INITIAL_CAPITAL = 10000;

  // Calculate actual portfolio value: initial capital + realized P&L + unrealized P&L
  const realizedPnL = analytics?.realizedPnL || 0;
  const unrealizedPnL = posSummary.totalUnrealizedPnL || 0;
  const portfolioValue = INITIAL_CAPITAL + realizedPnL + unrealizedPnL;

  // For day P&L, we'll show unrealized P&L if there are positions, otherwise show today's realized P&L
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysPnL = useMemo(() => {
    if (!analytics?.monthlyReturns || analytics.monthlyReturns.length === 0) return 0;
    const currentMonth = todayStart.toISOString().substring(0, 7);
    const currentMonthData = analytics.monthlyReturns.find((m) => m.month === currentMonth);
    // This is an approximation - ideally we'd have daily P&L
    return currentMonthData ? currentMonthData.pnl / 30 : 0;
  }, [analytics?.monthlyReturns]);

  const dayPnL = positions.length > 0 ? unrealizedPnL : todaysPnL;

  // Total return percentage based on initial capital
  const totalReturnPct = ((portfolioValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;

  // Day P&L percentage
  const dayPnLPct = portfolioValue > 0 ? (dayPnL / portfolioValue) * 100 : 0;

  const winRate = analytics?.winRate || 0;

  // Asset allocation - if no positions, show by symbol performance
  const allocation = useMemo(() => {
    if (positions.length > 0) {
      const total = positions.reduce((s, p) => s + p.marketValue, 0);
      if (total <= 0) return [];
      const colors = [
        '#00C896',
        '#13B981',
        '#0EA5A6',
        '#37C99E',
        '#06796B',
        '#34D399',
        '#10B981',
        '#0891B2',
      ];
      return positions.slice(0, 8).map((p, i) => ({
        name: p.symbol,
        value: +((p.marketValue / total) * 100).toFixed(2),
        color: colors[i % colors.length],
      }));
    } else if (analytics?.performanceBySymbol && analytics.performanceBySymbol.length > 0) {
      // Show top traded symbols by trade count
      const colors = [
        '#00C896',
        '#13B981',
        '#0EA5A6',
        '#37C99E',
        '#06796B',
        '#34D399',
        '#10B981',
        '#0891B2',
      ];
      const topSymbols = analytics.performanceBySymbol.slice(0, 8);
      const totalTrades = topSymbols.reduce((s, p) => s + p.trades, 0);
      return topSymbols.map((p, i) => ({
        name: p.symbol,
        value: +((p.trades / totalTrades) * 100).toFixed(2),
        color: colors[i % colors.length],
      }));
    }
    return [];
  }, [positions, analytics?.performanceBySymbol]);

  // Top historical trades by percentage gain/loss using client-side leg matching (FIFO)
  const topTrades = useMemo(() => {
    if (!recentTrades || recentTrades.length === 0) return { gainers: [], losers: [] };

    const keyFor = (t: TradeRow) => {
      const at = String(t.instrument_type || '').toLowerCase();
      if (at === 'option' && t.legs && Array.isArray(t.legs) && t.legs.length > 0) {
        const leg = t.legs[0]; // Use first leg for key generation
        return `${leg.underlying || t.symbol}_${leg.option_type}_${leg.strike_price}_${leg.expiration_date}`;
      }
      return t.symbol;
    };

    type PosState = { openQty: number; avg: number };
    const states = new Map<string, PosState>();
    const closed: {
      symbol: string;
      side: string;
      entry: number;
      exit: number;
      pct: number;
      type: string;
    }[] = [];

    const sorted = [...recentTrades].sort(
      (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime(),
    );

    for (const t of sorted) {
      const key = keyFor(t);
      // Note: side field not available in new schema, using qty_opened to determine direction
      const side = t.qty_opened > 0 ? 'buy' : 'sell';
      const qty = Number(t.qty_opened) || 0;
      const price = Number(t.avg_open_price) || 0;
      if (!qty || !price) continue;
      const type = String(t.instrument_type || 'equity').toLowerCase();

      const s = states.get(key) || { openQty: 0, avg: 0 };

      if (side === 'buy') {
        if (s.openQty < 0) {
          // closing shorts
          const closeQty = Math.min(qty, Math.abs(s.openQty));
          if (s.avg) {
            const pct = ((s.avg - price) / s.avg) * 100; // short profit if exit lower
            closed.push({ symbol: t.symbol, side, entry: s.avg, exit: price, pct, type });
          }
          s.openQty += closeQty;
          if (s.openQty === 0) s.avg = 0;
          const leftover = qty - closeQty;
          if (leftover > 0) {
            // open new long
            s.avg = price;
            s.openQty += leftover;
          }
        } else {
          // add to/ open long
          const total = s.openQty + qty;
          s.avg = total ? (s.avg * Math.abs(s.openQty) + price * qty) / total : price;
          s.openQty = total;
        }
      } else if (side === 'sell') {
        if (s.openQty > 0) {
          // closing longs
          const closeQty = Math.min(qty, s.openQty);
          if (s.avg) {
            const pct = ((price - s.avg) / s.avg) * 100; // long profit if exit higher
            closed.push({ symbol: t.symbol, side, entry: s.avg, exit: price, pct, type });
          }
          s.openQty -= closeQty;
          if (s.openQty === 0) s.avg = 0;
          const leftover = qty - closeQty;
          if (leftover > 0) {
            // open new short
            s.avg = price;
            s.openQty -= leftover;
          }
        } else {
          // add to/ open short
          const total = Math.abs(s.openQty) + qty;
          s.avg = total ? (s.avg * Math.abs(s.openQty) + price * qty) / total : price;
          s.openQty -= qty;
        }
      }

      states.set(key, s);
    }

    const gainers = closed
      .filter((c) => isFinite(c.pct))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5)
      .map((c) => ({
        symbol: c.symbol,
        entry: c.entry,
        exit: c.exit,
        change: +c.pct.toFixed(2),
        side: c.side,
        type: c.type,
      }));

    const losers = closed
      .filter((c) => isFinite(c.pct))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5)
      .map((c) => ({
        symbol: c.symbol,
        entry: c.entry,
        exit: c.exit,
        change: +c.pct.toFixed(2),
        side: c.side,
        type: c.type,
      }));

    return { gainers, losers };
  }, [recentTrades]);

  // Monthly P&L - ensure proper formatting
  const monthly = useMemo(() => {
    if (!analytics?.monthlyReturns || analytics.monthlyReturns.length === 0) {
      // Generate empty months for current year if no data
      const currentYear = new Date().getFullYear();
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        months.push({
          month: date.toISOString().substring(0, 7),
          pnl: 0,
          trades: 0,
        });
      }
      return months;
    }
    return analytics.monthlyReturns;
  }, [analytics?.monthlyReturns]);

  // Additional performance computations
  const vol = useMemo(() => {
    const series = monthly.map((m) => m.pnl);
    return std(series);
  }, [monthly]);

  const expectancy = useMemo(
    () => calcExpectancy(winRate, analytics?.avgWin || 0, analytics?.avgLoss || 0),
    [winRate, analytics?.avgWin, analytics?.avgLoss],
  );

  // Generate equity curve as candlesticks from monthly P&L data
  const equityCandles = useMemo(() => {
    if (!analytics?.monthlyReturns || analytics.monthlyReturns.length === 0) {
      // Return demo data if no real data
      return genOHLC(INITIAL_CAPITAL, 12, 'Month');
    }

    let runningEquity = INITIAL_CAPITAL;
    const candles: Candle[] = [];

    // Group by period based on available data
    const sortedMonths = [...analytics.monthlyReturns].sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    sortedMonths.forEach((month, idx) => {
      const startEquity = runningEquity;
      const monthPnL = month.pnl || 0;
      const endEquity = startEquity + monthPnL;

      // For OHLC, we'll simulate intra-month volatility based on the final P&L
      // This gives a more realistic view of potential drawdowns/peaks
      const volatility = Math.abs(monthPnL) * 0.5; // Assume 50% of the move as potential volatility

      let high, low;
      if (monthPnL >= 0) {
        // Profitable month - high is above close, low might dip below open
        high = endEquity + volatility * 0.3;
        low = Math.min(startEquity - volatility * 0.2, endEquity - volatility * 0.1);
      } else {
        // Losing month - low is below close, high might peak above open
        high = Math.max(startEquity + volatility * 0.2, endEquity + volatility * 0.1);
        low = endEquity - volatility * 0.3;
      }

      // Ensure high/low are sensible
      high = Math.max(high, Math.max(startEquity, endEquity));
      low = Math.min(low, Math.min(startEquity, endEquity));

      candles.push({
        t: month.month,
        open: startEquity,
        high: high,
        low: low,
        close: endEquity,
        volume: month.trades, // Use trade count as volume
      });

      runningEquity = endEquity;
    });

    return candles;
  }, [analytics?.monthlyReturns]);

  // Pie labels safe percent
  const renderPieLabel = ({ name, percent }: any) =>
    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`;



  return (
    <div
      className="mx-auto w-full max-w=[1400px] px-4 lg:px-6 py-6 lg:py-8"
      role="main"
      aria-label="Trading Analytics Dashboard"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive trading analytics with your real data</p>
        </div>
      </div>

      {/* Overview cards (real) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Account Value"
          value={isLoading ? '—' : formatCurrency(portfolioValue)}
          delta={
            isLoading
              ? undefined
              : positions.length > 0
                ? `${positions.length} open positions`
                : 'All positions closed'
          }
          positive={portfolioValue >= INITIAL_CAPITAL}
          ariaLabel="Total account value"
        />
        <MetricCard
          title="Total P&L"
          value={
            isLoading
              ? '—'
              : `${realizedPnL >= 0 ? '+' : ''}${formatCurrency(Math.abs(realizedPnL))}`
          }
          delta={
            isLoading
              ? undefined
              : `${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}% return`
          }
          positive={realizedPnL >= 0}
          ariaLabel="Total profit and loss"
        />
        <MetricCard
          title="Unrealized P&L"
          value={
            isLoading
              ? '—'
              : positions.length > 0
                ? `${unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(Math.abs(unrealizedPnL))}`
                : 'No open positions'
          }
          delta={
            isLoading
              ? undefined
              : positions.length > 0
                ? `${posSummary.totalUnrealizedPnLPercent.toFixed(2)}%`
                : undefined
          }
          positive={unrealizedPnL >= 0}
          ariaLabel="Unrealized profit and loss"
        />
        <MetricCard
          title="Win Rate"
          value={isLoading ? '—' : `${winRate.toFixed(1)}%`}
          delta={isLoading ? undefined : `${analytics?.totalTrades || 0} trades`}
          positive={winRate >= 50}
          ariaLabel="Win rate"
        />
      </div>

      {/* P&L Chart */}
      <AnalyticsPnl trades={recentTrades} />

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-4 mt-4">
        <Card
          aria-label="Asset allocation"
        >
          <CardHeader className="pb-2">
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>
              Portfolio distribution (by market value)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {allocation.length > 0 ? (
              <ChartContainer
                config={{ alloc: { color: COLORS.gain, label: 'Allocation' } }}
                className="h-[360px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[360px] w-full flex items-center justify-center">
                              <p className="text-muted-foreground text-center">
                {positions.length === 0 ? 'No open positions' : 'No data available'}
              </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance metrics and market movers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card
          className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm xl:col-span-1"
          aria-label="Performance metrics"
        >
          <CardHeader className="pb-2">
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Sharpe, Profit Factor, Drawdown and more
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
                          <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted">
                              <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
              <div className="text-xl font-semibold mt-1">
                  {(analytics?.sharpeRatio || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Volatility (σ)</div>
                <div className="text-xl font-semibold mt-1">{vol.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Max Drawdown</div>
                <div className="text-xl font-semibold mt-1">
                  {(analytics?.maxDrawdown || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Profit Factor</div>
                <div className="text-xl font-semibold mt-1">
                  {(analytics?.profitFactor || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Avg Win</div>
                <div className="text-xl font-semibold mt-1">
                  {formatCurrency(analytics?.avgWin || 0)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Avg Loss</div>
                <div className="text-xl font-semibold mt-1">
                  {formatCurrency(analytics?.avgLoss || 0)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Expectancy</div>
                <div className="text-xl font-semibold mt-1">
                  {formatCurrency(expectancy)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Total Trades</div>
                <div className="text-xl font-semibold mt-1">
                  {analytics?.totalTrades || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm"
          aria-label="Top winning trades"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                            <CardTitle>Top Winners</CardTitle>
            <CardDescription>Best trades by % gain</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-[#00C896]" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {topTrades.gainers.length > 0 ? (
                topTrades.gainers.map((t, idx) => (
                  <div
                    key={`${t.symbol}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-md bg-[#2D2D2D] hover:bg-[#323232] transition-colors"
                    role="listitem"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#00C896]" />
                      <div>
                        <span className="text-white font-medium">{t.symbol}</span>
                        <span className="text-[#9CA3AF] text-xs ml-1">
                          {t.type === 'option'
                            ? 'OPT'
                            : t.type === 'futures'
                              ? 'FUT'
                              : t.type === 'crypto'
                                ? 'CRYPTO'
                                : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00C896] text-sm font-semibold">+{t.change}%</div>
                      <div className="text-[#9CA3AF] text-xs">
                        {t.side === 'buy' ? 'Long' : 'Short'}: ${t.entry.toFixed(2)} → $
                        {t.exit.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#9CA3AF] py-4">No winning trades yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm"
          aria-label="Top losing trades"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Biggest Losses</CardTitle>
                <CardDescription className="text-[#9CA3AF]">Worst trades by % loss</CardDescription>
              </div>
              <TrendingDown className="h-5 w-5 text-[#FF6B6B]" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {topTrades.losers.length > 0 ? (
                topTrades.losers.map((t, idx) => (
                  <div
                    key={`${t.symbol}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-md bg-[#2D2D2D] hover:bg-[#323232] transition-colors"
                    role="listitem"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#FF6B6B]" />
                      <div>
                        <span className="text-white font-medium">{t.symbol}</span>
                        <span className="text-[#9CA3AF] text-xs ml-1">
                          {t.type === 'option'
                            ? 'OPT'
                            : t.type === 'futures'
                              ? 'FUT'
                              : t.type === 'crypto'
                                ? 'CRYPTO'
                                : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#FF6B6B] text-sm font-semibold">{t.change}%</div>
                      <div className="text-[#9CA3AF] text-xs">
                        {t.side === 'buy' ? 'Long' : 'Short'}: ${t.entry.toFixed(2)} → $
                        {t.exit.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#9CA3AF] py-4">No losing trades yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions and Monthly P&L */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card
          className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm"
          aria-label="Recent transactions"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Buy/Sell history with performance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#9CA3AF]">Date</TableHead>
                    <TableHead className="text-[#9CA3AF]">Symbol</TableHead>
                    <TableHead className="text-[#9CA3AF]">Side</TableHead>
                    <TableHead className="text-[#9CA3AF]">Qty</TableHead>
                    <TableHead className="text-[#9CA3AF]">Price</TableHead>
                    <TableHead className="text-[#9CA3AF]">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[#9CA3AF]">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {!tradesLoading && recentTrades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[#9CA3AF]">
                        No trades found.
                      </TableCell>
                    </TableRow>
                  )}
                  {recentTrades.slice(0, 20).map((t) => {
                    const isClosed = !!(t.avg_close_price && t.closed_at);
                    const assetType = String(t.instrument_type || 'equity').toLowerCase();
                    const mult = assetType === 'option'
                      ? 100
                      : assetType === 'futures'
                        ? 1
                        : 1;
                    const pnl = isClosed
                      ? (t.qty_opened > 0
                          ? t.avg_close_price! - t.avg_open_price
                          : t.avg_open_price - t.avg_close_price!) *
                        t.qty_opened *
                        mult
                      : 0;
                    return (
                      <TableRow key={t.id} className="hover:bg-[#2D2D2D]/70">
                        <TableCell className="text-white">
                          {new Date(t.opened_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-white font-medium">{t.symbol}</TableCell>
                        <TableCell
                          className={
                            t.qty_opened > 0 ? 'text-[#00C896]' : 'text-[#FF6B6B]'
                          }
                        >
                          {t.qty_opened > 0 ? 'BUY' : 'SELL'}
                        </TableCell>
                        <TableCell className="text-white">{t.qty_opened}</TableCell>
                        <TableCell className="text-white">
                          {formatCurrency(t.avg_open_price)}
                        </TableCell>
                        <TableCell className={pnl >= 0 ? 'text-[#00C896]' : 'text-[#FF6B6B]'}>
                          {isClosed
                            ? `${pnl >= 0 ? '+' : ''}${formatCurrency(Math.abs(pnl))}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {recentTrades.length > 20 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-4">
                        <a
                          href="/dashboard/trade-history"
                          className="inline-block px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                        >
                          View all trade history ({recentTrades.length} total)
                        </a>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm"
          aria-label="Monthly PnL"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Monthly P&L</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Profit and loss by month</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthly} margin={{ top: 10, left: 0, right: 8, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} opacity={0.25} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: COLORS.subtext, fontSize: 11 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                  tickFormatter={(value) => {
                    // Format as MMM-YY
                    const [year, month] = value.split('-');
                    const monthNames = [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ];
                    return `${monthNames[parseInt(month) - 1]}-${year.slice(2)}`;
                  }}
                />
                <YAxis
                  tick={{ fill: COLORS.subtext, fontSize: 11 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                  width={64}
                  tickFormatter={(value) =>
                    `${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`
                  }
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthly.map((d, i) => (
                    <Cell key={`cell-${i}`} fill={(d.pnl || 0) >= 0 ? COLORS.gain : COLORS.loss} />
                  ))}
                </Bar>
                <RTooltip
                  contentStyle={{
                    background: COLORS.bgDark,
                    border: `1px solid ${COLORS.bgMuted}`,
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-');
                    const monthNames = [
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* New Analytics Components */}
      <div className="space-y-6 mt-6">
        {/* Tag and Symbol Analytics Tables */}
        <AnalyticsTables />

        {/* Expectancy Chart */}
        <ExpectancyChart />

        {/* Calendar Heatmap */}
        <CalendarHeatmap 
          data={[]} 
          isLoading={false}
        />

        {/* Drawdown Recovery Table */}
        <DrawdownRecoveryTable />
      </div>
    </div>
  );
}
