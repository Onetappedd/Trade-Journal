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
}

export type Position = {
  symbol: string
  quantity: number
  value: number
  category: string
  changePct: number
}

export type RiskMetrics = {
  maxDrawdownPct: number
  sharpe: number
  beta: number
  volPct: number
}

export type RiskEvent = {
  id: string
  at: string
  kind: 'maxLoss' | 'drawdown' | 'gap' | 'ruleBreach'
  details: string
  severity: 'info' | 'warning' | 'critical'
}

export type Integration = {
  name: string
  status: 'connected' | 'needs_auth' | 'error'
  lastSync?: string
}

export type DashboardData = {
  dayPnL: number
  portfolioValue: number
  trades: Trade[]
  positions?: Position[]
  risk?: RiskMetrics
  riskEvents?: RiskEvent[]
  integrations?: Integration[]
}

export type Timeframe = 'today' | 'wtd' | 'mtd' | 'ytd' | 'custom'

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
export const fmtUSD = (n: number) => 
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export const fmtPct = (n: number, digits = 1) => 
  `${(n * 100).toFixed(digits)}%`

export const withSignUSD = (n: number) => 
  `${n >= 0 ? '+' : ''}${fmtUSD(n)}`

// Color mapping for categories
export const colorByCategory: Record<string, string> = {
  Technology: 'bg-sky-400',
  Automotive: 'bg-amber-400',
  Energy: 'bg-lime-400',
  Healthcare: 'bg-rose-400',
  Finance: 'bg-emerald-400',
  Other: 'bg-slate-400',
}
