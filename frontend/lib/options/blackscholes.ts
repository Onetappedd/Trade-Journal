import { BSOutputs, IVInputs, IVResult, DayCountMode } from './types'
import { getIVCacheKey, getCachedIV, setCachedIV } from './cache'

// Re-export BSInputs from types for backward compatibility
export type { BSInputs } from './types'

// Constants
const EPSILON = 1e-10
const MIN_TIME = 1 / (365 * 24 * 60 * 60) // 1 second in years
const MAX_IV = 5.0
const MIN_IV = 0.01

// Time conversion utilities
export function toT(params: {
  expiry: Date
  now: Date
  mode: DayCountMode
}): number {
  const { expiry, now, mode } = params
  
  if (mode === 'calendar') {
    // Calendar days: exact seconds / (365 * 24 * 3600)
    const secondsDiff = (expiry.getTime() - now.getTime()) / 1000
    return Math.max(secondsDiff / (365 * 24 * 3600), MIN_TIME)
  } else {
    // Trading days: convert to trading years
    const calendarDays = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 3600 * 1000))
    const tradingDays = Math.ceil(calendarDays * 252 / 365) // Approximate trading days
    
    // Add partial day fraction during market hours (9:30 AM - 4:00 PM ET)
    const nowHour = now.getHours()
    const nowMinute = now.getMinutes()
    const marketOpen = 9.5 // 9:30 AM
    const marketClose = 16 // 4:00 PM
    
    let partialDay = 0
    if (nowHour >= marketOpen && nowHour < marketClose) {
      const currentTime = nowHour + nowMinute / 60
      partialDay = (marketClose - currentTime) / (marketClose - marketOpen)
    }
    
    const totalTradingDays = tradingDays + partialDay
    return Math.max(totalTradingDays / 252, MIN_TIME)
  }
}

export function daysToYears(days: number): number {
  return Math.max(days / 365, MIN_TIME)
}

export function yearsToDays(years: number): number {
  return years * 365
}

// Mathematical functions
export function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

