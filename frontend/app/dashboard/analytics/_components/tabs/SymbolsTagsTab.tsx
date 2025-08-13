"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAnalyticsFiltersStore } from "@/lib/analytics/filtersStore"
import { fetchJson, AnalyticsError } from "@/lib/analytics/client"
import { shallow } from "zustand/shallow"

function Skeleton() {
  return <div className="animate-pulse h-32 rounded-md bg-muted" />
}

export function SymbolsTagsTab() {
  const { dateRange, datePreset, accountIds, assetClasses, tags, strategies, symbols, timezone, filtersHash } = useAnalyticsFiltersStore(s => ({
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

  const keySymbols = ['analytics', filtersHash(), 'symbols-breakdown'] as const
  const keyTags = ['analytics', filtersHash(), 'tags-breakdown'] as const

  const symbolsQuery = useQuery({
    queryKey: keySymbols,
    queryFn: async () => fetchJson('symbols-breakdown', {
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
    keepPreviousData: true,
  })

  const tagsQuery = useQuery({
    queryKey: keyTags,
    queryFn: async () => fetchJson('tags-breakdown', {
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
    keepPreviousData: true,
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
        <div className="text-sm font-medium mb-2">Symbols Breakdown</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(symbolsQuery.data, null, 2)}</pre>
      </div>
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium mb-2">Tags Breakdown</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(tagsQuery.data, null, 2)}</pre>
      </div>
    </div>
  )
}
