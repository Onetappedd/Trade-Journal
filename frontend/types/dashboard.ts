// Dashboard Types
export type Side = 'buy' | 'sell'

export type Trade = {
  id: string
  symbol: string
  side: Side
  quantity: number
  price: number
  pnl: number
  openedAt?: string
  closedAt?: string
  strategy?: string
  noteCount?: number
}

export type Position = {
  symbol: string
  quantity: number
  value: number
  category: string // e.g., 'Stocks' | 'Options' | 'Futures' | 'Crypto' | 'Technology' | etc
  changePct: number
}

export type RiskSummary = {
  maxDrawdownPct: number
  sharpe: number
  beta: number
  volPct: number
}

export type RiskEvent = {
  id: string
  at: string // ISO
  kind: 'maxLoss' | 'drawdown' | 'gap' | 'ruleBreach'
  details: string
  severity: 'info' | 'warning' | 'critical'
}

export type IntegrationStatus = {
  name: string
  status: 'connected' | 'needs_auth' | 'error'
  lastSync?: string
}

export type BrokerData = {
  accounts: Array<{
    account_id: string
    name: string
    number: string
    institution_name: string
    total_value: number | null
    currency: string | null
    last_successful_holdings_sync: string | null
  }>
  totalValue: number
  lastSync: string | null
}

export type DashboardData = {
  dayPnL: number
  portfolioValue: number
  trades: Trade[]
  positions: Position[]
  risk: RiskSummary
  riskEvents?: RiskEvent[]
  integrations?: IntegrationStatus[]
  brokerData?: BrokerData
  // series (optional; if not provided we derive from trades)
  dailyPnlSeries?: { t: string; pnl: number }[]
  cumPnlSeries?: { t: string; pnl: number }[]
}

export type Timeframe = 'today' | 'wtd' | 'mtd' | 'ytd' | 'all' | 'custom'

export type CustomRange = {
  start: Date
  end: Date
}

// Chart data types
export type ChartDataPoint = {
  dateLabel: string
  date: Date
  daily: number
  cum: number
}

// Formatting helpers
export const fmtUSD = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(n)) {
    return '$0.00'
  }
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export const fmtPct = (n: number | null | undefined, digits = 1) => {
  if (n === null || n === undefined || isNaN(n)) {
    return '0.0%'
  }
  return `${(n * 100).toFixed(digits)}%`
}

export const withSignUSD = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(n)) {
    return '$0.00'
  }
  return `${n >= 0 ? '+' : ''}${fmtUSD(n)}`
}

// Color mapping for categories
export const CATEGORY_COLORS: Record<string, string> = {
  Stocks: '#60a5fa',     // tailwind sky-400
  Options: '#f59e0b',    // amber-500
  Futures: '#34d399',    // emerald-400
  Crypto: '#a78bfa',     // violet-400
  Technology: '#60a5fa',
  Automotive: '#f59e0b',
  Energy: '#84cc16',     // lime-500
  Healthcare: '#fb7185', // rose-400
  Finance: '#10b981',    // emerald-500
  Other: '#94a3b8',      // slate-400
}
