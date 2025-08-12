"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
    Customized,
} from "recharts"
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { usePortfolioAnalytics, usePortfolioPositions } from "@/hooks/usePortfolio"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase"

// --- THEME ---
const COLORS = {
  bgDark: "#1E1E1E",
  bgElevated: "#2D2D2D",
  bgMuted: "#404040",
  text: "#E5E7EB",
  subtext: "#9CA3AF",
  gain: "#00C896",
  loss: "#FF6B6B",
  grid: "#404040",
}

// --- TYPES ---
interface Candle {
  t: string // label for X-axis
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface TradeRow {
  id: string
  symbol: string
  side: string
  quantity: number
  entry_price: number
  entry_date: string
  exit_price?: number | null
  exit_date?: string | null
  status?: string
  asset_type?: string
  multiplier?: number | null
}

// --- HELPERS ---
function formatCurrency(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function randomWalk(start: number, steps: number, scale = 1.0) {
  const arr: number[] = [start]
  for (let i = 1; i < steps; i++) {
    const drift = (Math.random() - 0.5) * scale
    const prev = arr[i - 1]
    arr.push(Math.max(1, prev * (1 + drift / 100)))
  }
  return arr
}

function genOHLC(base: number, count: number, labelPrefix: string): Candle[] {
  const closes = randomWalk(base, count, 0.9)
  const candles: Candle[] = closes.map((c, i) => {
    const prev = i > 0 ? closes[i - 1] : c * (1 - (Math.random() - 0.5) * 0.01)
    const open = prev
    const close = c
    const spread = Math.max(0.05, Math.abs(close - open) * (0.7 + Math.random() * 0.6))
    const high = Math.max(open, close) + spread
    const low = Math.min(open, close) - spread
    return {
      t: `${labelPrefix}-${i + 1}`,
      open,
      high,
      low,
      close,
      volume: Math.round(1000 + Math.random() * 10000),
    }
  })
  return candles
}

function mean(a: number[]) {
  if (!a.length) return 0
  return a.reduce((s, v) => s + v, 0) / a.length
}

function std(a: number[]) {
  if (a.length < 2) return 0
  const m = mean(a)
  const v = mean(a.map((x) => (x - m) ** 2))
  return Math.sqrt(v)
}

function calcExpectancy(winRatePct: number, avgWin: number, avgLoss: number) {
  const p = winRatePct / 100
  const q = 1 - p
  return p * avgWin - q * avgLoss
}

// --- REUSABLE UI ---
function MetricCard({ title, value, delta, positive = true, ariaLabel }: { title: string; value: string; delta?: string; positive?: boolean; ariaLabel?: string }) {
  return (
    <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm hover:shadow-md transition-shadow" aria-label={ariaLabel || title}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#9CA3AF]">{title}</CardTitle>
        {positive ? (
          <TrendingUp className="h-4 w-4 text-[#00C896]" />
        ) : (
          <TrendingDown className="h-4 w-4 text-[#FF6B6B]" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-white">{value}</div>
        {delta && (
          <p className="text-xs text-[#9CA3AF] mt-1">
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
  )
}

// --- CANDLESTICK RENDERER USING Recharts Customized (kept for price chart aesthetic) ---
function CandlestickSeries({ data, colorUp, colorDown }: { data: Candle[]; colorUp: string; colorDown: string }) {
  return (
    <Customized
      content={(props: any) => {
        const { xAxisMap, yAxisMap, offset } = props
        const xKey = Object.keys(xAxisMap)[0]
        const yKey = Object.keys(yAxisMap)[0]
        const xScale = xAxisMap[xKey].scale
        const yScale = yAxisMap[yKey].scale
        const left = offset?.left || 0
        const top = offset?.top || 0

        let cw = 6
        if (data.length > 1) {
          const x0 = xScale(data[0].t)
          const x1 = xScale(data[1].t)
          const gap = Math.abs(x1 - x0)
          cw = Math.max(3, Math.min(10, Math.floor(gap * 0.6)))
        }

        return (
          <g aria-label="candlestick-series">
            {data.map((d, idx) => {
              const x = xScale(d.t) + left
              const yOpen = yScale(d.open) + top
              const yClose = yScale(d.close) + top
              const yHigh = yScale(d.high) + top
              const yLow = yScale(d.low) + top
              const up = d.close >= d.open
              const fill = up ? colorUp : colorDown
              const bodyY = Math.min(yOpen, yClose)
              const bodyH = Math.max(1, Math.abs(yClose - yOpen))
              return (
                <g key={idx}>
                  <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={fill} strokeWidth={1} opacity={0.9} />
                  <rect x={x - cw / 2} y={bodyY} width={cw} height={bodyH} fill={fill} rx={1} ry={1} opacity={0.9} />
                </g>
              )
            })}
          </g>
        )
      }}
    />
  )
}

// Fetch recent trades from API (server-authenticated)
function useRecentTrades(limit: number = 15) {
  const { user } = useAuth()
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function fetchTrades() {
      try {
        if (!user) {
          setTrades([])
          setLoading(false)
          return
        }
        setLoading(true)
        const { data, error } = await supabase
          .from("trades")
          .select("id, symbol, side, quantity, entry_price, entry_date, exit_price, exit_date, status, asset_type, multiplier")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false })
          .limit(limit)
        if (error) throw error
        if (!mounted) return
        setTrades((data as any) || [])
      } catch (e: any) {
        if (mounted) setError(e.message || "Error fetching trades")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchTrades()
    const id = setInterval(fetchTrades, 30000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [user?.id, limit])

  return { trades, loading, error }
}

export function AnalyticsPage() {
  // Use real analytics + positions
  const { analytics, isLoading: analyticsLoading } = usePortfolioAnalytics(60000)
  const { positions, summary: posSummary, isLoading: positionsLoading } = usePortfolioPositions(30000)
  const { trades: recentTrades, loading: tradesLoading } = useRecentTrades(15)

  const isLoading = analyticsLoading || positionsLoading

  // Overview metrics (real data)
  const portfolioValue = posSummary.totalMarketValue || 0
  const dayPnL = posSummary.totalUnrealizedPnL || 0
  const totalCost = posSummary.totalCost || 0
  const totalReturnPct = totalCost !== 0 ? (((portfolioValue + (analytics?.realizedPnL || 0)) - totalCost) / Math.abs(totalCost)) * 100 : 0

  const winRate = analytics?.winRate || 0

  // Asset allocation - if no positions, show by symbol performance
  const allocation = useMemo(() => {
    if (positions.length > 0) {
      const total = positions.reduce((s, p) => s + p.marketValue, 0)
      if (total <= 0) return []
      const colors = ["#00C896", "#13B981", "#0EA5A6", "#37C99E", "#06796B", "#34D399", "#10B981", "#0891B2"]
      return positions
        .slice(0, 8)
        .map((p, i) => ({ name: p.symbol, value: +(p.marketValue / total * 100).toFixed(2), color: colors[i % colors.length] }))
    } else if (analytics?.performanceBySymbol && analytics.performanceBySymbol.length > 0) {
      // Show top traded symbols by trade count
      const colors = ["#00C896", "#13B981", "#0EA5A6", "#37C99E", "#06796B", "#34D399", "#10B981", "#0891B2"]
      const topSymbols = analytics.performanceBySymbol.slice(0, 8)
      const totalTrades = topSymbols.reduce((s, p) => s + p.trades, 0)
      return topSymbols.map((p, i) => ({ 
        name: p.symbol, 
        value: +(p.trades / totalTrades * 100).toFixed(2), 
        color: colors[i % colors.length] 
      }))
    }
    return []
  }, [positions, analytics?.performanceBySymbol])

  // Market movers from current positions by % change (unrealizedPnLPercent)
  const marketMovers = useMemo(() => {
    const sorted = [...positions].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
    const gainers = sorted.filter(p => p.unrealizedPnLPercent > 0).slice(0, 5).map(p => ({ symbol: p.symbol, price: p.currentPrice, change: +p.unrealizedPnLPercent.toFixed(2) }))
    const losers = [...positions].sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent).filter(p => p.unrealizedPnLPercent < 0).slice(0, 5).map(p => ({ symbol: p.symbol, price: p.currentPrice, change: +p.unrealizedPnLPercent.toFixed(2) }))
    return { gainers, losers }
  }, [positions])

  // Monthly P&L - ensure proper formatting
  const monthly = useMemo(() => {
    if (!analytics?.monthlyReturns || analytics.monthlyReturns.length === 0) {
      // Generate empty months for current year if no data
      const currentYear = new Date().getFullYear()
      const months = []
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1)
        months.push({
          month: date.toISOString().substring(0, 7),
          pnl: 0,
          trades: 0
        })
      }
      return months
    }
    return analytics.monthlyReturns
  }, [analytics?.monthlyReturns])

  // Additional performance computations
  const vol = useMemo(() => {
    const series = monthly.map(m => m.pnl)
    return std(series)
  }, [monthly])

  const expectancy = useMemo(() => calcExpectancy(winRate, analytics?.avgWin || 0, analytics?.avgLoss || 0), [winRate, analytics?.avgWin, analytics?.avgLoss])

  // Candlestick demo (kept for price chart aesthetic); this does not use real OHLC yet
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "All">("All")
  const baseCandles = useMemo(() => {
    switch (timeframe) {
      case "1D":
        return genOHLC(100, 78, "10:00")
      case "1W":
        return genOHLC(100, 5 * 8, "D")
      case "1M":
        return genOHLC(100, 22, "D")
      case "3M":
        return genOHLC(100, 66, "D")
      case "1Y":
        return genOHLC(100, 52, "W")
      case "All":
        return genOHLC(100, 260, "W") // 5 years of weekly data
      default:
        return genOHLC(100, 22, "D")
    }
  }, [timeframe])
  const [liveOHLC, setLiveOHLC] = useState<Candle[]>(baseCandles)
  useEffect(() => setLiveOHLC(baseCandles), [baseCandles])
  useEffect(() => {
    if (timeframe !== "1D") return
    const id = setInterval(() => {
      setLiveOHLC(prev => {
        if (!prev.length) return prev
        const last = prev[prev.length - 1]
        const move = (Math.random() - 0.5) * 0.4
        const close = Math.max(1, last.close * (1 + move / 100))
        const high = Math.max(last.high, close + Math.random() * 0.1)
        const low = Math.min(last.low, close - Math.random() * 0.1)
        const updated = [...prev]
        updated[updated.length - 1] = { ...last, close, high, low }
        return updated
      })
    }, 1800)
    return () => clearInterval(id)
  }, [timeframe])
  const candles = timeframe === "1D" ? liveOHLC : baseCandles

  // Pie labels safe percent
  const renderPieLabel = ({ name, percent }: any) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`

  return (
    <div className="mx-auto w-full max-w=[1400px] px-4 lg:px-6 py-6 lg:py-8" role="main" aria-label="Trading Analytics Dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-[#9CA3AF]">Comprehensive trading analytics with your real data</p>
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Select timeframe">
          {["1D","1W","1M","3M","1Y","All"].map(tf => (
            <button key={tf}
              role="tab"
              aria-selected={timeframe === tf}
              tabIndex={0}
              onClick={() => setTimeframe(tf as any)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[#00C896] ${
                timeframe === tf ? "bg-[#2D2D2D] text-white" : "bg-[#1E1E1E] text-[#9CA3AF] hover:text-white"
              }`}
            >{tf}</button>
          ))}
        </div>
      </div>

      {/* Overview cards (real) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Portfolio Value"
          value={isLoading ? "—" : formatCurrency(portfolioValue)}
          delta={isLoading ? undefined : `${positions.length} positions`}
          positive
          ariaLabel="Total portfolio value"
        />
        <MetricCard
          title="Day P&L"
          value={isLoading ? "—" : `${dayPnL >= 0 ? "+" : ""}${formatCurrency(Math.abs(dayPnL))}`}
          delta={isLoading ? undefined : `${posSummary.totalUnrealizedPnLPercent.toFixed(2)}%`}
          positive={dayPnL >= 0}
          ariaLabel="Day profit and loss"
        />
        <MetricCard
          title="Total Return"
          value={isLoading ? "—" : `${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct.toFixed(2)}%`}
          delta={isLoading ? undefined : `Realized: ${formatCurrency(analytics?.realizedPnL || 0)}`}
          positive={totalReturnPct >= 0}
          ariaLabel="Total return percentage"
        />
        <MetricCard
          title="Win Rate"
          value={isLoading ? "—" : `${winRate.toFixed(1)}%`}
          delta={isLoading ? undefined : `${analytics?.totalTrades || 0} trades`}
          positive={winRate >= 50}
          ariaLabel="Win rate"
        />
      </div>

      {/* Charts and Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm xl:col-span-2" aria-label="Price chart">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Price Candlestick</CardTitle>
                <CardDescription className="text-[#9CA3AF]">Interactive OHLC with multiple timeframes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer
              config={{
                up: { color: COLORS.gain, label: "Up" },
                down: { color: COLORS.loss, label: "Down" },
              }}
              className="h-[360px] w-full"
            >
              <ComposedChart data={candles} margin={{ top: 10, left: 0, right: 12, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} opacity={0.25} vertical={false} />
                <XAxis dataKey="t" tick={{ fill: COLORS.subtext, fontSize: 12 }} axisLine={{ stroke: COLORS.grid }} tickLine={false} minTickGap={22} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: COLORS.subtext, fontSize: 12 }} axisLine={{ stroke: COLORS.grid }} tickLine={false} width={64} />
                {/* Transparent Bar to enable tooltip hitboxes */}
                <Bar dataKey="close" fill="transparent" barSize={8} />
                <CandlestickSeries data={candles} colorUp={COLORS.gain} colorDown={COLORS.loss} />
                <ChartTooltip
                  cursor={{ stroke: COLORS.grid, strokeOpacity: 0.35 }}
                  content={
                    <ChartTooltipContent
                      formatter={(value: any, _name: any, item: any) => {
                        const d: Candle = item?.payload
                        if (!d) return null
                        return (
                          <div className="grid gap-1">
                            <div className="text-xs text-[#9CA3AF]">{d.t}</div>
                            <div className="grid grid-cols-2 gap-x-4 text-xs">
                              <span className="text-[#9CA3AF]">Open</span>
                              <span className="text-white justify-self-end">{d.open.toFixed(2)}</span>
                              <span className="text-[#9CA3AF]">High</span>
                              <span className="text-white justify-self-end">{d.high.toFixed(2)}</span>
                              <span className="text-[#9CA3AF]">Low</span>
                              <span className="text-white justify-self-end">{d.low.toFixed(2)}</span>
                              <span className="text-[#9CA3AF]">Close</span>
                              <span className="text-white justify-self-end">{d.close.toFixed(2)}</span>
                            </div>
                          </div>
                        )
                      }}
                    />
                  }
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Asset allocation">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Asset Allocation</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Portfolio distribution (by market value)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {allocation.length > 0 ? (
              <ChartContainer
                config={{ alloc: { color: COLORS.gain, label: "Allocation" } }}
                className="h-[360px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} labelLine={false} label={renderPieLabel}>
                      {allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={{ background: COLORS.bgDark, border: `1px solid ${COLORS.bgMuted}` }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[360px] w-full flex items-center justify-center">
                <p className="text-[#9CA3AF] text-center">
                  {positions.length === 0 ? "No open positions" : "No data available"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance metrics and market movers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm xl:col-span-1" aria-label="Performance metrics">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Sharpe, Profit Factor, Drawdown and more</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Sharpe Ratio</div>
                <div className="text-xl font-semibold text-white mt-1">{(analytics?.sharpeRatio || 0).toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Volatility (σ)</div>
                <div className="text-xl font-semibold text-white mt-1">{vol.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Max Drawdown</div>
                <div className="text-xl font-semibold text-white mt-1">{(analytics?.maxDrawdown || 0).toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Profit Factor</div>
                <div className="text-xl font-semibold text-white mt-1">{(analytics?.profitFactor || 0).toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Avg Win</div>
                <div className="text-xl font-semibold text-white mt-1">{formatCurrency(analytics?.avgWin || 0)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Avg Loss</div>
                <div className="text-xl font-semibold text-white mt-1">{formatCurrency(analytics?.avgLoss || 0)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Expectancy</div>
                <div className="text-xl font-semibold text-white mt-1">{formatCurrency(expectancy)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Total Trades</div>
                <div className="text-xl font-semibold text-white mt-1">{analytics?.totalTrades || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Market movers gainers">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Top Gainers</CardTitle>
                <CardDescription className="text-[#9CA3AF]">Based on unrealized % change</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-[#00C896]" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {marketMovers.gainers.map((m) => (
                <div key={m.symbol} className="flex items-center justify-between p-2 rounded-md bg-[#2D2D2D] hover:bg-[#323232] transition-colors" role="listitem">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#00C896]" />
                    <span className="text-white font-medium">{m.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">{formatCurrency(m.price)}</div>
                    <div className="text-[#00C896] text-xs">+{m.change}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Market movers losers">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Top Losers</CardTitle>
                <CardDescription className="text-[#9CA3AF]">Based on unrealized % change</CardDescription>
              </div>
              <TrendingDown className="h-5 w-5 text-[#FF6B6B]" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {marketMovers.losers.map((m) => (
                <div key={m.symbol} className="flex items-center justify-between p-2 rounded-md bg-[#2D2D2D] hover:bg-[#323232] transition-colors" role="listitem">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#FF6B6B]" />
                    <span className="text-white font-medium">{m.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">{formatCurrency(m.price)}</div>
                    <div className="text-[#FF6B6B] text-xs">{m.change}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions and Monthly P&L */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Recent transactions">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Buy/Sell history with performance</CardDescription>
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
                    <TableRow><TableCell colSpan={6} className="text-center text-[#9CA3AF]">Loading...</TableCell></TableRow>
                  )}
                  {!tradesLoading && recentTrades.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-[#9CA3AF]">No trades found.</TableCell></TableRow>
                  )}
                  {recentTrades.map((t) => {
                    const isClosed = !!(t.exit_price && t.exit_date)
                    const assetType = String(t.asset_type || 'stock').toLowerCase()
                    const mult = t.multiplier != null ? Number(t.multiplier) : (assetType === 'option' ? 100 : assetType === 'futures' ? 1 : 1)
                    const pnl = isClosed
                      ? (t.side === 'buy' ? (t.exit_price! - t.entry_price) : (t.entry_price - t.exit_price!)) * t.quantity * mult
                      : 0
                    return (
                      <TableRow key={t.id} className="hover:bg-[#2D2D2D]/70">
                        <TableCell className="text-white">{new Date(t.entry_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-white font-medium">{t.symbol}</TableCell>
                        <TableCell className={t.side?.toUpperCase() === "BUY" ? "text-[#00C896]" : "text-[#FF6B6B]"}>{t.side?.toUpperCase()}</TableCell>
                        <TableCell className="text-white">{t.quantity}</TableCell>
                        <TableCell className="text-white">{formatCurrency(t.entry_price)}</TableCell>
                        <TableCell className={pnl >= 0 ? "text-[#00C896]" : "text-[#FF6B6B]"}>
                          {isClosed ? `${pnl >= 0 ? "+" : ""}${formatCurrency(Math.abs(pnl))}` : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Monthly PnL">
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
                    const [year, month] = value.split('-')
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    return `${monthNames[parseInt(month) - 1]}-${year.slice(2)}`
                  }}
                />
                <YAxis 
                  tick={{ fill: COLORS.subtext, fontSize: 11 }} 
                  axisLine={{ stroke: COLORS.grid }} 
                  tickLine={false} 
                  width={64}
                  tickFormatter={(value) => `${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthly.map((d, i) => (
                    <Cell key={`cell-${i}`} fill={(d.pnl || 0) >= 0 ? COLORS.gain : COLORS.loss} />
                  ))}
                </Bar>
                <RTooltip 
                  contentStyle={{ background: COLORS.bgDark, border: `1px solid ${COLORS.bgMuted}` }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-')
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                    return `${monthNames[parseInt(month) - 1]} ${year}`
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Equity curve (derived from monthly cumulative P&L) */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Equity trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Equity Curve</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Cumulative realized P&L over months</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {(() => {
              let cum = 0
              const data = monthly.map(m => ({ 
                t: m.month, 
                equity: (cum += (m.pnl || 0)),
                monthlyPnL: m.pnl || 0
              }))
              
              // Add initial point if we have data
              if (data.length > 0 && data[0].equity !== 0) {
                const firstMonth = data[0].t
                const [year, month] = firstMonth.split('-')
                const prevMonth = new Date(parseInt(year), parseInt(month) - 2, 1)
                data.unshift({
                  t: prevMonth.toISOString().substring(0, 7),
                  equity: 0,
                  monthlyPnL: 0
                })
              }
              
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data} margin={{ top: 10, left: 0, right: 8, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.grid} opacity={0.25} vertical={false} />
                    <XAxis 
                      dataKey="t" 
                      tick={{ fill: COLORS.subtext, fontSize: 11 }} 
                      axisLine={{ stroke: COLORS.grid }} 
                      tickLine={false} 
                      minTickGap={22}
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-')
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        return `${monthNames[parseInt(month) - 1]}-${year.slice(2)}`
                      }}
                    />
                    <YAxis 
                      tick={{ fill: COLORS.subtext, fontSize: 11 }} 
                      axisLine={{ stroke: COLORS.grid }} 
                      tickLine={false} 
                      width={64} 
                      tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke={COLORS.gain} 
                      strokeWidth={2} 
                      dot={{ fill: COLORS.gain, r: 3 }} 
                      activeDot={{ r: 5 }}
                    />
                    <RTooltip 
                      contentStyle={{ background: COLORS.bgDark, border: `1px solid ${COLORS.bgMuted}` }}
                      formatter={(value: any, name: string) => {
                        if (name === 'equity') return [`Cumulative: ${formatCurrency(Number(value))}`, '']
                        return [formatCurrency(Number(value)), name]
                      }}
                      labelFormatter={(label) => {
                        const [year, month] = label.split('-')
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                        return `${monthNames[parseInt(month) - 1]} ${year}`
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
