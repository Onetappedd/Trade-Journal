import { cn } from '@/lib/utils'

// Format number with tabular numerals and optional sign
export function formatNumber(
  value: number, 
  decimals: number = 2, 
  showSign: boolean = false,
  showColor: boolean = false
): string {
  const absValue = Math.abs(value)
  const sign = value >= 0 ? '+' : '-'
  
  let formatted = absValue.toFixed(decimals)
  
  // Add thousands separators
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  formatted = parts.join('.')
  
  if (showSign && value !== 0) {
    formatted = `${sign}${formatted}`
  }
  
  return formatted
}

// Format percentage
export function formatPercent(
  value: number, 
  decimals: number = 2, 
  showSign: boolean = true
): string {
  return formatNumber(value * 100, decimals, showSign) + '%'
}

// Format currency
export function formatCurrency(
  value: number, 
  decimals: number = 2, 
  showSign: boolean = false
): string {
  return '$' + formatNumber(value, decimals, showSign)
}

// Format with color based on value
export function formatWithColor(
  value: number,
  options: { decimals?: number; showSign?: boolean } = {}
): { text: string; className: string } {
  const text = formatNumber(value, options.decimals, options.showSign)
  
  let className = 'tabular-nums'
  if (value > 0) {
    className += ' text-green-600'
  } else if (value < 0) {
    className += ' text-red-600'
  }
  
  return { text, className }
}

// Format Greeks with appropriate units and colors
export function formatGreeks(
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
  },
  perContract: boolean = false,
  multiplier: number = 100
): {
  delta: { text: string; className: string; tooltip: string }
  gamma: { text: string; className: string; tooltip: string }
  theta: { text: string; className: string; tooltip: string }
  vega: { text: string; className: string; tooltip: string }
  rho: { text: string; className: string; tooltip: string }
} {
  const scale = perContract ? multiplier : 1
  
  return {
    delta: {
      text: formatNumber(greeks.delta * scale, 4),
      className: cn('tabular-nums', greeks.delta > 0 ? 'text-green-600' : 'text-red-600'),
      tooltip: `Change in option price per $1 change in underlying price${perContract ? ' (per contract)' : ' (per share)'}`
    },
    gamma: {
      text: formatNumber(greeks.gamma * scale, 6),
      className: 'tabular-nums text-blue-600',
      tooltip: `Change in delta per $1 change in underlying price${perContract ? ' (per contract)' : ' (per share)'}`
    },
    theta: {
      text: formatNumber(greeks.theta * scale, 4, true),
      className: cn('tabular-nums', greeks.theta < 0 ? 'text-red-600' : 'text-green-600'),
      tooltip: `Change in option price per day${perContract ? ' (per contract)' : ' (per share)'}`
    },
    vega: {
      text: formatNumber(greeks.vega * scale, 4),
      className: 'tabular-nums text-purple-600',
      tooltip: `Change in option price per 1% change in implied volatility${perContract ? ' (per contract)' : ' (per share)'}`
    },
    rho: {
      text: formatNumber(greeks.rho * scale, 4, true),
      className: cn('tabular-nums', greeks.rho > 0 ? 'text-green-600' : 'text-red-600'),
      tooltip: `Change in option price per 1% change in risk-free rate${perContract ? ' (per contract)' : ' (per share)'}`
    }
  }
}

// Format option type
export function formatOptionType(type: 'call' | 'put'): { text: string; className: string } {
  return {
    text: type.toUpperCase(),
    className: type === 'call' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
  }
}

// Format moneyness
export function formatMoneyness(moneyness: number): { text: string; className: string } {
  const percent = (moneyness - 1) * 100
  const text = formatPercent(percent, 1, true)
  
  let className = 'tabular-nums'
  if (moneyness > 1.05) {
    className += ' text-green-600' // Deep ITM
  } else if (moneyness > 0.95) {
    className += ' text-yellow-600' // Near ATM
  } else {
    className += ' text-red-600' // OTM
  }
  
  return { text, className }
}

// Format time to expiration
export function formatDTE(days: number): string {
  if (days < 1) {
    return '< 1 day'
  } else if (days < 7) {
    return `${Math.round(days)} days`
  } else if (days < 30) {
    const weeks = Math.round(days / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''}`
  } else {
    const months = Math.round(days / 30)
    return `${months} month${months !== 1 ? 's' : ''}`
  }
}

// Format implied volatility
export function formatIV(iv: number): string {
  return formatPercent(iv, 1)
}

// Format option price with bid/ask spread
export function formatOptionPrice(
  bid: number | null,
  ask: number | null,
  last: number | null = null
): { mid: string; spread: string; className: string } {
  if (bid === null || ask === null) {
    return {
      mid: last ? formatCurrency(last) : 'N/A',
      spread: 'N/A',
      className: 'text-muted-foreground'
    }
  }
  
  const mid = (bid + ask) / 2
  const spread = ask - bid
  const spreadPercent = (spread / mid) * 100
  
  let className = 'tabular-nums'
  if (spreadPercent > 10) {
    className += ' text-red-600' // Wide spread
  } else if (spreadPercent > 5) {
    className += ' text-yellow-600' // Moderate spread
  } else {
    className += ' text-green-600' // Tight spread
  }
  
  return {
    mid: formatCurrency(mid),
    spread: formatCurrency(spread),
    className
  }
}

// Format volume and open interest
export function formatVolume(volume: number | null): string {
  if (volume === null) return 'N/A'
  
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`
  }
  return volume.toString()
}

// Format strike price
export function formatStrike(strike: number): string {
  return formatCurrency(strike, 2)
}

// Format expiration date
export function formatExpiration(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// Format expiration for sorting (YYYY-MM-DD)
export function formatExpirationSort(date: string | Date): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}
