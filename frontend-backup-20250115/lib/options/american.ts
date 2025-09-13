import { AmericanInputs, AmericanOutputs, DividendSchedule } from './types'
import { priceBS, greeksBS, normalCDF, normalPDF, forwardPrice } from './blackscholes'
import { getPricingCacheKey, getCachedPricing, setCachedPricing } from './cache'

// Constants
const EPSILON = 1e-10
const MIN_STEPS = 500
const MAX_STEPS = 1000

// CRR Binomial Tree for American Options with Discrete Dividends
export function priceAmericanCRR(inputs: AmericanInputs & { method?: string }): number {
  const { S, K, T, iv, r, q, type, dividends = [] } = inputs
  
  if (T <= EPSILON) {
    return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
  }

  // Check cache first
  const cacheKey = getPricingCacheKey({ ...inputs, method: 'american-crr' })
  const cached = getCachedPricing(cacheKey)
  if (cached) {
    return cached.price
  }

  // Determine number of steps (more steps for longer time or higher volatility)
  const steps = Math.min(MAX_STEPS, Math.max(MIN_STEPS, Math.ceil(T * 252 * 2)))
  const dt = T / steps

  // CRR parameters
  const u = Math.exp(iv * Math.sqrt(dt))
  const d = 1 / u
  const p = (Math.exp((r - q) * dt) - d) / (u - d)

  // Adjust for dividends
  const dividendArray = Array.isArray(dividends) ? dividends : []
  const dividendNodes = dividendArray
    .filter((div: DividendSchedule) => new Date(div.exDate) > new Date())
    .map((div: DividendSchedule) => ({
      time: (new Date(div.exDate).getTime() - new Date().getTime()) / (365 * 24 * 3600 * 1000),
      amount: div.amount
    }))
    .sort((a: any, b: any) => a.time - b.time)

  // Build tree
  const tree: number[][] = []
  let currentPrice = S

  // Adjust for dividends before each node
  for (let i = 0; i <= steps; i++) {
    const time = i * dt
    let adjustedPrice = currentPrice

    // Apply dividends that occur before this time
    for (const div of dividendNodes) {
      if (div.time <= time) {
        adjustedPrice -= div.amount * Math.exp(-q * (time - div.time))
      }
    }

    tree[i] = []
    for (let j = 0; j <= i; j++) {
      const price = adjustedPrice * Math.pow(u, j) * Math.pow(d, i - j)
      tree[i][j] = price
    }
  }

  // Calculate option values at expiration
  const optionValues: number[][] = []
  for (let j = 0; j <= steps; j++) {
    const price = tree[steps][j]
    const intrinsic = type === 'call' ? Math.max(price - K, 0) : Math.max(K - price, 0)
    optionValues[steps] = optionValues[steps] || []
    optionValues[steps][j] = intrinsic
  }

  // Backward induction
  for (let i = steps - 1; i >= 0; i--) {
    optionValues[i] = []
    for (let j = 0; j <= i; j++) {
      const price = tree[i][j]
      const intrinsic = type === 'call' ? Math.max(price - K, 0) : Math.max(K - price, 0)
      
      // European value (discounted expected value)
      const europeanValue = Math.exp(-r * dt) * (
        p * optionValues[i + 1][j + 1] + (1 - p) * optionValues[i + 1][j]
      )

      // American value (max of European and intrinsic)
      optionValues[i][j] = Math.max(europeanValue, intrinsic)
    }
  }

  const result = optionValues[0][0]
  setCachedPricing(cacheKey, { price: result, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 })
  return result
}

