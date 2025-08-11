// Shared analytics types (frontend contracts)
// Keep names stable across the app

export type AnalyticsFilters = {
  userId: string
  accountIds?: string[]
  // If omitted => all user accounts
  start?: string // ISO date string (inclusive) in user's TZ (YYYY-MM-DD or ISO)
  end?: string // ISO date string (inclusive) in user's TZ (YYYY-MM-DD or ISO)
  assetClasses?: ("stocks" | "options" | "futures")[]
  strategies?: string[] // strategy/tag ids or names
}

export type EquityCurvePoint = {
  t: string // ISO datetime (start-of-day in user TZ)
  equity: number // account currency
}

export type MonthlyPnlPoint = {
  month: string // "YYYY-MM"
  realizedPnl: number
  fees: number
  netPnl: number // realizedPnl - fees
  tradeCount: number
  isProfitable: boolean
}

export type EquityCurveResponse = {
  points: EquityCurvePoint[]
  initialBalance: number
  finalBalance: number
  absoluteReturn: number // final - initial
  pctReturn: number // absoluteReturn / initialBalance
}

export type MonthlyPnlResponse = {
  months: MonthlyPnlPoint[]
  totals: {
    realizedPnl: number
    fees: number
    netPnl: number
    profitableMonths: number
    losingMonths: number
    avgMonthlyNet: number
  }
}

export type CardsSummary = {
  // Any KPI cards (realized P&L, win rate, avg R, fees, etc.)
  realizedPnl: number
  winRate: number
  avgWin: number
  avgLoss: number
  expectancy: number
  grossPnl: number
  fees: number
  netPnl: number
  tradeCount: number
}

// Request payload helpers (server expects filters + optional userTimezone and flags)
export type EquityCurveRequest = AnalyticsFilters & {
  userTimezone?: string
  initialBalance?: number
  includeUnrealized?: boolean // future extension, default false on server
}

export type MonthlyPnlRequest = AnalyticsFilters & {
  userTimezone?: string
}

export type CardsRequest = AnalyticsFilters & {
  userTimezone?: string
}
