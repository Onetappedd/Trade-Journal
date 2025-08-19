"use client";

import { create } from "zustand";
import type { DateRange } from "react-day-picker";

export type DatePreset = '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM';

export interface FiltersState {
  // values
  timezone: string;
  datePreset: DatePreset;
  dateRange?: DateRange | null;
  accountIds: string[];
  assetClasses: string[];
  tags: string[];
  strategies: string[];
  symbols: string[];
  // setters
  setTimezone: (tz: string) => void;
  setDatePreset: (p: DatePreset) => void;
  setDateRange: (r?: DateRange | null) => void;
  setAccountIds: (ids: string[]) => void;
  setAssetClasses: (values: string[]) => void;
  setTags: (values: string[]) => void;
  setStrategies: (values: string[]) => void;
  setSymbols: (values: string[]) => void;
  // utils
  reset: () => void;
}

const initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const initialState = {
  timezone: initialTimezone,
  datePreset: "1M" as DatePreset,
  dateRange: undefined,
  accountIds: [],
  assetClasses: [],
  tags: [],
  strategies: [],
  symbols: [],
};

export const useFiltersStore = create<FiltersState>()((set) => ({
  ...initialState,
  setTimezone: (tz) => set({ timezone: tz }),
  setDatePreset: (p) => set({ datePreset: p }),
  setDateRange: (r) => set({ dateRange: r }),
  setAccountIds: (ids) => set({ accountIds: ids }),
  setAssetClasses: (v) => set({ assetClasses: v }),
  setTags: (v) => set({ tags: v }),
  setStrategies: (v) => set({ strategies: v }),
  setSymbols: (v) => set({ symbols: v }),
  reset: () => set({ ...initialState }),
}));
