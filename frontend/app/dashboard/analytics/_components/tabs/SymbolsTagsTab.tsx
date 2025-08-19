"use client"

import React from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useFiltersStore } from "@/lib/analytics/filtersStore"
import { fetchJson, AnalyticsError } from "@/lib/analytics/client"
import { useShallow } from "zustand/react/shallow"

// Local type for analytics filters
 type AnalyticsFiltersState = {
  dateRange: { from: Date | null; to: Date | null } | null
  datePreset: string | null
  accountIds: string[]
  assetClasses: string[]
  tags: string[]
  strategies: string[]
  symbols: string[]
  timezone: string
  filtersHash: () => string
}

function Skeleton() {
  return <div className="animate-pulse h-32 rounded-md bg-muted" />
}

export function SymbolsTagsTab() {
  const { dateRange, datePreset, accountIds, assetClasses, tags, strategies, symbols, timezone } = useFiltersStore();
  const filtersHash = () => (
    [datePreset, accountIds.join(','), assetClasses.join(','), tags.join(','), strategies.join(','), symbols.join(','), timezone].join("|")
  );

  const normalizedRange = {
    from: dateRange?.from ?? null,
    to: dateRange?.to ?? null,
  }

  const keySymbol = ['analytics', filtersHash(), 'symbols'] as const
  const keyTags = ['analytics', filtersHash(), 'tags'] as const

  const symbolsQuery = useQuery({
    queryKey: keySymbol,
    queryFn: async () => fetchJson('symbols', {
      start: dateRange?.from,
      end: dateRange?.to,
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
      start: dateRange?.from,
      end: dateRange?.to,
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
