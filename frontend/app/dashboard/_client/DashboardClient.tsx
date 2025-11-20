'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Settings, TrendingUp, DollarSign, Target, Shield, History, PieChart, LineChart, MoreHorizontal, Plus, BarChart3 } from 'lucide-react'
import { DashboardData, Trade, Position, Timeframe, CATEGORY_COLORS, fmtUSD, withSignUSD } from '@/types/dashboard'
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RPieChart, Pie, Cell } from 'recharts'

// ------------ Helpers ------------
const fmtPct0 = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(n)) return '0%'
  return `${(n * 100).toFixed(0)}%`
}
const fmtPct1 = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(n)) return '0.0%'
  return `${(n * 100).toFixed(1)}%`
}

const startOfWeek = () => {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // Mon=0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d }
const startOfYear = () => { const d = new Date(); d.setMonth(0, 1); d.setHours(0, 0, 0, 0); return d }

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function inRange(dt: Date, from: Date, to: Date) {
  return dt >= from && dt <= to
}

function mergeDailySeries(trades: Trade[]) {
  // derive daily PnL & cumulative series from trades.closedAt or openedAt
  const map = new Map<string, number>()
  for (const t of trades) {
    const when = new Date(t.closedAt ?? t.openedAt ?? Date.now())
    const key = when.toISOString().slice(0, 10)
    const pnl = (t.pnl !== null && t.pnl !== undefined && !isNaN(t.pnl)) ? t.pnl : 0
    map.set(key, (map.get(key) ?? 0) + pnl)
  }
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  let cum = 0
  const data = sorted.map(([date, daily]) => {
    cum += daily
    return { date, daily, cum }
  })
  // create labels
  return data.map(d => ({ ...d, dateLabel: d.date }))
}

// ------------ Props ------------
export default function DashboardClient({
  user,
  dashboardData: initialData,
}: {
  user: any
  dashboardData: DashboardData
}) {

  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData)
  const [timeframe, setTimeframe] = useState<Timeframe>('today')
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null)
  const [loading, setLoading] = useState(false) // for refetch or ws

  // -------- Derived data --------
  const hasTrades = !!dashboardData?.trades?.length
  const fromDate = useMemo(() => {
    const now = new Date()
    if (timeframe === 'today') { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
    if (timeframe === 'wtd') return startOfWeek()
    if (timeframe === 'mtd') return startOfMonth()
    if (timeframe === 'ytd') return startOfYear()
    return customRange?.from ?? startOfMonth()
  }, [timeframe, customRange])

  const toDate = useMemo(() => {
    if (timeframe === 'custom' && customRange?.to) return endOfDay(customRange.to)
    return endOfDay(new Date())
  }, [timeframe, customRange])

  const filteredTrades = useMemo(() => {
    const items = dashboardData?.trades ?? []
    return items.filter(t => {
      const d = new Date(t.closedAt ?? t.openedAt ?? Date.now())
      return inRange(d, fromDate, toDate)
    })
  }, [dashboardData?.trades, fromDate, toDate])

  const todayPnL = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = endOfDay(new Date())
    return (dashboardData?.trades ?? [])
      .filter(t => inRange(new Date(t.closedAt ?? t.openedAt ?? Date.now()), start, end))
      .reduce((a, t) => {
        const pnl = typeof t.pnl === 'string' ? parseFloat(t.pnl) : (t.pnl ?? 0)
        return a + (typeof pnl === 'number' && !isNaN(pnl) ? pnl : 0)
      }, 0)
  }, [dashboardData?.trades])

  const wtdPnL = useMemo(() => {
    const start = startOfWeek()
    return (dashboardData?.trades ?? [])
      .filter(t => new Date(t.closedAt ?? t.openedAt ?? Date.now()) >= start)
      .reduce((a, t) => {
        const pnl = typeof t.pnl === 'string' ? parseFloat(t.pnl) : (t.pnl ?? 0)
        return a + (typeof pnl === 'number' && !isNaN(pnl) ? pnl : 0)
      }, 0)
  }, [dashboardData?.trades]), [dashboardData?.trades])

  const mtdPnL = useMemo(() => {
    const start = startOfMonth()
    return (dashboardData?.trades ?? [])
      .filter(t => new Date(t.closedAt ?? t.openedAt ?? Date.now()) >= start)
      .reduce((a, t) => {
        const pnl = typeof t.pnl === 'string' ? parseFloat(t.pnl) : (t.pnl ?? 0)
        return a + (typeof pnl === 'number' && !isNaN(pnl) ? pnl : 0)
      }, 0)
  }, [dashboardData?.trades])

  const winRate20 = useMemo(() => {
    const last20 = (dashboardData?.trades ?? []).slice(-20)
    if (!last20.length) return 0
    return last20.filter(t => (t.pnl ?? 0) > 0).length / last20.length
  }, [dashboardData?.trades])

  const chartData = useMemo(() => {
    if (dashboardData?.dailyPnlSeries && dashboardData?.cumPnlSeries) {
      // Optional: merge provided series by date key
      const map = new Map<string, { dateLabel: string; daily?: number; cum?: number }>()
      for (const d of dashboardData.dailyPnlSeries) {
        const pnl = (d.pnl !== null && d.pnl !== undefined && !isNaN(d.pnl)) ? d.pnl : 0
        map.set(d.t, { dateLabel: d.t, daily: pnl })
      }
      for (const c of dashboardData.cumPnlSeries) {
        const prev = map.get(c.t) ?? { dateLabel: c.t }
        const pnl = (c.pnl !== null && c.pnl !== undefined && !isNaN(c.pnl)) ? c.pnl : 0
        map.set(c.t, { ...prev, cum: pnl })
      }
      return [...map.values()].sort((a, b) => a.dateLabel.localeCompare(b.dateLabel))
    }
    return mergeDailySeries(filteredTrades)
  }, [dashboardData?.dailyPnlSeries, dashboardData?.cumPnlSeries, filteredTrades])

  const allocation = useMemo(() => {
    const pos = dashboardData?.positions ?? []
    const byCat = pos.reduce((acc, p) => {
      const val = (p.value !== null && p.value !== undefined && !isNaN(p.value)) ? p.value : 0
      acc[p.category] = (acc[p.category] ?? 0) + val
      return acc
    }, {} as Record<string, number>)
    const total = Object.values(byCat).reduce((a, b) => a + b, 0)
    const entries = Object.entries(byCat).map(([category, value]) => ({
      name: category,
      value,
      pct: total ? value / total : 0
    }))
    return entries
  }, [dashboardData?.positions])

  // ------------ UI ------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome back, {user?.user_metadata?.name || user?.email || 'Trader'}</h1>
            <p className="text-slate-400 text-sm">Here's your trading performance overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800" onClick={() => router.push('/settings')} aria-label="Settings">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/import')} aria-label="Import Trades">
              <Upload className="h-4 w-4 mr-2" /> Import Trades
            </Button>
          </div>
        </div>

        {/* Timeframe chips */}
        <div className="flex gap-2 mb-6">
          {(['today', 'wtd', 'mtd', 'ytd'] as Timeframe[]).map(tf => (
            <Badge
              key={tf}
              data-testid={`chip-${tf}`}
              onClick={() => setTimeframe(tf)}
              className={`cursor-pointer px-3 py-1 ${timeframe === tf ? 'bg-emerald-600' : 'bg-slate-800'}`}
            >
              {tf.toUpperCase()}
            </Badge>
          ))}
          {/* Custom would open a date-range picker later */}
        </div>

        {/* Empty state */}
        {!hasTrades && (
          <div className="text-center py-24">
            <div className="mb-4">
              <div className="text-4xl mb-3">〰️</div>
              <h3 className="text-lg font-semibold text-white mb-2">No trades yet</h3>
              <p className="text-slate-400 mb-6">Start by importing your trading data to see your performance analytics.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => router.push('/import')} className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="h-4 w-4 mr-2" /> Import CSV
              </Button>
              <Button variant="outline" onClick={() => router.push('/settings/integrations')}>⚡ Connect Broker</Button>
              <Button variant="outline" onClick={() => router.push('/trades/new?from=dashboard')}><Plus className="h-4 w-4 mr-2" /> Add Manual Trade</Button>
            </div>
          </div>
        )}

        {/* Full dashboard when trades exist */}
        {hasTrades && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card data-testid="kpi-day-pnl" className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Today's P&L</p>
                      <p className={`text-2xl font-bold ${todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{withSignUSD(todayPnL)}</p>
                    </div>
                    <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="kpi-portfolio" className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Portfolio Value</p>
                      <p className="text-2xl font-bold text-white">{fmtUSD(dashboardData.portfolioValue)}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="kpi-mtd" className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">MTD P&L</p>
                      <p className={`text-2xl font-bold ${mtdPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{withSignUSD(mtdPnL)}</p>
                    </div>
                    <div className="h-10 w-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="kpi-winrate20" className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Win Rate (last 20)</p>
                      <p className="text-2xl font-bold text-white">{fmtPct0(winRate20)}</p>
                    </div>
                    <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts + Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <LineChart className="h-5 w-5 mr-2" /> Equity Curve & Daily P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div data-testid="chart-portfolio" className="h-72">
                    <ResponsiveContainer>
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dateLabel" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="daily" />
                        <Line yAxisId="right" type="monotone" dataKey="cum" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <PieChart className="h-5 w-5 mr-2" /> Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 flex items-center justify-center">
                    {allocation.length ? (
                      <ResponsiveContainer>
                        <RPieChart>
                          <Pie data={allocation} dataKey="value" nameKey="name" outerRadius={100}>
                            {allocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] ?? '#94a3b8'} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number, _: any, item: any) => [`${fmtUSD(v)} (${fmtPct1(item.payload.pct)})`, item.payload.name]} />
                        </RPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400">No positions</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Trades + Risk Metrics/Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center"><History className="h-5 w-5 mr-2" /> Recent Trades</span>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/trades')} aria-label="More trades">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div data-testid="list-recent-trades" className="space-y-3">
                    {filteredTrades.slice(-5).reverse().map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${t.pnl >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <div>
                            <p className="text-white font-medium">{t.symbol}</p>
                            <p className="text-slate-400 text-sm">{t.side} • {t.quantity} • {t.strategy ?? '—'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{fmtUSD(typeof t.price === 'string' ? parseFloat(t.price) : (t.price ?? t.entry_price ?? 0))}</p>
                          <p className={`text-sm ${(typeof t.pnl === 'string' ? parseFloat(t.pnl) : (t.pnl ?? 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{withSignUSD(typeof t.pnl === 'string' ? parseFloat(t.pnl) : (t.pnl ?? 0))}</p>
                        </div>
                      </div>
                    ))}
                    {!filteredTrades.length && <p className="text-slate-400">No trades in selected timeframe.</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white">Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-400">Max Drawdown</span><span className="text-white font-medium">-{fmtPct1(dashboardData.risk.maxDrawdownPct)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Sharpe Ratio</span><span className="text-white font-medium">{dashboardData.risk.sharpe.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Beta</span><span className="text-white font-medium">{dashboardData.risk.beta.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Volatility</span><span className="text-white font-medium">{fmtPct1(dashboardData.risk.volPct)}</span></div>
                  </div>
                  <div className="mt-5">
                    <p className="text-slate-300 font-medium mb-2">Recent Risk Events</p>
                    <div data-testid="risk-events" className="space-y-2">
                      {(dashboardData.riskEvents ?? []).slice(0, 3).map(e => (
                        <div key={e.id} className="flex items-center justify-between bg-slate-800 p-2 rounded">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            e.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                              e.severity === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-slate-600/40 text-slate-200'
                          }`}>{e.severity}</span>
                          <span className="text-sm text-slate-200 flex-1 mx-3 truncate">{e.details}</span>
                          <span className="text-xs text-slate-400">{e.at ? new Date(e.at).toLocaleString() : 'N/A'}</span>
                        </div>
                      ))}
                      {!(dashboardData.riskEvents ?? []).length && <p className="text-slate-400 text-sm">No recent events.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integrations & Quick Actions */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              {!!dashboardData.integrations?.length && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      {dashboardData.integrations!.map(int => (
                        <div key={int.name} className="flex items-center gap-2">
                          <span className="text-slate-300">{int.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            int.status === 'connected' ? 'bg-emerald-500/20 text-emerald-300' :
                              int.status === 'needs_auth' ? 'bg-amber-500/20 text-amber-200' :
                                'bg-red-500/20 text-red-300'
                          }`}>{int.status.replace('_', ' ')}</span>
                          {int.lastSync && <span className="text-slate-500 text-xs">• synced {int.lastSync ? new Date(int.lastSync).toLocaleString() : 'N/A'}</span>}
                          {int.status !== 'connected' && (
                            <Button variant="ghost" size="sm" onClick={() => router.push('/settings/integrations')}>Connect</Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button variant="outline" className="h-auto p-4 bg-slate-900 border-slate-800" onClick={() => router.push('/trades')}>
                  <div className="flex flex-col items-center text-center"><BarChart3 className="h-6 w-6 mb-2" /><span>View All Trades</span></div>
                </Button>
                <Button variant="outline" className="h-auto p-4 bg-slate-900 border-slate-800" onClick={() => router.push('/analytics')}>
                  <div className="flex flex-col items-center text-center"><PieChart className="h-6 w-6 mb-2" /><span>Analytics</span></div>
                </Button>
                <Button variant="outline" className="h-auto p-4 bg-slate-900 border-slate-800" onClick={() => router.push('/import')}>
                  <div className="flex flex-col items-center text-center"><Upload className="h-6 w-6 mb-2" /><span>Import Data</span></div>
                </Button>
                <Button variant="outline" className="h-auto p-4 bg-slate-900 border-slate-800" onClick={() => router.push('/trades/new?from=dashboard')}>
                  <div className="flex flex-col items-center text-center"><Plus className="h-6 w-6 mb-2" /><span>Add Manual Trade</span></div>
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}