export function erf(x: number): number {
  // Approximation of error function
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

// Forward price calculation
export function forwardPrice(S: number, T: number, r: number, q: number): number {
  return S * Math.exp((r - q) * T)
}

// Black-Scholes pricing with forward form
export function priceBS(inputs: BSInputs): number {
  const { S, K, T, iv, r, q, type } = inputs
  
  if (T <= EPSILON) {
    // At expiration, return intrinsic value
    return type === 'call' 
      ? Math.max(S - K, 0)
      : Math.max(K - S, 0)
  }

  const F = forwardPrice(S, T, r, q)
  const d1 = (Math.log(F / K) + 0.5 * iv * iv * T) / (iv * Math.sqrt(T))
  const d2 = d1 - iv * Math.sqrt(T)

  if (type === 'call') {
    return Math.exp(-r * T) * (F * normalCDF(d1) - K * normalCDF(d2))
  } else {
    return Math.exp(-r * T) * (K * normalCDF(-d2) - F * normalCDF(-d1))
  }
}

// Greeks calculation with forward form
export function greeksBS(inputs: BSInputs): BSOutputs {
  const { S, K, T, iv, r, q, type } = inputs
  
  if (T <= EPSILON) {
    // At expiration, Greeks are either 0 or 1
    const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
    const delta = intrinsic > 0 ? (type === 'call' ? 1 : -1) : 0
    
    return {
      price: intrinsic,
      delta,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    }
  }

  const F = forwardPrice(S, T, r, q)
  const d1 = (Math.log(F / K) + 0.5 * iv * iv * T) / (iv * Math.sqrt(T))
  const d2 = d1 - iv * Math.sqrt(T)
  
  const n1 = normalPDF(d1)
  const N1 = normalCDF(type === 'call' ? d1 : -d1)
  const N2 = normalCDF(type === 'call' ? d2 : -d2)

  // Delta
  const delta = Math.exp(-q * T) * N1 * (type === 'call' ? 1 : -1)

  // Gamma
  const gamma = Math.exp(-q * T) * n1 / (S * iv * Math.sqrt(T))

  // Theta (per day)
  const theta = -Math.exp(-r * T) * (
    S * Math.exp(-q * T) * n1 * iv / (2 * Math.sqrt(T)) +
    r * K * N2 * (type === 'call' ? 1 : -1) -
    q * S * Math.exp(-q * T) * N1 * (type === 'call' ? 1 : -1)
  ) / 365

  // Vega (per 1 vol point)
  const vega = S * Math.exp(-q * T) * n1 * Math.sqrt(T) / 100

  // Rho (per 1% rate change)
  const rho = K * T * Math.exp(-r * T) * N2 * (type === 'call' ? 1 : -1) / 100

  return {
    price: priceBS(inputs),
    delta,
    gamma,
    theta,
    vega,
    rho
  }
}

// Robust implied volatility solver
export function impliedVol(inputs: IVInputs, maxIterations = 100, tolerance = 1e-6): IVResult {
  const { targetPrice, S, K, T, r, q, type } = inputs

  if (T <= EPSILON) {
    return { kind: 'no_solution', message: 'Time to expiration too small' }
  }

  // Check cache first
  const cacheKey = getIVCacheKey(inputs)
  const cachedIV = getCachedIV(cacheKey)
  if (cachedIV !== undefined) {
    return { kind: 'success', iv: cachedIV }
  }

  // Check for unstable mid (bid >= ask or spread = 0)
  const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
  if (targetPrice <= intrinsic) {
    return { kind: 'no_solution', message: 'Price below intrinsic value' }
  }

  // Initial guess: 30% volatility
  let iv = 0.3
  let iteration = 0

  // Newton-Raphson with bracketed bisection fallback
  while (iteration < maxIterations) {
    const currentPrice = priceBS({ S, K, T, iv, r, q, type })
    const diff = targetPrice - currentPrice

    if (Math.abs(diff) < tolerance) {
      setCachedIV(cacheKey, iv)
      return { kind: 'success', iv }
    }

    // Vega for derivative
    const F = forwardPrice(S, T, r, q)
    const d1 = (Math.log(F / K) + 0.5 * iv * iv * T) / (iv * Math.sqrt(T))
    const n1 = normalPDF(d1)
    const vega = S * Math.exp(-q * T) * n1 * Math.sqrt(T)

    if (Math.abs(vega) < EPSILON) {
      break // Avoid division by zero, fall back to bisection
    }

    const newIv = iv + diff / vega

    // Ensure volatility stays within bounds
    if (newIv <= MIN_IV) {
      iv = MIN_IV
    } else if (newIv >= MAX_IV) {
      iv = MAX_IV
    } else {
      iv = newIv
    }

    iteration++
  }

  // Fallback to bisection if Newton-Raphson fails
  return impliedVolBisection(inputs, cacheKey)
}

// Bisection method for implied volatility
function impliedVolBisection(inputs: IVInputs, cacheKey: string): IVResult {
  const { targetPrice, S, K, T, r, q, type } = inputs

  let low = MIN_IV
  let high = MAX_IV
  let mid = 0.3

  for (let i = 0; i < 50; i++) {
    mid = (low + high) / 2
    const price = priceBS({ S, K, T, iv: mid, r, q, type })

    if (Math.abs(price - targetPrice) < 1e-6) {
      setCachedIV(cacheKey, mid)
      return { kind: 'success', iv: mid }
    }

    if (price < targetPrice) {
      low = mid
    } else {
      high = mid
    }
  }

  // Check if we have a reasonable solution
  const finalPrice = priceBS({ S, K, T, iv: mid, r, q, type })
  const spread = Math.abs(finalPrice - targetPrice) / targetPrice

  if (spread > 0.1) {
    return { kind: 'no_solution', message: 'Unable to find valid IV solution' }
  }

  setCachedIV(cacheKey, mid)
  return { kind: 'unstable_mid', iv: mid }
}

// Helper functions
export function timeValue(inputs: BSInputs): number {
  const intrinsic = inputs.type === 'call' 
    ? Math.max(inputs.S - inputs.K, 0)
    : Math.max(inputs.K - inputs.S, 0)
  
  return priceBS(inputs) - intrinsic
}

export function isInTheMoney(S: number, K: number, type: 'call' | 'put'): boolean {
  return type === 'call' ? S > K : S < K
}

export function moneyness(S: number, K: number): number {
  return S / K
}

// Trust signals calculation
export function calculateTrustSignals(
  bid: number,
  ask: number,
  theo: number,
  oi: number,
  volume: number
): {
  mid: number
  spread: number
  spreadPercent: number
  theoMidDiff: number
  estimatedFill: number
  liquidityTier: 'A' | 'B' | 'C'
  confidence: 'high' | 'medium' | 'low'
} {
  const mid = (bid + ask) / 2
  const spread = ask - bid
  const spreadPercent = (spread / mid) * 100

  // Determine liquidity tier
  let liquidityTier: 'A' | 'B' | 'C'
  let k: number

  if (oi > 2000 && volume > 500) {
    liquidityTier = 'A'
    k = 0.15
  } else if (oi > 500 && volume > 100) {
    liquidityTier = 'B'
    k = 0.25
  } else {
    liquidityTier = 'C'
    k = 0.35
  }

  const theoMidDiff = theo - mid
  const estimatedFill = mid + (k * spread * (theo > mid ? 1 : -1))

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low'
  if (spreadPercent < 5 && oi > 1000) {
    confidence = 'high'
  } else if (spreadPercent < 20 && oi > 100) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    mid,
    spread,
    spreadPercent,
    theoMidDiff,
    estimatedFill,
    liquidityTier,
    confidence
  }
}
