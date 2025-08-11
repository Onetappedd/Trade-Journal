import { z } from "zod"

// --- FILTERS ---
export const AnalyticsFiltersSchema = z.object({
  userId: z.string(),
  accountIds: z.array(z.string()).optional(),
  start: z.string().datetime().optional(), // ISO
  end: z.string().datetime().optional(),   // ISO
  assetClasses: z.array(z.enum(["stocks", "options", "futures", "crypto"])).optional(),
  strategies: z.array(z.string()).optional(),
  tickers: z.array(z.string()).optional(),
  userTimezone: z.string().optional(),
})
export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>

// --- RESPONSES ---
export const CardsSummarySchema = z.object({
  net: z.number(),
  realized: z.number(),
  fees: z.number(),
  winRate: z.number(),
  avgWin: z.number(),
  avgLoss: z.number(),
  expectancy: z.number(),
  profitFactor: z.number(),
  tradeCount: z.number(),
  maxDrawdown: z.number(),
  sharpe: z.number(),
  sortino: z.number(),
})
export type CardsSummary = z.infer<typeof CardsSummarySchema>

export const EquityCurvePointSchema = z.object({
  t: z.string().datetime(), // ISO start-of-day
  equity: z.number(),
})
export const EquityCurveResponseSchema = z.object({
  points: z.array(EquityCurvePointSchema),
  initialBalance: z.number(),
  finalBalance: z.number(),
  absoluteReturn: z.number(),
  pctReturn: z.number(),
  maxDrawdown: z.number(),
})
export type EquityCurveResponse = z.infer<typeof EquityCurveResponseSchema>

export const MonthlyPnlMonthSchema = z.object({
  month: z.string(), // YYYY-MM
  realizedPnl: z.number(),
  fees: z.number(),
  netPnl: z.number(),
  tradeCount: z.number(),
  isProfitable: z.boolean(),
})
export const MonthlyPnlResponseSchema = z.object({
  months: z.array(MonthlyPnlMonthSchema),
  totals: z.object({
    realizedPnl: z.number(),
    fees: z.number(),
    netPnl: z.number(),
    tradeCount: z.number(),
  }),
})
export type MonthlyPnlResponse = z.infer<typeof MonthlyPnlResponseSchema>

export const BreakdownItemSchema = z.object({
  key: z.string(),
  value: z.number(),
  label: z.string(),
})
export const BreakdownResponseSchema = z.object({
  items: z.array(BreakdownItemSchema),
})
export type BreakdownResponse<T = any> = { items: T[] }

export const DistributionsResponseSchema = z.object({
  returnPctHistogram: z.array(z.number()),
  rMultipleHistogram: z.array(z.number()),
  mae: z.array(z.number()),
  mfe: z.array(z.number()),
  holdingPeriods: z.array(z.number()),
})
export type DistributionsResponse = z.infer<typeof DistributionsResponseSchema>

export const TimeHeatmapCellSchema = z.object({
  weekday: z.number(), // 0-6
  hour: z.number(),    // 0-23
  winPct: z.number(),
  avgPnl: z.number(),
})
export const TimeHeatmapResponseSchema = z.object({
  cells: z.array(TimeHeatmapCellSchema),
})
export type TimeHeatmapResponse = z.infer<typeof TimeHeatmapResponseSchema>

export const CostsResponseSchema = z.object({
  fees: z.number(),
  slippage: z.number().optional(),
})
export type CostsResponse = z.infer<typeof CostsResponseSchema>

export const BenchmarkPointSchema = z.object({
  t: z.string().datetime(),
  value: z.number(),
})
export const BenchmarkResponseSchema = z.object({
  series: z.array(BenchmarkPointSchema),
  alpha: z.number(),
  beta: z.number(),
})
export type BenchmarkResponse = z.infer<typeof BenchmarkResponseSchema>
