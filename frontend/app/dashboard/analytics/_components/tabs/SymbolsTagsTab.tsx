"use client"

import React from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useAnalyticsFiltersStore } from "@/lib/analytics/filtersStore"
import { fetchJson, AnalyticsError } from "@/lib/analytics/client"
import { useShallow } from "zustand/react/shallow"

function Skeleton() {
  return <div className="animate-pulse h-32 rounded-md bg-muted" />
}

export function SymbolsTagsTab() {
  const selectFilters = (s: any) => ({
    dateRange: s.dateRange,
    datePreset: s.datePreset,
    accountIds: s.accountIds,
    assetClasses: s.assetClasses,
    tags: s.tags,
    strategies: s.strategies,
    symbols: s.symbols,
    timezone: s.timezone,
    filtersHash: s.filtersHash,
  })
  const {
    dateRange, datePreset, accountIds, assetClasses, tags, strategies, symbols, timezone, filtersHash,
  } = useAnalyticsFiltersStore(useShallow(selectFilters))

  const keySymbol = ['analytics', filtersHash(), 'symbols'] as const
  const keyTags = ['analytics', filtersHash(), 'tags'] as const

  const symbolsQuery = useQuery({
    queryKey: keySymbol,
    queryFn: async () => fetchJson('symbols', {
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

  const tagsQuery = useQuery({
    queryKey: keyTags,
    queryFn: async () => fetchJson('tags', {
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

  if (symbolsQuery.isLoading || tagsQuery.isLoading) return <Skeleton />
  if (symbolsQuery.isError || tagsQuery.isError) {
    const err = (symbolsQuery.error || tagsQuery.error) as AnalyticsError
    return (
      <div className="border rounded-md p-4">
        <div className="text-destructive mb-2">Failed to load symbols & tags</div>
        <div className="text-sm text-muted-foreground mb-2">{err?.message}</div>
        <button className="text-sm px-3 py-1 rounded-md border bg-muted" onClick={() => { symbolsQuery.refetch(); tagsQuery.refetch(); }}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Symbols</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(symbolsQuery.data, null, 2)}</pre>
      </div>
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Tags</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(tagsQuery.data, null, 2)}</pre>
      </div>
    </div>
  )
}
