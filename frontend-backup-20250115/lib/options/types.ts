export interface Quote {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: number
}

export interface BSInputs {
  S: number // Underlying price
  K: number // Strike price
  T: number // Time to expiration (years)
  iv: number // Implied volatility
  r: number // Risk-free rate
  q: number // Dividend yield
  type: 'call' | 'put'
}

export interface BSOutputs {
  price: number
  delta: number
  gamma: number
  theta: number // Per day
  vega: number // Per 1 vol point (0.01)
  rho: number // Per 1% rate change
}

export interface IVInputs {
  targetPrice: number
  S: number
  K: number
  T: number
  r: number
  q: number
  type: 'call' | 'put'
}

export type IVResult = {
  kind: 'success'
  iv: number
} | {
  kind: 'unstable_mid'
  iv: number
} | {
  kind: 'no_solution'
  message: string
}

export interface AmericanInputs extends BSInputs {
  dividends?: DividendSchedule
}

export interface AmericanOutputs extends BSOutputs {
  earlyExerciseValue?: number
}

export interface DividendSchedule {
  exDate: string // ISO date string
  amount: number // Dividend amount per share
}

export interface CalculatorState {
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string // ISO date string
  S: number // Underlying price
  iv: number // Implied volatility
  r: number // Risk-free rate
  q: number // Dividend yield
  DTE: number // Days to expiration
  method: 'bs' | 'american-crr' | 'american-fast'
  multiplier: number
  dayCount: 'calendar' | 'trading'
  dividends: DividendSchedule[]
}

export interface CalculatorResults {
  price: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  breakeven: number
  intrinsic: number
  timeValue: number
  earlyExerciseValue?: number
}

export interface ContractMetadata {
  symbol: string
  strike: number
  expiry: string
  type: 'call' | 'put'
  multiplier: number
  style: 'american' | 'european'
  deliverable: string
  adjusted: boolean
  dividends: DividendSchedule[]
}

export interface ChainOption {
  strike: number
  expiry: string
  type: 'call' | 'put'
  bid: number
  ask: number
  mid: number
  last: number
  volume: number
  openInterest: number
  impliedVolatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  multiplier: number
  style: 'american' | 'european'
  deliverable: string
  adjusted: boolean
}

export interface OptionsChain {
  symbol: string
  underlyingPrice: number
  calls: ChainOption[]
  puts: ChainOption[]
  expirations: string[]
  metadata: ContractMetadata[]
}

export interface ChainFilters {
  deltaMax?: number // ≤0.15, ≤0.30, ≤0.50
  moneyness?: 'itm' | 'atm' | 'otm' | 'all'
  spreadMax?: number // ≤5%, ≤10%, ≤20%, ≤50%
  minOI?: number
  minVolume?: number
  weekliesOnly?: boolean
}

export interface TrustSignals {
  bid: number
  ask: number
  mid: number
  spread: number
  spreadPercent: number
  theo: number
  theoMidDiff: number
  estimatedFill: number
  liquidityTier: 'A' | 'B' | 'C'
  confidence: 'high' | 'medium' | 'low'
}

export interface UserPrefs {
  dayCount: 'calendar' | 'trading'
  defaultR: number
  defaultQ: number
  defaultMultiplier: number
  perContract: boolean
  dividendSchedules: Record<string, DividendSchedule[]>
  chainFilters: ChainFilters
}

export type DayCountMode = 'calendar' | 'trading'
export type PricingMethod = 'bs' | 'american-crr' | 'american-fast'
export type UnitsMode = 'per-share' | 'per-contract'
