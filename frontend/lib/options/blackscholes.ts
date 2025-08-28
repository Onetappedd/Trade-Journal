export interface BSInputs {
  S: number // Current stock price
  K: number // Strike price
  T: number // Time to expiration (years)
  iv: number // Implied volatility (decimal)
  r: number // Risk-free rate (decimal)
  q: number // Dividend yield (decimal)
  type: 'call' | 'put'
}

export interface BSOutputs {
  price: number
  delta: number
  gamma: number
  theta: number // per day
  vega: number // per 1 vol point (0.01)
  rho: number
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

// Convert days to years using 365-day year
export function daysToYears(days: number): number {
  return Math.max(days / 365, 0.01) // Minimum 0.01 years for numerical stability
}

// Convert years to days
export function yearsToDays(years: number): number {
  return Math.round(years * 365)
}

// Normal distribution functions
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

// Error function approximation
function erf(x: number): number {
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

// Black-Scholes price calculation
export function priceBS(inputs: BSInputs): number {
  const { S, K, T, iv, r, q, type } = inputs

  if (T <= 0) {
    return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
  }

  const d1 = (Math.log(S / K) + (r - q + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T))
  const d2 = d1 - iv * Math.sqrt(T)

  if (type === 'call') {
    return S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2)
  } else {
    return K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1)
  }
}

// Black-Scholes Greeks calculation
export function greeksBS(inputs: BSInputs): BSOutputs {
  const { S, K, T, iv, r, q, type } = inputs

  if (T <= 0) {
    const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
    return {
      price: intrinsic,
      delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    }
  }

  const d1 = (Math.log(S / K) + (r - q + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T))
  const d2 = d1 - iv * Math.sqrt(T)

  const N1 = normalCDF(d1)
  const N2 = normalCDF(d2)
  const n1 = normalPDF(d1)

  let delta: number
  let theta: number
  let rho: number

  if (type === 'call') {
    delta = Math.exp(-q * T) * N1
    theta = (-S * Math.exp(-q * T) * n1 * iv) / (2 * Math.sqrt(T)) - 
            r * K * Math.exp(-r * T) * N2 + 
            q * S * Math.exp(-q * T) * N1
    rho = K * T * Math.exp(-r * T) * N2
  } else {
    delta = Math.exp(-q * T) * (N1 - 1)
    theta = (-S * Math.exp(-q * T) * n1 * iv) / (2 * Math.sqrt(T)) + 
            r * K * Math.exp(-r * T) * normalCDF(-d2) - 
            q * S * Math.exp(-q * T) * normalCDF(-d1)
    rho = -K * T * Math.exp(-r * T) * normalCDF(-d2)
  }

  const gamma = Math.exp(-q * T) * n1 / (S * iv * Math.sqrt(T))
  const vega = S * Math.exp(-q * T) * n1 * Math.sqrt(T)

  return {
    price: priceBS(inputs),
    delta,
    gamma,
    theta: theta / 365, // Convert to per day
    vega: vega / 100, // Convert to per 1 vol point (0.01)
    rho: rho / 100 // Convert to per 1% rate change
  }
}

// Implied volatility calculation using Newton-Raphson method
export function impliedVol(inputs: IVInputs, maxIterations = 100, tolerance = 1e-6): number {
  const { targetPrice, S, K, T, r, q, type } = inputs

  if (T <= 0) {
    return 0
  }

  // Initial guess: 30% volatility
  let iv = 0.3
  let iteration = 0

  while (iteration < maxIterations) {
    const currentPrice = priceBS({ S, K, T, iv, r, q, type })
    const diff = targetPrice - currentPrice

    if (Math.abs(diff) < tolerance) {
      return iv
    }

    // Vega for derivative
    const d1 = (Math.log(S / K) + (r - q + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T))
    const n1 = normalPDF(d1)
    const vega = S * Math.exp(-q * T) * n1 * Math.sqrt(T)

    if (Math.abs(vega) < 1e-10) {
      break // Avoid division by zero
    }

    const newIv = iv + diff / vega

    // Ensure volatility stays positive
    if (newIv <= 0) {
      iv = iv / 2
    } else {
      iv = newIv
    }

    iteration++
  }

  // Fallback to bisection if Newton-Raphson fails
  return impliedVolBisection(inputs)
}

// Bisection method for implied volatility
function impliedVolBisection(inputs: IVInputs): number {
  const { targetPrice, S, K, T, r, q, type } = inputs

  let low = 0.001
  let high = 5.0 // 500% volatility
  let mid = 0.3 // Default value

  for (let i = 0; i < 50; i++) {
    mid = (low + high) / 2
    const price = priceBS({ S, K, T, iv: mid, r, q, type })

    if (Math.abs(price - targetPrice) < 1e-6) {
      return mid
    }

    if (price < targetPrice) {
      low = mid
    } else {
      high = mid
    }
  }

  return mid
}

// Helper function to calculate time value
export function timeValue(inputs: BSInputs): number {
  const intrinsic = inputs.type === 'call' 
    ? Math.max(inputs.S - inputs.K, 0)
    : Math.max(inputs.K - inputs.S, 0)
  
  return priceBS(inputs) - intrinsic
}

// Helper function to check if option is in-the-money
export function isInTheMoney(S: number, K: number, type: 'call' | 'put'): boolean {
  return type === 'call' ? S > K : S < K
}

// Helper function to calculate moneyness
export function moneyness(S: number, K: number): number {
  return S / K
}
