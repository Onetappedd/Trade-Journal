export interface Quote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: string
}

export interface ChainOption {
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string
  bid: number | null
  ask: number | null
  last: number | null
  volume: number | null
  openInterest: number | null
  impliedVolatility: number | null
  delta: number | null
  gamma: number | null
  theta: number | null
  vega: number | null
  rho: number | null
}

export interface OptionsChain {
  symbol: string
  underlyingPrice: number
  calls: ChainOption[]
  puts: ChainOption[]
  expirations: string[]
}

export interface Provider {
  name: string
  getQuote(symbol: string): Promise<Quote>
  getOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain>
  streamQuote(symbol: string, onTick: (quote: Quote) => void): () => void
}

export interface MarketDataConfig {
  provider: 'polygon' | 'tradier' | 'alpaca' | 'demo'
  apiKey?: string
  baseUrl?: string
  pollInterval?: number // milliseconds
}

export interface DemoData {
  quotes: Record<string, Quote>
  chains: Record<string, OptionsChain>
}
