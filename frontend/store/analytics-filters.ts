import { create } from 'zustand'
import { AnalyticsFilters } from '@/lib/analytics-contracts'

export type AnalyticsFiltersState = AnalyticsFilters & {
  setFilters: (filters: Partial<AnalyticsFilters>) => void
  resetFilters: () => void
}

const defaultFilters: AnalyticsFilters = {
  userId: '',
  accountIds: [],
  start: undefined,
  end: undefined,
  assetClasses: [],
  strategies: [],
  tickers: [],
  userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

export const useAnalyticsFiltersStore = create<AnalyticsFiltersState>((set) => ({
  ...defaultFilters,
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  resetFilters: () => set(() => ({ ...defaultFilters })),
}))
