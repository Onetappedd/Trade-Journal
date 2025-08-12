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

interface Txn {
  id: string
  date: string
  symbol: string
  side: "BUY" | "SELL"
  qty: number
  price: number
  pnl: number
}

// --- HELPERS / MOCK DATA ---
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

function formatCurrency(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

// Basic stats
function calcReturns(data: Candle[]): number[] {
  const r: number[] = []
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].close
    const curr = data[i].close
    r.push((curr - prev) / prev)
  }
  return r
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

function maxDrawdown(data: Candle[]) {
  let peak = data[0]?.close || 1
  let maxDD = 0
  for (const d of data) {
    if (d.close > peak) peak = d.close
    const dd = (peak - d.close) / peak
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}

// Correlation matrix (simple Pearson)
function correlationMatrix(series: Record<string, number[]>): Record<string, Record<string, number>> {
  const keys = Object.keys(series)
  const out: Record<string, Record<string, number>> = {}
  for (const i of keys) {
    out[i] = {}
    for (const j of keys) {
      const a = series[i]
      const b = series[j]
      const len = Math.min(a.length, b.length)
      const aa = a.slice(0, len)
      const bb = b.slice(0, len)
      const ma = mean(aa)
      const mb = mean(bb)
      const cov = mean(aa.map((x, k) => (x - ma) * (bb[k] - mb)))
      const denom = std(aa) * std(bb)
      out[i][j] = denom ? cov / denom : 0
    }
  }
  return out
}

// Value at Risk (historical, 95%)
function historicalVaR(returns: number[], confidence = 0.95) {
  if (!returns.length) return 0
  const sorted = [...returns].sort((a, b) => a - b)
  const idx = Math.floor((1 - confidence) * sorted.length)
  return Math.abs(sorted[idx])
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

// --- CANDLESTICK RENDERER USING Recharts Customized ---
function CandlestickSeries({ data, colorUp, colorDown }: { data: Candle[]; colorUp: string; colorDown: string }) {
  // This component is used inside <Customized content={...} /> and gets chart context props
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

        // Estimate candle width from x spacing
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

export function AnalyticsPage() {
  // Timeframes
  const TIMEFRAMES = [
    { key: "1D", label: "1D" },
    { key: "1W", label: "1W" },
    { key: "1M", label: "1M" },
    { key: "3M", label: "3M" },
    { key: "1Y", label: "1Y" },
  ] as const
  type TF = typeof TIMEFRAMES[number]["key"]

  const [timeframe, setTimeframe] = useState<TF>("1M")

  // Generate mock OHLC by timeframe
  const ohlc = useMemo(() => {
    switch (timeframe) {
      case "1D":
        return genOHLC(100, 78, "10:00") // minute-ish
      case "1W":
        return genOHLC(100, 5 * 8, "D")
      case "1M":
        return genOHLC(100, 22, "D")
      case "3M":
        return genOHLC(100, 66, "D")
      case "1Y":
        return genOHLC(100, 52, "W")
      default:
        return genOHLC(100, 22, "D")
    }
  }, [timeframe])

  // Simulate realtime ticks for 1D
  const [liveOHLC, setLiveOHLC] = useState<Candle[]>(ohlc)
  useEffect(() => setLiveOHLC(ohlc), [ohlc])
  useEffect(() => {
    if (timeframe !== "1D") return
    const id = setInterval(() => {
      setLiveOHLC((prev) => {
        if (prev.length === 0) return prev
        const last = prev[prev.length - 1]
        // extend or add a new candle
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

  const candles = timeframe === "1D" ? liveOHLC : ohlc

  // Derived metrics
  const rets = useMemo(() => calcReturns(candles), [candles])
  const m = useMemo(() => {
    const mdd = maxDrawdown(candles)
    const mu = mean(rets)
    const sigma = std(rets)
    const scale = timeframe === "1D" ? Math.sqrt(252 * 78) : timeframe === "1Y" ? Math.sqrt(52) : Math.sqrt(252)
    const sharpe = sigma ? (mu / sigma) * scale : 0
    const vol = sigma * scale
    return { mdd, sharpe, vol }
  }, [rets, candles, timeframe])

  // Portfolio overview mock
  const totalValue = 125000 + Math.round((candles[candles.length - 1]?.close || 100) * 13)
  const dayPnL = (rets[rets.length - 1] || 0) * totalValue * 0.2
  const totalReturnPct = ((candles[candles.length - 1]?.close || 100) / (candles[0]?.close || 100) - 1) * 100

  // Asset allocation (mock)
  const allocation = [
    { name: "AAPL", value: 28, color: "#37C99E" },
    { name: "SPY", value: 22, color: "#00C896" },
    { name: "NVDA", value: 18, color: "#13B981" },
    { name: "TSLA", value: 16, color: "#0EA5A6" },
    { name: "CASH", value: 16, color: "#06796B" },
  ]

  // Recent transactions (mock)
  const recentTxns: Txn[] = useMemo(() => {
    const syms = ["AAPL", "NVDA", "TSLA", "AMZN", "MSFT", "SPY"]
    const list: Txn[] = []
    for (let i = 0; i < 12; i++) {
      const side = Math.random() > 0.5 ? "BUY" : "SELL"
      const qty = Math.ceil(Math.random() * 100)
      const price = +(80 + Math.random() * 300).toFixed(2)
      const pnl = +(Math.random() * (Math.random() > 0.5 ? 1 : -1) * 400).toFixed(2)
      list.push({
        id: `${i}`,
        date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
        symbol: syms[i % syms.length],
        side,
        qty,
        price,
        pnl,
      })
    }
    return list
  }, [])

  const winRate = useMemo(() => {
    const wins = recentTxns.filter((t) => t.pnl >= 0).length
    return recentTxns.length ? (wins / recentTxns.length) * 100 : 0
  }, [recentTxns])

  // Market movers (mock)
  const marketMovers = useMemo(() => {
    const syms = ["AAPL", "NVDA", "TSLA", "AMD", "META", "GOOGL", "AMZN", "NFLX"]
    const movers = syms.map((s) => ({
      symbol: s,
      change: +(Math.random() * 8 * (Math.random() > 0.5 ? 1 : -1)).toFixed(2),
      price: +(80 + Math.random() * 400).toFixed(2),
    }))
    movers.sort((a, b) => b.change - a.change)
    return {
      gainers: movers.slice(0, 5),
      losers: movers.slice(-5).reverse(),
    }
  }, [timeframe])

  // Risk analytics (mock)
  const series: Record<string, number[]> = useMemo(() => {
    const keys = ["AAPL", "NVDA", "TSLA", "MSFT", "SPY"]
    const out: Record<string, number[]> = {}
    for (const k of keys) {
      const c = genOHLC(100 + Math.random() * 40, 60, k)
      out[k] = calcReturns(c)
    }
    return out
  }, [])
  const corr = useMemo(() => correlationMatrix(series), [series])
  const beta = useMemo(() => {
    const rAsset = series["AAPL"] || []
    const rMkt = series["SPY"] || []
    const n = Math.min(rAsset.length, rMkt.length)
    if (n < 2) return 0
    const a = rAsset.slice(0, n)
    const mkt = rMkt.slice(0, n)
    const cov = mean(a.map((x, i) => (x - mean(a)) * (mkt[i] - mean(mkt))))
    const varM = std(mkt) ** 2
    return varM ? cov / varM : 0
  }, [series])
  const var95 = useMemo(() => historicalVaR(rets, 0.95), [rets])

  // Pie labels safe percent check to satisfy tests
  const renderPieLabel = ({ name, percent }: any) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6 py-6 lg:py-8" role="main" aria-label="Trading Analytics Dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-[#9CA3AF]">Comprehensive trading analytics and performance insights</p>
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Select timeframe">
          {([
            "1D",
            "1W",
            "1M",
            "3M",
            "1Y",
          ] as TF[]).map((tf) => (
            <button
              key={tf}
              role="tab"
              aria-selected={timeframe === tf}
              tabIndex={0}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[#00C896] ${
                timeframe === tf ? "bg-[#2D2D2D] text-white" : "bg-[#1E1E1E] text-[#9CA3AF] hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Portfolio Value" value={formatCurrency(totalValue)} delta="+$1,842 today" positive={dayPnL >= 0} ariaLabel="Total portfolio value" />
        <MetricCard title="Daily P&L" value={`${dayPnL >= 0 ? "+" : ""}${formatCurrency(Math.abs(dayPnL))}`} delta={`${((rets[rets.length - 1] || 0) * 100).toFixed(2)}%`} positive={dayPnL >= 0} ariaLabel="Daily profit and loss" />
        <MetricCard title="Total Return" value={`${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct.toFixed(2)}%`} delta="Since inception" positive={totalReturnPct >= 0} ariaLabel="Total return percentage" />
        <MetricCard title="Win Rate" value={`${winRate.toFixed(1)}%`} delta="Last 30 trades" positive={winRate >= 50} ariaLabel="Win rate" />
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
            <CardDescription className="text-[#9CA3AF]">Portfolio distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
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
          </CardContent>
        </Card>
      </div>

      {/* Performance metrics and market movers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Performance metrics">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Sharpe, Volatility, Max Drawdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Sharpe Ratio</div>
                <div className="text-xl font-semibold text-white mt-1">{m.sharpe.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Volatility</div>
                <div className="text-xl font-semibold text-white mt-1">{(m.vol * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Max Drawdown</div>
                <div className="text-xl font-semibold text-white mt-1">{(m.mdd * 100).toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Market movers gainers">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Top Gainers</CardTitle>
                <CardDescription className="text-[#9CA3AF]">Live market leaders</CardDescription>
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
                <CardDescription className="text-[#9CA3AF]">Underperformers</CardDescription>
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

      {/* Risk analytics and transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm xl:col-span-2" aria-label="Risk analytics">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Risk Analytics</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Beta, correlations, and VaR</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Beta vs SPY</div>
                <div className="text-xl font-semibold text-white mt-1">{beta.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">VaR 95%</div>
                <div className="text-xl font-semibold text-white mt-1">{(var95 * 100).toFixed(2)}%</div>
              </div>
              <div className="p-3 rounded-lg bg-[#2D2D2D]">
                <div className="text-xs text-[#9CA3AF]">Win Rate</div>
                <div className="text-xl font-semibold text-white mt-1">{winRate.toFixed(1)}%</div>
              </div>
            </div>
            {/* Correlation matrix */}
            <div className="overflow-auto rounded-lg border border-[#2D2D2D]" role="table" aria-label="Correlation matrix">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-[#9CA3AF]">Asset</th>
                    {Object.keys(corr).map((k) => (
                      <th key={k} className="p-2 text-center text-[#9CA3AF]">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(corr).map((row) => (
                    <tr key={row} className="border-t border-[#2D2D2D]">
                      <td className="p-2 text-[#9CA3AF]">{row}</td>
                      {Object.keys(corr[row]).map((col) => {
                        const v = corr[row][col]
                        // map -1..1 to red..green
                        const g = v >= 0 ? Math.round(40 + v * 60) : 40
                        const r = v < 0 ? Math.round(40 + -v * 60) : 40
                        const bg = `rgba(${r}, ${g}, 40, 0.25)`
                        return (
                          <td key={col} className="p-2 text-center text-white" style={{ background: bg }}>
                            {v.toFixed(2)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Recent transactions">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Trade history and performance</CardDescription>
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
                  {recentTxns.map((t) => (
                    <TableRow key={t.id} className="hover:bg-[#2D2D2D]/70">
                      <TableCell className="text-white">{t.date}</TableCell>
                      <TableCell className="text-white font-medium">{t.symbol}</TableCell>
                      <TableCell className={t.side === "BUY" ? "text-[#00C896]" : "text-[#FF6B6B]"}>{t.side}</TableCell>
                      <TableCell className="text-white">{t.qty}</TableCell>
                      <TableCell className="text-white">{formatCurrency(t.price)}</TableCell>
                      <TableCell className={t.pnl >= 0 ? "text-[#00C896]" : "text-[#FF6B6B]"}>
                        {t.pnl >= 0 ? "+" : ""}{formatCurrency(Math.abs(t.pnl))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly PnL and Equity trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Monthly PnL">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Monthly P&L</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Profit and loss by month</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {(() => {
              const months = Array.from({ length: 12 }).map((_, i) => ({
                m: new Date(2024, i, 1).toLocaleString(undefined, { month: "short" }),
                pnl: Math.round((Math.random() - 0.3) * 8000),
              }))
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={months} margin={{ top: 10, left: 0, right: 8, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.grid} opacity={0.25} vertical={false} />
                    <XAxis dataKey="m" tick={{ fill: COLORS.subtext }} axisLine={{ stroke: COLORS.grid }} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.subtext }} axisLine={{ stroke: COLORS.grid }} tickLine={false} width={64} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {months.map((d, i) => (
                        <Cell key={`cell-${i}`} fill={d.pnl >= 0 ? COLORS.gain : COLORS.loss} />
                      ))}
                    </Bar>
                    <RTooltip contentStyle={{ background: COLORS.bgDark, border: `1px solid ${COLORS.bgMuted}` }} />
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#2D2D2D] rounded-xl shadow-sm" aria-label="Equity trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Equity Curve</CardTitle>
            <CardDescription className="text-[#9CA3AF]">Growth of portfolio value over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {(() => {
              const base = 10000
              const closes = candles.map((c) => c.close)
              const eq = closes.map((c, i) => ({
                t: candles[i].t,
                equity: base * (c / closes[0]),
              }))
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={eq} margin={{ top: 10, left: 0, right: 8, bottom: 0 }}>
                    <CartesianGrid stroke={COLORS.grid} opacity={0.25} vertical={false} />
                    <XAxis dataKey="t" tick={{ fill: COLORS.subtext }} axisLine={{ stroke: COLORS.grid }} tickLine={false} minTickGap={22} />
                    <YAxis tick={{ fill: COLORS.subtext }} axisLine={{ stroke: COLORS.grid }} tickLine={false} width={64} tickFormatter={(v) => `$${Math.round(v).toLocaleString()}`} />
                    <Line type="monotone" dataKey="equity" stroke={COLORS.gain} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                    <RTooltip contentStyle={{ background: COLORS.bgDark, border: `1px solid ${COLORS.bgMuted}` }} formatter={(v: any) => formatCurrency(Number(v))} />
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
