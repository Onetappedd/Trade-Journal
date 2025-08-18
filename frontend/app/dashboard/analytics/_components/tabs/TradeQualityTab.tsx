"use client"

import React from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useAnalyticsFiltersStore, selectFilters } from "@/lib/analytics/filtersStore"
import { fetchJson, AnalyticsError } from "@/lib/analytics/client"
import { useShallow } from "zustand/react/shallow"

function Skeleton() {
  return <div className="animate-pulse h-32 rounded-md bg-muted" />
}

export function TradeQualityTab() {
  const {
    dateRange, datePreset, accountIds, assetClasses, tags, strategies, symbols, timezone, filtersHash,
  } = useAnalyticsFiltersStore(useShallow(selectFilters))

  const keyExpectancy = ['analytics', filtersHash(), 'expectancy'] as const
  const keyProfitFactor = ['analytics', filtersHash(), 'profit-factor'] as const
  const keyHoldingTime = ['analytics', filtersHash(), 'holding-time'] as const

  const expectancy = useQuery({
    queryKey: keyExpectancy,
    queryFn: async () => fetchJson('expectancy', {
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

  const profitFactor = useQuery({
    queryKey: keyProfitFactor,
    queryFn: async () => fetchJson('profit-factor', {
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

  const holdingTime = useQuery({
    queryKey: keyHoldingTime,
    queryFn: async () => fetchJson('holding-time', {
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

  if (expectancy.isLoading || profitFactor.isLoading || holdingTime.isLoading) return <Skeleton />
  if (expectancy.isError || profitFactor.isError || holdingTime.isError) {
    const err = (expectancy.error || profitFactor.error || holdingTime.error) as AnalyticsError
    return (
      <div className="border rounded-md p-4">
        <div className="text-destructive mb-2">Failed to load trade quality</div>
        <div className="text-sm text-muted-foreground mb-2">{err?.message}</div>
        <button className="text-sm px-3 py-1 rounded-md border bg-muted" onClick={() => { expectancy.refetch(); profitFactor.refetch(); holdingTime.refetch(); }}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Expectancy</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(expectancy.data, null, 2)}</pre>
      </div>
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Profit Factor</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(profitFactor.data, null, 2)}</pre>
      </div>
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Holding Time</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(holdingTime.data, null, 2)}</pre>
      </div>
    </div>
  )
}
