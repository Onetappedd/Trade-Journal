"use client"

import React from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useAnalyticsFiltersStore, selectFilters } from "@/lib/analytics/filtersStore"
import { fetchJson, AnalyticsError } from "@/lib/analytics/client"
import { shallow } from "zustand/shallow"

function Skeleton() {
  return <div className="animate-pulse h-32 rounded-md bg-muted" />
}

export function TimeHabitsTab() {
  const {
    dateRange, datePreset, accountIds, assetClasses, tags, strategies, symbols, timezone, filtersHash,
  } = useAnalyticsFiltersStore(selectFilters, shallow)

  const keyHeatmap = ['analytics', filtersHash(), 'time-heatmap'] as const
  const keyHourly = ['analytics', filtersHash(), 'hourly-winrate'] as const

  const heatmap = useQuery({
    queryKey: keyHeatmap,
    queryFn: async () => fetchJson('time-heatmap', {
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

  const hourly = useQuery({
    queryKey: keyHourly,
    queryFn: async () => fetchJson('hourly-winrate', {
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

  if (heatmap.isLoading || hourly.isLoading) return <Skeleton />
  if (heatmap.isError || hourly.isError) {
    const err = (heatmap.error || hourly.error) as AnalyticsError
    return (
      <div className="border rounded-md p-4">
        <div className="text-destructive mb-2">Failed to load time & habits</div>
        <div className="text-sm text-muted-foreground mb-2">{err?.message}</div>
        <button className="text-sm px-3 py-1 rounded-md border bg-muted" onClick={() => { heatmap.refetch(); hourly.refetch(); }}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Time Heatmap</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(heatmap.data, null, 2)}</pre>
      </div>
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Hourly Win Rate</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(hourly.data, null, 2)}</pre>
      </div>
    </div>
  )
}
