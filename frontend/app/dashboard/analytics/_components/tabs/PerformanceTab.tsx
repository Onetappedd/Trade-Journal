"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { useFiltersStore } from "@/lib/analytics/filtersStore"
import { fetchJson, AnalyticsError } from "@/lib/analytics/client"
import { EquityCurveResponseSchema, CardsSummarySchema, MonthlyPnlResponseSchema } from "@/lib/analytics/types"
import { PortfolioPerformance } from "@/components/dashboard/PortfolioPerformance"
import { Info } from "lucide-react"

// Strict types for query responses, only the accessed properties

type EquityPoint = { date: string; value: number; percentChange: number; dollarChange: number }
const metricKeys = ['value','percentChange','dollarChange'] as const
type MetricKey = typeof metricKeys[number]
type EquityCurveRes = { data: EquityPoint[] }
type CardsRes = { data: Record<string, unknown> }
type BenchPoint = { day: string; close: number }
type BenchRes = { series: BenchPoint[] }
type RiskRes = { sample_size: number } & Record<string, unknown>

const defaultBenchmark = "SPY"

function RiskMetricCard({ label, value, tooltip }: { label: string, value: any, tooltip?: string }) {
  return (
    <div className="rounded bg-card border p-3 flex flex-col min-w-[80px] items-start justify-center text-sm">
      <span className="font-medium mb-1 flex items-center gap-1 ">{label}
        {tooltip ? <span tabIndex={0} className="ml-1 cursor-pointer" aria-label={`Info: ${tooltip}`} title={tooltip}><Info className="inline h-3 w-3 text-muted-foreground" aria-hidden /></span> : null}
      </span>
      <span className="font-semibold text-lg">{value}</span>
    </div>
  )
}

export function PerformanceTab() {
  const [benchmark, setBenchmark] = useState(defaultBenchmark)
  const [comparePrev, setComparePrev] = useState(false)
  const filters = useAnalyticsFiltersStore(s => ({
    ...s,
    filtersHash: s.filtersHash
  }))
  const filtersHash = filters.filtersHash()
  const queryClient = useQueryClient()

  // API queries
  const keyCurve = ['analytics', filtersHash, 'equity-curve'] as const
  const keyCards = ['analytics', filtersHash, 'cards'] as const
  const keyBench = ['analytics', filtersHash, 'benchmark', benchmark] as const
  const keyRisk = ['analytics', filtersHash, 'risk', benchmark] as const

  const curve = useQuery<EquityCurveRes>({
    queryKey: keyCurve,
    queryFn: async () => fetchJson('equity-curve', { ...filters }),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  })
  const cards = useQuery<CardsRes>({
    queryKey: keyCards,
    queryFn: async () => fetchJson('cards', { ...filters }),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  })
  const bench = useQuery<BenchRes>({
    queryKey: keyBench,
    queryFn: () => fetchJson('benchmark', { ticker: benchmark, start: filters.dateRange?.from, end: filters.dateRange?.to, tz: filters.timezone }),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  })
  const risk = useQuery<RiskRes>({
    queryKey: keyRisk,
    queryFn: () => fetchJson('risk', { ticker: benchmark, start: filters.dateRange?.from, end: filters.dateRange?.to, tz: filters.timezone }),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  })

  // UI guards
  if (curve.isLoading || cards.isLoading || bench.isLoading || risk.isLoading) {
    return <div className="animate-pulse h-48 rounded bg-muted" />
  }
  if (curve.isError || cards.isError || bench.isError || risk.isError) {
    const err = (curve.error || cards.error || bench.error || risk.error) as AnalyticsError
    return (
      <div className="border rounded p-4 bg-destructive/10">
        <div className="text-destructive mb-2">Failed to load analytics</div>
        <div className="text-sm text-muted-foreground mb-2">{err?.message}</div>
        <button className="text-xs px-3 py-1 rounded-md border bg-muted" onClick={()=>{curve.refetch();cards.refetch();bench.refetch();risk.refetch();}}>Retry</button>
      </div>
    )
  }

  // Compare previous period
  // Normalize to ensure required fields exist for PortfolioPerformance (PortfolioData[])
  const rawSeries = (curve.data?.data ?? []) as Array<Partial<EquityPoint> & { date?: unknown; value?: unknown }>
  const series: EquityPoint[] = rawSeries.map(p => ({
    date: String(p.date ?? ""),
    value: Number(p.value ?? 0),
    percentChange: Number(p.percentChange ?? 0),
    dollarChange: Number(p.dollarChange ?? 0),
  }))
  const cardsData = cards.data?.data ?? {}
  const benchSeries: BenchPoint[] = bench.data?.series ?? []
  const riskData = risk.data ?? { sample_size: 0 }
  const sampleSize = riskData.sample_size
  const insufficient = sampleSize < 15

  // Overlay: normalize benchmark to portfolio[0]
  let overlay: EquityPoint[] = []
  if (series.length && benchSeries.length) {
    const p0 = series[0].value
    const b0 = benchSeries[0].close
    overlay = benchSeries
      .map((d, i): EquityPoint => ({
        date: d.day,
        value: b0 > 0 ? p0 * (d.close / b0) : 0,
        percentChange: 0,
        dollarChange: 0,
      }))
      .filter((d, i) => !!series[i] && d.date === series[i]!.date)
  }

  // Compare previous period deltas
  let prevDeltas: Record<string,string|number> = {}
  if (comparePrev && series.length > 1) {
    const len = series.length
    const prev = series.slice(0, len)
    const half = Math.floor(len/2)
    const now = series.slice(half)
    if (now.length && prev.length) {
      for (const k of metricKeys) {
        const a = (now[now.length - 1]?.[k] ?? 0) as number
        const b = (prev[half - 1]?.[k] ?? 0) as number
        ;(prevDeltas as Record<MetricKey, string>)[k] = (a - b) > 0 ? "+" + (a - b).toFixed(2) : (a - b).toFixed(2)
      }
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center mb-2">
        <label htmlFor="benchmark-select" className="text-sm">Benchmark</label>
        <input
          id="benchmark-select"
          className="text-sm rounded border px-2 py-1"
          value={benchmark}
          onChange={e => setBenchmark(e.target.value.toUpperCase())}
          aria-label="Benchmark ticker symbol"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={comparePrev} onChange={e=>setComparePrev(e.target.checked)} />
          Compare previous period
        </label>
      </div>

      {/* Chart */}
      <PortfolioPerformance
        data={series}
        overlay={overlay}
        overlayLabel={benchmark}
        prevDeltas={comparePrev ? prevDeltas : undefined}
        initialValue={series[0]?.value || 10000}
      />

      {/* Risk Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <RiskMetricCard label="Beta" value={riskData.beta ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
        <RiskMetricCard label="Alpha (annual)" value={riskData.alpha_annual ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
        <RiskMetricCard label="Info Ratio" value={riskData.information_ratio ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
        <RiskMetricCard label="Up Capture" value={riskData.up_capture ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
        <RiskMetricCard label="Down Capture" value={riskData.down_capture ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
        <RiskMetricCard label="CAGR" value={riskData.cagr ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
        <RiskMetricCard label="MAR" value={riskData.mar ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
        <RiskMetricCard label="Ulcer Index" value={riskData.ulcer_index ?? 0} tooltip={insufficient? 'Insufficient data for robust stats.' : undefined}/>
      </div>
    </div>
  )
}
