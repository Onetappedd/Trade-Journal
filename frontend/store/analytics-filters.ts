"use client"

import { useSyncExternalStore } from "react"
import type { AnalyticsFilters } from "@/lib/analytics-types"

export type TimeRange = "1m" | "3m" | "6m" | "1y" | "all" | "custom"

function deriveRange(time: TimeRange): { start?: string; end?: string } {
  if (time === "all") return { start: undefined, end: undefined }
  const now = new Date()
  if (time === "custom") return { start: undefined, end: undefined }
  const d = new Date(now)
  if (time === "1m") d.setMonth(d.getMonth() - 1)
  if (time === "3m") d.setMonth(d.getMonth() - 3)
  if (time === "6m") d.setMonth(d.getMonth() - 6)
  if (time === "1y") d.setFullYear(d.getFullYear() - 1)
  return { start: d.toISOString(), end: now.toISOString() }
}

function mapAssetTypeToClasses(assetType?: string): ("stocks" | "options" | "futures")[] | undefined {
  if (!assetType || assetType === "all") return undefined
  const v = assetType.toLowerCase()
  if (v === "stock" || v === "stocks") return ["stocks"]
  if (v === "option" || v === "options") return ["options"]
  if (v === "future" || v === "futures") return ["futures"]
  return undefined
}

export type AnalyticsFiltersStateSnapshot = {
  userId?: string
  accountIds?: string[]

  timeRange: TimeRange
  assetType: "all" | "stock" | "option" | "futures" | "crypto"
  strategy: string | "all"
  dateFrom?: Date
  dateTo?: Date
}

const initialSnapshot: AnalyticsFiltersStateSnapshot = {
  userId: undefined,
  accountIds: undefined,
  timeRange: "all",
  assetType: "all",
  strategy: "all",
  dateFrom: undefined,
  dateTo: undefined,
}

// Simple external store implementation
let state: AnalyticsFiltersStateSnapshot = { ...initialSnapshot }
const listeners = new Set<() => void>()

function set(patch: Partial<AnalyticsFiltersStateSnapshot>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function get(): AnalyticsFiltersStateSnapshot {
  return state
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Public API exposed through the hook
export type AnalyticsFiltersState = AnalyticsFiltersStateSnapshot & {
  setUserId: (id?: string) => void
  setAccountIds: (ids?: string[]) => void
  setTimeRange: (v: TimeRange) => void
  setAssetType: (v: AnalyticsFiltersStateSnapshot["assetType"]) => void
  setStrategy: (v: string | "all") => void
  setDates: (from?: Date, to?: Date) => void
  reset: () => void

  getRequestFilters: () => AnalyticsFilters
  initFromSearchParams: (sp: URLSearchParams | Readonly<URLSearchParams>) => void
  toSearchParams: (base: URLSearchParams) => URLSearchParams
}

const actions = {
  setUserId: (id?: string) => set({ userId: id }),
  setAccountIds: (ids?: string[]) => set({ accountIds: ids }),
  setTimeRange: (v: TimeRange) => set({ timeRange: v }),
  setAssetType: (v: AnalyticsFiltersStateSnapshot["assetType"]) => set({ assetType: v }),
  setStrategy: (v: string | "all") => set({ strategy: v }),
  setDates: (from?: Date, to?: Date) => set({ dateFrom: from, dateTo: to }),
  reset: () => set({ ...initialSnapshot }),

  getRequestFilters: (): AnalyticsFilters => {
    const { userId, accountIds, timeRange, assetType, strategy, dateFrom, dateTo } = get()
    const isCustom = timeRange === "custom"
    const derived = isCustom
      ? { start: dateFrom ? dateFrom.toISOString() : undefined, end: dateTo ? dateTo.toISOString() : undefined }
      : deriveRange(timeRange)

    const filters: AnalyticsFilters = {
      userId: userId || "",
      accountIds,
      start: derived.start,
      end: derived.end,
      assetClasses: mapAssetTypeToClasses(assetType),
      strategies: strategy && strategy !== "all" ? [strategy] : undefined,
    }
    return filters
  },

  initFromSearchParams: (sp: URLSearchParams | Readonly<URLSearchParams>) => {
    const time = (sp.get("time") as TimeRange) || "all"
    const assetType = (sp.get("assetType") as AnalyticsFiltersStateSnapshot["assetType"]) || "all"
    const strategy = (sp.get("strategy") as string) || "all"
    const startStr = sp.get("start") || undefined
    const endStr = sp.get("end") || undefined

    set({
      timeRange: time,
      assetType,
      strategy,
      dateFrom: startStr ? new Date(startStr) : undefined,
      dateTo: endStr ? new Date(endStr) : undefined,
    })
  },

  toSearchParams: (base: URLSearchParams) => {
    const sp = new URLSearchParams(base)
    const { timeRange, assetType, strategy, dateFrom, dateTo } = get()

    sp.set("time", timeRange)
    sp.set("assetType", assetType)
    sp.set("strategy", strategy)

    if (timeRange === "custom") {
      if (dateFrom) sp.set("start", dateFrom.toISOString())
      if (dateTo) sp.set("end", dateTo.toISOString())
    } else {
      sp.delete("start")
      sp.delete("end")
    }

    return sp
  },
}

export function useAnalyticsFilters(): AnalyticsFiltersState {
  const snapshot = useSyncExternalStore(subscribe, get, get)
  // Return snapshot + stable actions
  return Object.assign({}, snapshot, actions)
}