// Greeks for American options using finite differences
export function greeksAmericanCRR(inputs: AmericanInputs): AmericanOutputs {
  const { S, K, T, iv, r, q, type } = inputs
  
  if (T <= EPSILON) {
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

  const h = 0.01 // Small perturbation for finite differences
  const price = priceAmericanCRR(inputs)

  // Delta: ∂P/∂S
  const delta = (priceAmericanCRR({ ...inputs, S: S + h }) - 
                 priceAmericanCRR({ ...inputs, S: S - h })) / (2 * h)

  // Gamma: ∂²P/∂S²
  const gamma = (priceAmericanCRR({ ...inputs, S: S + h }) - 
                 2 * price + 
                 priceAmericanCRR({ ...inputs, S: S - h })) / (h * h)

  // Theta: ∂P/∂T (per day)
  const theta = -(priceAmericanCRR({ ...inputs, T: T + h / 365 }) - 
                  priceAmericanCRR({ ...inputs, T: T - h / 365 })) / (2 * h / 365)

  // Vega: ∂P/∂σ (per 1 vol point)
  const vega = (priceAmericanCRR({ ...inputs, iv: iv + h / 100 }) - 
                priceAmericanCRR({ ...inputs, iv: iv - h / 100 })) / (2 * h / 100)

  // Rho: ∂P/∂r (per 1% rate change)
  const rho = (priceAmericanCRR({ ...inputs, r: r + h / 100 }) - 
               priceAmericanCRR({ ...inputs, r: r - h / 100 })) / (2 * h / 100)

  return {
    price,
    delta,
    gamma,
    theta,
    vega,
    rho
  }
}

// Barone-Adesi-Whaley approximation (fast method)
export function priceAmericanBAW(inputs: AmericanInputs): number {
  const { S, K, T, iv, r, q, type } = inputs
  
  if (T <= EPSILON) {
    return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
  }

  // Check cache first
  const cacheKey = getPricingCacheKey({ ...inputs, method: 'american-baw' })
  const cached = getCachedPricing(cacheKey)
  if (cached) {
    return cached.price
  }

  if (type === 'call') {
    return priceAmericanCallBAW(inputs)
  } else {
    return priceAmericanPutBAW(inputs)
  }
}

function priceAmericanCallBAW(inputs: AmericanInputs): number {
  const { S, K, T, iv, r, q } = inputs
  
  // Early exercise is never optimal for calls on non-dividend paying stocks
  if (q <= 0) {
    return priceBS(inputs)
  }

  const M = 2 * r / (iv * iv)
  const N = 2 * q / (iv * iv)
  const k = 1 - Math.exp(-r * T)
  
  const q1 = 0.5 * (-(N - 1) + Math.sqrt((N - 1) * (N - 1) + 4 * M / k))
  const q2 = 0.5 * (-(N - 1) - Math.sqrt((N - 1) * (N - 1) + 4 * M / k))

  const SStar = K / (1 - 2 * q1 / ((1 - Math.exp(-q * T)) * (1 - q1)))
  
  if (S >= SStar) {
    // Early exercise is optimal
    return S - K
  } else {
    // European value plus early exercise premium
    const european = priceBS(inputs)
    const A1 = (SStar / q1) * (1 - Math.exp(-q * T) * normalCDF(d1(SStar, K, T, iv, r, q)))
    const A2 = (SStar / q2) * (1 - Math.exp(-q * T) * normalCDF(d1(SStar, K, T, iv, r, q)))
    
    return european + A1 * Math.pow(S / SStar, q1) + A2 * Math.pow(S / SStar, q2)
  }
}

function priceAmericanPutBAW(inputs: AmericanInputs): number {
  const { S, K, T, iv, r, q } = inputs
  
  const M = 2 * r / (iv * iv)
  const N = 2 * q / (iv * iv)
  const k = 1 - Math.exp(-r * T)
  
  const q1 = 0.5 * (-(N - 1) + Math.sqrt((N - 1) * (N - 1) + 4 * M / k))
  const q2 = 0.5 * (-(N - 1) - Math.sqrt((N - 1) * (N - 1) + 4 * M / k))

  const SStar = K / (1 - 2 * q2 / ((1 - Math.exp(-q * T)) * (1 - q2)))
  
  if (S <= SStar) {
    // Early exercise is optimal
    return K - S
  } else {
    // European value plus early exercise premium
    const european = priceBS(inputs)
    const A1 = -(SStar / q1) * (1 - Math.exp(-q * T) * normalCDF(-d1(SStar, K, T, iv, r, q)))
    const A2 = -(SStar / q2) * (1 - Math.exp(-q * T) * normalCDF(-d1(SStar, K, T, iv, r, q)))
    
    return european + A1 * Math.pow(S / SStar, q1) + A2 * Math.pow(S / SStar, q2)
  }
}

// Helper function for BAW
function d1(S: number, K: number, T: number, iv: number, r: number, q: number): number {
  const F = forwardPrice(S, T, r, q)
  return (Math.log(F / K) + 0.5 * iv * iv * T) / (iv * Math.sqrt(T))
}

// Greeks for BAW using finite differences
export function greeksAmericanBAW(inputs: AmericanInputs): AmericanOutputs {
  const { S, K, T, iv, r, q, type } = inputs
  
  if (T <= EPSILON) {
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

  const h = 0.01
  const price = priceAmericanBAW(inputs)

  // Delta
  const delta = (priceAmericanBAW({ ...inputs, S: S + h }) - 
                 priceAmericanBAW({ ...inputs, S: S - h })) / (2 * h)

  // Gamma
  const gamma = (priceAmericanBAW({ ...inputs, S: S + h }) - 
                 2 * price + 
                 priceAmericanBAW({ ...inputs, S: S - h })) / (h * h)

  // Theta (per day)
  const theta = -(priceAmericanBAW({ ...inputs, T: T + h / 365 }) - 
                  priceAmericanBAW({ ...inputs, T: T - h / 365 })) / (2 * h / 365)

  // Vega (per 1 vol point)
  const vega = (priceAmericanBAW({ ...inputs, iv: iv + h / 100 }) - 
                priceAmericanBAW({ ...inputs, iv: iv - h / 100 })) / (2 * h / 100)

  // Rho (per 1% rate change)
  const rho = (priceAmericanBAW({ ...inputs, r: r + h / 100 }) - 
               priceAmericanBAW({ ...inputs, r: r - h / 100 })) / (2 * h / 100)

  return {
    price,
    delta,
    gamma,
    theta,
    vega,
    rho
  }
}

// Main pricing function that selects method
export function priceAmerican(inputs: AmericanInputs & { method?: string }): number {
  switch (inputs.method) {
    case 'american-crr':
      return priceAmericanCRR(inputs)
    case 'american-fast':
      return priceAmericanBAW(inputs)
    default:
      return priceBS(inputs)
  }
}

// Main Greeks function
export function greeksAmerican(inputs: AmericanInputs & { method?: string }): AmericanOutputs {
  switch (inputs.method) {
    case 'american-crr':
      return greeksAmericanCRR(inputs)
    case 'american-fast':
      return greeksAmericanBAW(inputs)
    default:
      return greeksBS(inputs)
  }
}

// Check if early exercise is optimal
export function isEarlyExerciseOptimal(inputs: AmericanInputs): boolean {
  const { S, K, type, dividends = [] } = inputs
  const dividendArray = Array.isArray(dividends) ? dividends : []
  
  if (type === 'call') {
    // For calls, early exercise is optimal only if there are dividends
    return dividendArray.length > 0 && dividendArray.some((div: DividendSchedule) => 
      new Date(div.exDate) > new Date()
    )
  } else {
    // For puts, early exercise can be optimal even without dividends
    // This is a simplified check - in practice, it depends on interest rates
    return S < K * 0.8 // Rough heuristic
  }
}

// Calculate early exercise value
export function earlyExerciseValue(inputs: AmericanInputs): number {
  const { S, K, type } = inputs
  return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
}
