"use client"

import { create } from 'zustand'

export type DatePreset = '1W'|'1M'|'3M'|'YTD'|'1Y'|'ALL'|'CUSTOM'
export type AssetClass = 'stocks'|'options'|'futures'|'crypto'

export interface DateRange { start?: string; end?: string }

export type FiltersState = {
  datePreset: DatePreset
  dateRange?: DateRange
  accountIds: string[]
  assetClasses: AssetClass[]
  tags: string[]
  strategies: string[]
  symbols: string[]
  timezone: string
  // setters
  setDatePreset: (v: DatePreset) => void
  setDateRange: (v?: DateRange) => void
  setAccountIds: (v: string[]) => void
  setAssetClasses: (v: AssetClass[]) => void
  setTags: (v: string[]) => void
  setStrategies: (v: string[]) => void
  setSymbols: (v: string[]) => void
  setTimezone: (v: string) => void
  reset: () => void
  filtersHash: () => string
}

function stableStringify(obj: any): string {
  if (obj == null) return ''
  if (Array.isArray(obj)) return JSON.stringify([...obj].sort())
  if (typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: any = {}
    for (const k of sortedKeys) sortedObj[k] = obj[k]
    return JSON.stringify(sortedObj)
  }
  return String(obj)
}

export const useAnalyticsFiltersStore = create<FiltersState>((set, get) => ({
  datePreset: 'ALL',
  dateRange: undefined,
  accountIds: [],
  assetClasses: [],
  tags: [],
  strategies: [],
  symbols: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',

  setDatePreset: (v) => set({ datePreset: v }),
  setDateRange: (v) => set({ dateRange: v }),
  setAccountIds: (v) => set({ accountIds: v }),
  setAssetClasses: (v) => set({ assetClasses: v }),
  setTags: (v) => set({ tags: v }),
  setStrategies: (v) => set({ strategies: v }),
  setSymbols: (v) => set({ symbols: v }),
  setTimezone: (v) => set({ timezone: v }),
  reset: () => set({
    datePreset: 'ALL',
    dateRange: undefined,
    accountIds: [],
    assetClasses: [],
    tags: [],
    strategies: [],
    symbols: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  }),
  filtersHash: () => {
    const s = get()
    return [
      s.datePreset,
      stableStringify(s.dateRange || {}),
      stableStringify(s.accountIds),
      stableStringify(s.assetClasses),
      stableStringify(s.tags),
      stableStringify(s.strategies),
      stableStringify(s.symbols),
      s.timezone,
    ].join('|')
  }
}))

// Export the state type so consumers (e.g., RiskCostsTab) can import it
export type { FiltersState };
