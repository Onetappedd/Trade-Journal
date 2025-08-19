"use client"

import { create } from 'zustand'
import { shallow } from "zustand/shallow"

export type DatePreset = '1W'|'1M'|'3M'|'YTD'|'1Y'|'ALL'|'CUSTOM'
export type AssetClass = 'stocks'|'options'|'futures'|'crypto'
import type { DateRange } from 'react-day-picker';

export interface FiltersState {
  dateRange?: DateRange;
  datePreset: string | null;
  accountIds: string[];
  assetClasses: string[];
  tags: string[];
  strategies: string[];
  symbols: string[];
  timezone: string;
  filtersHash: () => string;
  setDateRange: (r?: DateRange) => void;
  setTimezone: (tz: string) => void;
}

export type { FiltersState };

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

export const useAnalyticsFiltersStore = create<FiltersState>()((set, get) => ({
  datePreset: 'ALL',
  dateRange: undefined,
  accountIds: [],
  assetClasses: [],
  tags: [],
  strategies: [],
  symbols: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
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
  },
  setDateRange: (r) => set((s) => ({ ...s, dateRange: r })),
  setTimezone: (tz) => set({ timezone: tz }),
}))

export const selectFilters = (s: FiltersState) => ({
  dateRange: s.dateRange,
  datePreset: s.datePreset,
  accountIds: s.accountIds,
  assetClasses: s.assetClasses,
  tags: s.tags,
  strategies: s.strategies,
  symbols: s.symbols,
  timezone: s.timezone,
  filtersHash: s.filtersHash,
});
