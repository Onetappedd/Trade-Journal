"use client"

// Modular Analytics Dashboard Shell
import React, { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters"
import { EquityCurveChart } from "@/components/analytics/EquityCurveChart"
import { PnLByMonthChart } from "@/components/analytics/PnLByMonthChart"
import { useAnalyticsFilters } from "@/store/analytics-filters"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Area, AreaChart, Tooltip, ResponsiveContainer, XAxis, YAxis, BarChart, Bar, CartesianGrid, Legend, Cell, ScatterChart, Scatter } from "recharts"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function getToken() {
  // Lightweight client-side token getter using Supabase JS if present
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  } catch {
    return undefined
  }
}

async function fetcher(url: string, body: any) {
  const token = await getToken()
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

function useHashKey(obj: any) {
  return useMemo(() => JSON.stringify(obj), [obj])
}

function csvDownload(filename: string, rows: any[]) {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const lines = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}

function useAnalyticsData() {
  const store = useAnalyticsFilters()
  const req = store.getRequestFilters()
  const keyEquity = useHashKey({ k: "equity", req })
  const keyMonthly = useHashKey({ k: "monthly", req })
  const keyCards = useHashKey({ k: "cards", req })
  const keyCosts = useHashKey({ k: "costs", req })
  const keyTrades = useHashKey({ k: "trades", req })

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const { data: equity, error: eErr, isLoading: eLoading, mutate: refetchEquity } = useSWR(keyEquity, () => fetcher(`${API_BASE_URL}/analytics/equity-curve`, { ...req, userTimezone: tz }))
  const { data: monthly, error: mErr, isLoading: mLoading, mutate: refetchMonthly } = useSWR(keyMonthly, () => fetcher(`${API_BASE_URL}/analytics/monthly-pnl`, { ...req, userTimezone: tz }))
  const { data: cards, error: cErr, isLoading: cLoading, mutate: refetchCards } = useSWR(keyCards, () => fetcher(`${API_BASE_URL}/analytics/cards`, { ...req, userTimezone: tz }))
  const { data: costs, error: costErr, isLoading: costLoading, mutate: refetchCosts } = useSWR(keyCosts, () => fetcher(`${API_BASE_URL}/analytics/costs`, { ...req, userTimezone: tz }))
  const { data: trades, error: trErr, isLoading: trLoading, mutate: refetchTrades } = useSWR(keyTrades, () => fetcher(`${API_BASE_URL}/analytics/trades`, { ...req, userTimezone: tz }))

  const refetchAll = () => { refetchEquity(); refetchMonthly(); refetchCards(); refetchCosts(); refetchTrades() }
  return { equity, monthly, cards, costs, trades, eErr, mErr, cErr, costErr, trErr, eLoading, mLoading, cLoading, costLoading, trLoading, refetchAll }
}

function Skeleton({ height = 200 }: { height?: number }) {
  return <div className="animate-pulse rounded-md bg-muted" style={{ height }} />
}

function Empty({ message = "No trades in this range" }: { message?: string }) {
  return <div className="text-sm text-muted-foreground p-6 text-center">{message}</div>
}

function ErrorBox({ error, onRetry }: { error: any; onRetry?: () => void }) {
  return (
    <div className="p-4 border rounded-md text-sm">
      <div className="font-medium text-red-600">Error loading widget</div>
      <div className="text-muted-foreground">{String(error)}</div>
      {onRetry && <Button className="mt-2" size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

function Toolbar({ onExportCsv, onExportPng, onReset }: { onExportCsv: () => void; onExportPng: () => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={onExportCsv}>Export CSV</Button>
      <Button size="sm" variant="outline" onClick={onExportPng}>Export PNG</Button>
      <Button size="sm" variant="outline" onClick={onReset}>Reset filters</Button>
    </div>
  )
}

function HeaderFilters() {
  const store = useAnalyticsFilters()
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const presets = ["1m","3m","6m","1y","all","custom"] as const
  const assetChips: Array<{id: any,label: string}> = [
    { id: "stock", label: "Stocks" },
    { id: "option", label: "Options" },
    { id: "futures", label: "Futures" },
    { id: "crypto", label: "Crypto" },
  ]

  // Saved views in localStorage
  const [viewName, setViewName] = useState("")
  const [views, setViews] = useState<Array<{name:string, data:any}>>([])
  useEffect(() => {
    try { const raw = localStorage.getItem("analytics:savedViews"); setViews(raw? JSON.parse(raw):[]) } catch {}
  }, [])
  const saveView = () => {
    const data = {
      timeRange: store.timeRange,
      assetType: store.assetType,
      strategy: store.strategy,
      dateFrom: store.dateFrom?.toISOString() || null,
      dateTo: store.dateTo?.toISOString() || null,
      accountIds: store.accountIds || [],
      tz,
    }
    const next = views.filter(v => v.name !== viewName).concat([{ name: viewName || `View ${views.length+1}` , data }])
    setViews(next)
    localStorage.setItem("analytics:savedViews", JSON.stringify(next))
  }
  const loadView = (v: any) => {
    if (!v) return
    store.setTimeRange(v.data.timeRange)
    store.setAssetType(v.data.assetType)
    store.setStrategy(v.data.strategy)
    store.setDates(v.data.dateFrom? new Date(v.data.dateFrom): undefined, v.data.dateTo? new Date(v.data.dateTo): undefined)
    store.setAccountIds(v.data.accountIds)
    setTz(v.data.tz || tz)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <Toolbar onExportCsv={() => {}} onExportPng={() => {}} onReset={() => store.reset()} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Date preset */}
        <Select value={store.timeRange} onValueChange={v => store.setTimeRange(v as any)}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Range"/></SelectTrigger>
          <SelectContent>
            {presets.map(p => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* Accounts */}
        <Input className="w-56" placeholder="Account IDs (comma-separated)" onBlur={(e)=> store.setAccountIds(e.currentTarget.value? e.currentTarget.value.split(",").map(s=>s.trim()): undefined)} />
        {/* Asset chips */}
        <div className="flex items-center gap-1">
          {assetChips.map(ch => (
            <Badge key={ch.id} variant={store.assetType===ch.id? "default":"outline"} className="cursor-pointer" onClick={()=> store.setAssetType(ch.id)}>{ch.label}</Badge>
          ))}
        </div>
        {/* Strategy */}
        <Input className="w-44" placeholder="Strategy/Tag (single)" defaultValue={store.strategy!=='all'? store.strategy: ''} onBlur={(e)=> store.setStrategy(e.currentTarget.value || 'all')} />
        {/* Ticker search (filters not yet wired to backend) */}
        <Input className="w-40" placeholder="Ticker (optional)" />
        {/* Timezone */}
        <Input className="w-56" placeholder="Timezone" value={tz} onChange={e=> setTz(e.currentTarget.value)} />
        {/* Save view */}
        <div className="flex items-center gap-2">
          <Input className="w-40" placeholder="View name" value={viewName} onChange={e=> setViewName(e.currentTarget.value)} />
          <Button variant="outline" onClick={saveView}>Save view</Button>
          <Select onValueChange={(name)=> loadView(views.find(v=>v.name===name))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Load view"/></SelectTrigger>
            <SelectContent>
              {views.map(v => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function bucketize(values: number[], edges: number[]) {
  const buckets = edges.slice(0, -1).map((_, i) => ({ x0: edges[i], x1: edges[i+1], count: 0 }))
  values.forEach(v => {
    for (let i=0;i<buckets.length;i++) { if (v >= buckets[i].x0 && v < buckets[i].x1) { buckets[i].count++; return } }
    if (values.length && v === edges[edges.length-1]) buckets[buckets.length-1].count++
  })
  return buckets
}

function weekdayIndex(d: Date) { const i = d.getDay(); return i }
function hourOfDay(d: Date) { return d.getHours() }

export default function AnalyticsPage() {
  const { equity, monthly, cards, costs, trades, eErr, mErr, cErr, costErr, trErr, eLoading, mLoading, cLoading, costLoading, trLoading, refetchAll } = useAnalyticsData()

  // Refetch when filters change (store.getRequestFilters hash changes via SWR keys)
  useEffect(() => { /* SWR keys handle refetch automatically */ }, [])

  return (
    <div className="space-y-4 p-4 md:p-6">
      <HeaderFilters />

      {/* KPI Cards Row (basic subset until backend exposes more metrics) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
        {cLoading ? <Skeleton height={90}/> : cErr ? <ErrorBox error={cErr} onRetry={refetchAll}/> : (
          <>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Net P&L</div><div className="text-xl font-semibold">${(cards?.netPnl ?? 0).toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Realized</div><div className="text-xl font-semibold">${(cards?.realizedPnl ?? 0).toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Fees</div><div className="text-xl font-semibold">${(cards?.fees ?? 0).toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Win rate</div><div className="text-xl font-semibold">{(cards?.winRate ?? 0).toFixed(1)}%</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Avg win</div><div className="text-xl font-semibold">${(cards?.avgWin ?? 0).toLocaleString()}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Avg loss</div><div className="text-xl font-semibold">${(cards?.avgLoss ?? 0).toLocaleString()}</div></CardContent></Card>
          </>
        )}
      </div>

      {/* Equity section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4 space-y-3">
            {eLoading ? <Skeleton/> : eErr ? <ErrorBox error={eErr} onRetry={refetchAll}/> : (equity?.points?.length ? (
              <>
                {/* Header above chart: +$X (+Y%), Initial, Final, Benchmark toggle */}
                {(() => {
                  const pts = equity.points as Array<{ t: string; equity: number }>
                  const first = pts[0]?.equity ?? equity.initialBalance
                  const last = pts[pts.length-1]?.equity ?? equity.finalBalance
                  const delta = last - first
                  const pct = first !== 0 ? (delta / first) * 100 : 0
                  return (
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className={`text-lg font-semibold ${delta>=0? 'text-green-600':'text-red-600'}`}>{delta>=0? '+':''}${Math.abs(delta).toLocaleString(undefined,{maximumFractionDigits:2})} ({pct>=0?'+':''}{pct.toFixed(2)}%)</div>
                        <div className="text-muted-foreground">Initial: ${first.toLocaleString(undefined,{maximumFractionDigits:2})} • Final: ${last.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Benchmark overlay</Badge>
                      </div>
                    </div>
                  )
                })()}
                <EquityCurveChart data={equity.points} initialValue={equity.initialBalance} finalValue={equity.finalBalance} pctReturn={equity.pctReturn}/>
                {/* Max drawdown strip under chart */}
                {(() => {
                  const pts = equity.points as Array<{ t: string; equity: number }>
                  const dd: Array<{ t: string; dd: number }> = []
                  let peak = pts.length? pts[0].equity: 0
                  let minDD = 0
                  let minIndex = 0
                  pts.forEach((p, i) => {
                    peak = Math.max(peak, p.equity)
                    const drawdown = peak ? (p.equity - peak) / peak : 0
                    if (drawdown < minDD) { minDD = drawdown; minIndex = i }
                    dd.push({ t: p.t.split('T')[0], dd: Math.round(drawdown*10000)/100 })
                  })
                  return (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Max drawdown: {minDD ? `${(minDD*100).toFixed(2)}%` : '0.00%'} at index {minIndex}</div>
                      <div style={{ height: 80 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dd}>
                            <XAxis dataKey="t" hide/>
                            <YAxis hide domain={[dataMin => Math.min(-100, dataMin), 0]} />
                            <Tooltip formatter={(v:any)=> [`${v}%`, 'Drawdown']} labelFormatter={(l)=> l} />
                            <Area type="monotone" dataKey="dd" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : <Empty />)}
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            {mLoading ? <Skeleton/> : mErr ? <ErrorBox error={mErr} onRetry={refetchAll}/> : (monthly?.months?.length ? (
              <>
                {/* Subheader: X profitable • Y losing • Total: $T • Avg Monthly: $A */}
                <div className="text-sm text-muted-foreground mb-2">
                  {(() => {
                    const t = monthly.totals || {}
                    return `${t.profitableMonths ?? 0} profitable • ${t.losingMonths ?? 0} losing • Total: ${(t.netPnl ?? 0).toLocaleString()} • Avg Monthly: ${(t.avgMonthlyNet ?? 0).toLocaleString()}`
                  })()}
                </div>
                <PnLByMonthChart months={monthly.months} totals={monthly.totals}/>
              </>
            ) : <Empty />)}
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns section */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between"><div className="font-semibold">Breakdowns</div><Button size="sm" variant="outline">Export CSV</Button></div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default">By Asset Class</Badge>
              <Badge variant="outline">By Symbol</Badge>
              <Badge variant="outline">By Strategy/Tag</Badge>
              <Badge variant="outline">By Account</Badge>
            </div>
            <div className="text-sm text-muted-foreground">Clicking a row will set filters (additive). Data wiring placeholder until backend exposes breakdown endpoints.</div>
            <div className="border rounded-md p-3 text-sm">No data to display</div>
          </CardContent>
        </Card>
      </div>

      {/* Costs & Slippage */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between"><div className="font-semibold">Costs & Slippage</div><Button size="sm" variant="outline" onClick={()=> costs && csvDownload('fees.csv', (costs.fees.bySymbol || []))}>Export CSV</Button></div>
            {costLoading ? <Skeleton/> : costErr ? <ErrorBox error={costErr} onRetry={refetchAll}/> : costs ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Fees breakdown</div>
                  <div className="text-xs text-muted-foreground mb-2">Total: ${costs.fees.total.toLocaleString()} • Commissions: ${costs.fees.commissions.toLocaleString()} • Regulatory: ${costs.fees.regulatory.toLocaleString()} • Exchange: ${costs.fees.exchange.toLocaleString()}</div>
                  <div className="max-h-48 overflow-auto border rounded-md p-2 text-sm">
                    <div className="font-medium">By Symbol</div>
                    <ul className="text-xs">
                      {(costs.fees.bySymbol||[]).slice(0,20).map((r:any)=> <li key={r.group} className="flex justify-between"><span>{r.group}</span><span>${r.fees.toLocaleString()}</span></li>)}
                    </ul>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Slippage</div>
                  {costs.slippage.supported ? (
                    <div className="max-h-48 overflow-auto border rounded-md p-2 text-sm">
                      <div className="font-medium">By Asset Class</div>
                      <ul className="text-xs">
                        {(costs.slippage.byAssetClass||[]).map((r:any)=> <li key={r.group} className="flex justify-between"><span>{r.group}</span><span>{r.avg}</span></li>)}
                      </ul>
                    </div>
                  ): <div className="text-sm text-muted-foreground">Slippage not available for this dataset.</div>}
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Futures breakdown</div>
                  <div className="border rounded-md p-2 text-xs max-h-48 overflow-auto">
                    <div className="font-medium">By Root</div>
                    <ul>{(costs.futures.byRoot||[]).map((r:any)=> <li key={r.root} className="flex justify-between"><span>{r.root}</span><span>${r.netPnl.toLocaleString()} ({r.tradeCount})</span></li>)}</ul>
                    <div className="font-medium mt-2">By Expiry</div>
                    <ul>{(costs.futures.byExpiry||[]).slice(0,20).map((r:any)=> <li key={r.expiry} className="flex justify-between"><span>{r.expiry}</span><span>${r.netPnl.toLocaleString()} ({r.tradeCount})</span></li>)}</ul>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Options DTE buckets</div>
                  <ul className="text-xs border rounded-md p-2">
                    {(costs.options.byDteBucket||[]).map((r:any)=> <li key={r.bucket} className="flex justify-between"><span>{r.bucket}</span><span>{r.tradeCount}</span></li>)}
                  </ul>
                </div>
              </div>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>

      {/* Distributions & Trade Quality */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between"><div className="font-semibold">Distributions & Trade Quality</div><Button size="sm" variant="outline" onClick={()=> trades && csvDownload('trades.csv', trades)}>Export CSV</Button></div>
            {trLoading ? <Skeleton/> : trErr ? <ErrorBox error={trErr} onRetry={refetchAll}/> : trades?.length ? (
              <>
                {/* Return % histogram */}
                {(() => {
                  const rets = trades.map((t:any)=> Number(t.returnPct || 0)).filter((x:number)=> Number.isFinite(x))
                  const edges = [-100,-50,-25,-10,-5,0,5,10,25,50,100]
                  const buckets = bucketize(rets, edges)
                  return (
                    <div>
                      <div className="text-sm font-medium mb-1">Per-trade Return %</div>
                      <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={buckets.map(b=> ({ name: `${b.x0}…${b.x1}`, count: b.count }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })()}
                {/* Holding period histogram */}
                {(() => {
                  const durs = trades.map((t:any)=> Number(t.durationMinutes || 0)).filter((x:number)=> Number.isFinite(x))
                  const edges = [0,10,30,60,120,240,480,1440,2880,10080]
                  const buckets = bucketize(durs, edges)
                  return (
                    <div>
                      <div className="text-sm font-medium mb-1">Holding Period (minutes)</div>
                      <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={buckets.map(b=> ({ name: `${b.x0}…${b.x1}`, count: b.count }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })()}

                {/* Return vs Duration scatter */}
                {(() => {
                  const points = trades.filter((t:any)=> Number.isFinite(t.returnPct) && Number.isFinite(t.durationMinutes)).map((t:any)=> ({ x: t.durationMinutes, y: t.returnPct, label: `${t.symbol}` }))
                  return (
                    <div>
                      <div className="text-sm font-medium mb-1">Return vs Duration</div>
                      <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="x" name="Duration (min)" />
                            <YAxis type="number" dataKey="y" name="Return %" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val:any, name:any, props:any)=> [val, name]} labelFormatter={(_,p:any)=> (p && p.length? p[0].payload.label : '')} />
                            <Scatter data={points} fill="#8884d8" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>

      {/* Time Analytics */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between"><div className="font-semibold">Time Analytics</div><Button size="sm" variant="outline">Export CSV</Button></div>
            {trLoading ? <Skeleton/> : trErr ? <ErrorBox error={trErr} onRetry={refetchAll}/> : trades?.length ? (
              <>
                {/* Weekday bars */}
                {(() => {
                  const byDay: Record<string, number> = {}
                  trades.forEach((t:any)=> { const d = t.exitTime? new Date(t.exitTime): null; if (d && Number.isFinite(t.netPnl)) { const k = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekdayIndex(d)]; byDay[k] = (byDay[k]||0) + (t.netPnl||0) } })
                  const data = Object.entries(byDay).map(([k,v])=> ({ name: k, value: Math.round(v*100)/100 }))
                  return (
                    <div>
                      <div className="text-sm font-medium mb-1">Net P&L by Weekday</div>
                      <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3182ce" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}