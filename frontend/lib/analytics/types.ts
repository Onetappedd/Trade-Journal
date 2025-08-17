import { z } from "zod"

// Filters sent to analytics endpoints
export const AnalyticsFiltersSchema = z.object({
  datePreset: z.enum(['1W','1M','3M','YTD','1Y','ALL','CUSTOM']),
  dateRange: z.object({ start: z.string().optional(), end: z.string().optional() }).optional(),
  accountIds: z.array(z.string()).default([]),
  assetClasses: z.array(z.enum(['stocks','options','crypto'])).default([]),
  tags: z.array(z.string()).default([]),
  strategies: z.array(z.string()).default([]),
  symbols: z.array(z.string()).default([]),
  timezone: z.string(),
}).strict()
export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>

// Cards / KPIs summary
export const CardsSummarySchema = z.object({
  ok: z.boolean(),
  data: z.object({
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
})
export type CardsSummary = z.infer<typeof CardsSummarySchema>

// Equity curve response
export const EquityPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  percentChange: z.number(),
  dollarChange: z.number(),
})
export const EquityCurveResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(EquityPointSchema),
})
export type EquityCurveResponse = z.infer<typeof EquityCurveResponseSchema>

// Monthly PnL
export const MonthlyPnlItemSchema = z.object({
  month: z.string(),
  pnl: z.number(),
  trades: z.number().optional(),
})
export const MonthlyPnlResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(MonthlyPnlItemSchema)
})
export type MonthlyPnlResponse = z.infer<typeof MonthlyPnlResponseSchema>

// Generic breakdown response factory
export const breakdownResponseSchema = <T extends z.ZodTypeAny>(item: T) => z.object({
  ok: z.boolean(),
  data: z.array(item)
})
export type BreakdownResponse<T> = { ok: true; data: T[] }

// Distributions / histogram-like response
export const DistributionItemSchema = z.object({
  bucket: z.union([z.string(), z.number()]),
  count: z.number(),
  value: z.number().optional(),
})
export const DistributionsResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(DistributionItemSchema)
})
export type DistributionsResponse = z.infer<typeof DistributionsResponseSchema>

// Time heatmap
export const TimeHeatmapItemSchema = z.object({
  day: z.string(), // YYYY-MM-DD
  hour: z.number().int().min(0).max(23),
  value: z.number(),
})
export const TimeHeatmapResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(TimeHeatmapItemSchema)
})
export type TimeHeatmapResponse = z.infer<typeof TimeHeatmapResponseSchema>

// Costs response
export const CostItemSchema = z.object({
  type: z.string(), // e.g., 'commissions', 'borrow', 'slippage'
  amount: z.number(),
})
export const CostsResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(CostItemSchema)
})
export type CostsResponse = z.infer<typeof CostsResponseSchema>

// Benchmark response
export const BenchmarkPointSchema = z.object({
  date: z.string(),
  value: z.number(),
})
export const BenchmarkResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(BenchmarkPointSchema)
})
export type BenchmarkResponse = z.infer<typeof BenchmarkResponseSchema>
