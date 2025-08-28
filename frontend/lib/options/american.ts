import { BSInputs, BSOutputs, priceBS, greeksBS } from './blackscholes'

export interface AmericanInputs extends BSInputs {
  // Same as BSInputs
}

export interface AmericanOutputs extends BSOutputs {
  // Same as BSOutputs
}

// Barone-Adesi-Whaley approximation for American options
export function priceAmerican(inputs: AmericanInputs): number {
  const { S, K, T, iv, r, q, type } = inputs

  if (T <= 0) {
    return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
  }

  // For calls, early exercise is only optimal if q > r
  if (type === 'call') {
    if (q <= r) {
      // Early exercise is never optimal, use European price
      return priceBS(inputs)
    }
    return priceAmericanCall(inputs)
  } else {
    // For puts, early exercise can be optimal
    return priceAmericanPut(inputs)
  }
}

function priceAmericanCall(inputs: AmericanInputs): number {
  const { S, K, T, iv, r, q } = inputs

  // Critical stock price for early exercise
  const M = 2 * r / (iv * iv)
  const W = 2 * (r - q) / (iv * iv)
  const K1 = 2 * r / (iv * iv * (1 - Math.exp(-r * T)))

  const q1 = 0.5 * (-(W - 1) + Math.sqrt((W - 1) * (W - 1) + 4 * K1))
  const q2 = 0.5 * (-(W - 1) - Math.sqrt((W - 1) * (W - 1) + 4 * K1))

  const SStar = K / (1 - 2 * q1 / ((q1 - 1) * (q1 - q2)))

  if (S >= SStar) {
    // Early exercise is optimal
    return S - K
  } else {
    // Use European price with adjustment
    const europeanPrice = priceBS(inputs)
    const A1 = (SStar / q1) * (1 - Math.exp((q - r) * T) * normalCDF(d1(SStar, K, T, iv, r, q)))
    const A2 = (SStar / q2) * (1 - Math.exp((q - r) * T) * normalCDF(d1(SStar, K, T, iv, r, q)))
    
    return europeanPrice + A1 * Math.pow(S / SStar, q1) + A2 * Math.pow(S / SStar, q2)
  }
}

function priceAmericanPut(inputs: AmericanInputs): number {
  const { S, K, T, iv, r, q } = inputs

  // Critical stock price for early exercise
  const M = 2 * r / (iv * iv)
  const W = 2 * (r - q) / (iv * iv)
  const K1 = 2 * r / (iv * iv * (1 - Math.exp(-r * T)))

  const q1 = 0.5 * (-(W - 1) + Math.sqrt((W - 1) * (W - 1) + 4 * K1))
  const q2 = 0.5 * (-(W - 1) - Math.sqrt((W - 1) * (W - 1) + 4 * K1))

  const SStar = K / (1 - 2 * q2 / ((q2 - 1) * (q2 - q1)))

  if (S <= SStar) {
    // Early exercise is optimal
    return K - S
  } else {
    // Use European price with adjustment
    const europeanPrice = priceBS(inputs)
    const A1 = -(SStar / q1) * (1 - Math.exp((q - r) * T) * normalCDF(-d1(SStar, K, T, iv, r, q)))
    const A2 = -(SStar / q2) * (1 - Math.exp((q - r) * T) * normalCDF(-d1(SStar, K, T, iv, r, q)))
    
    return europeanPrice + A1 * Math.pow(S / SStar, q1) + A2 * Math.pow(S / SStar, q2)
  }
}

// Helper function for d1 calculation
function d1(S: number, K: number, T: number, iv: number, r: number, q: number): number {
  return (Math.log(S / K) + (r - q + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T))
}

// Normal CDF approximation
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
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

// American Greeks using finite differences
export function greeksAmerican(inputs: AmericanInputs): AmericanOutputs {
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

  const h = 0.001 // Small perturbation for finite differences

  // Delta: ∂P/∂S
  const priceUp = priceAmerican({ ...inputs, S: S + h })
  const priceDown = priceAmerican({ ...inputs, S: S - h })
  const delta = (priceUp - priceDown) / (2 * h)

  // Gamma: ∂²P/∂S²
  const priceCurrent = priceAmerican(inputs)
  const gamma = (priceUp - 2 * priceCurrent + priceDown) / (h * h)

  // Theta: ∂P/∂T (per day)
  const priceTimeUp = priceAmerican({ ...inputs, T: T + h / 365 })
  const theta = (priceTimeUp - priceCurrent) / (h / 365)

  // Vega: ∂P/∂σ (per 1 vol point)
  const priceVolUp = priceAmerican({ ...inputs, iv: iv + 0.01 })
  const priceVolDown = priceAmerican({ ...inputs, iv: iv - 0.01 })
  const vega = (priceVolUp - priceVolDown) / (2 * 0.01)

  // Rho: ∂P/∂r (per 1% rate change)
  const priceRateUp = priceAmerican({ ...inputs, r: r + 0.01 })
  const priceRateDown = priceAmerican({ ...inputs, r: r - 0.01 })
  const rho = (priceRateUp - priceRateDown) / (2 * 0.01)

  return {
    price: priceCurrent,
    delta,
    gamma,
    theta,
    vega,
    rho
  }
}

// Check if early exercise is optimal
export function isEarlyExerciseOptimal(inputs: AmericanInputs): boolean {
  const { S, K, T, iv, r, q, type } = inputs

  if (T <= 0) return false

  if (type === 'call') {
    // For calls, early exercise is only optimal if q > r
    return q > r
  } else {
    // For puts, check if current price is below critical price
    const M = 2 * r / (iv * iv)
    const W = 2 * (r - q) / (iv * iv)
    const K1 = 2 * r / (iv * iv * (1 - Math.exp(-r * T)))

    const q1 = 0.5 * (-(W - 1) + Math.sqrt((W - 1) * (W - 1) + 4 * K1))
    const q2 = 0.5 * (-(W - 1) - Math.sqrt((W - 1) * (W - 1) + 4 * K1))

    const SStar = K / (1 - 2 * q2 / ((q2 - 1) * (q2 - q1)))

    return S <= SStar
  }
}
