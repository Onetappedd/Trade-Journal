"use client"

import React from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useAnalyticsFiltersStore } from "@/lib/analytics/filtersStore"
import type { FiltersState as AnalyticsFiltersState } from "@/lib/analytics/filtersStore"
import { fetchJson, AnalyticsError } from "@/lib/analytics/client"
import { shallow } from "zustand/shallow"

function Skeleton() {
  return <div className="animate-pulse h-32 rounded-md bg-muted" />
}

export function RiskCostsTab() {
  const { dateRange, datePreset, accountIds, assetClasses, tags, strategies, symbols, timezone, filtersHash } =
    useAnalyticsFiltersStore((s: AnalyticsFiltersState) => ({
      dateRange: s.dateRange,
      datePreset: s.datePreset,
      accountIds: s.accountIds,
      assetClasses: s.assetClasses,
      tags: s.tags,
      strategies: s.strategies,
      symbols: s.symbols,
      timezone: s.timezone,
      filtersHash: s.filtersHash,
    }), shallow)

  const keyCosts = ['analytics', filtersHash(), 'costs'] as const
  const keyDrawdown = ['analytics', filtersHash(), 'drawdown'] as const

  const costs = useQuery({
    queryKey: keyCosts,
    queryFn: async () => fetchJson('costs', {
      start: dateRange?.start,
      end: dateRange?.end,
      preset: datePreset,
      accountIds,
      assetClasses,
      tags,
      strategies,
      symbols,
      timezone,
    }),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  })

  const drawdown = useQuery({
    queryKey: keyDrawdown,
    queryFn: async () => fetchJson('drawdown', {
      start: dateRange?.start,
      end: dateRange?.end,
      preset: datePreset,
      accountIds,
      assetClasses,
      tags,
      strategies,
      symbols,
      timezone,
    }),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  })

  if (costs.isLoading || drawdown.isLoading) return <Skeleton />
  if (costs.isError || drawdown.isError) {
    const err = (costs.error || drawdown.error) as AnalyticsError
    return (
      <div className="border rounded-md p-4">
        <div className="text-destructive mb-2">Failed to load risk & costs</div>
        <div className="text-sm text-muted-foreground mb-2">{err?.message}</div>
        <button className="text-sm px-3 py-1 rounded-md border bg-muted" onClick={() => { costs.refetch(); drawdown.refetch(); }}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Costs</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(costs.data, null, 2)}</pre>
      </div>
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Drawdown</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(drawdown.data, null, 2)}</pre>
      </div>
    </div>
  )
}
