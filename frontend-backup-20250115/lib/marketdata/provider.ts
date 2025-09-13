import { Provider, Quote, OptionsChain, ChainOption, MarketDataConfig } from './types'

// Demo data for testing
const DEMO_QUOTES: Record<string, Quote> = {
  'AAPL': {
    symbol: 'AAPL',
    price: 175.43,
    change: 2.34,
    changePercent: 0.0135,
    volume: 45000000,
    high: 176.20,
    low: 173.80,
    open: 174.50,
    previousClose: 173.09,
    timestamp: new Date().toISOString()
  },
  'TSLA': {
    symbol: 'TSLA',
    price: 248.50,
    change: -5.20,
    changePercent: -0.0205,
    volume: 85000000,
    high: 252.30,
    low: 245.10,
    open: 250.80,
    previousClose: 253.70,
    timestamp: new Date().toISOString()
  },
  'NVDA': {
    symbol: 'NVDA',
    price: 485.09,
    change: 12.45,
    changePercent: 0.0263,
    volume: 35000000,
    high: 487.50,
    low: 480.20,
    open: 482.30,
    previousClose: 472.64,
    timestamp: new Date().toISOString()
  }
}

// Generate demo options chain
function generateDemoChain(symbol: string, underlyingPrice: number): OptionsChain {
  const expirations = [
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 month
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months
  ]

  const strikes = [
    Math.round(underlyingPrice * 0.9), // 10% OTM
    Math.round(underlyingPrice * 0.95), // 5% OTM
    Math.round(underlyingPrice), // ATM
    Math.round(underlyingPrice * 1.05), // 5% ITM
    Math.round(underlyingPrice * 1.1), // 10% ITM
  ]

  const calls: ChainOption[] = strikes.map(strike => ({
    symbol: `${symbol}${expirations[0].replace(/-/g, '')}C${strike}000`,
    type: 'call',
    strike,
    expiry: expirations[0],
    bid: Math.max(0, underlyingPrice - strike) + 2.5,
    ask: Math.max(0, underlyingPrice - strike) + 3.0,
    last: Math.max(0, underlyingPrice - strike) + 2.75,
    volume: Math.floor(Math.random() * 1000) + 100,
    openInterest: Math.floor(Math.random() * 5000) + 500,
    impliedVolatility: 0.25 + Math.random() * 0.2,
    delta: Math.random() * 0.8 + 0.1,
    gamma: Math.random() * 0.02,
    theta: -(Math.random() * 0.1 + 0.05),
    vega: Math.random() * 0.5 + 0.1,
    rho: Math.random() * 0.1 - 0.05
  }))

  const puts: ChainOption[] = strikes.map(strike => ({
    symbol: `${symbol}${expirations[0].replace(/-/g, '')}P${strike}000`,
    type: 'put',
    strike,
    expiry: expirations[0],
    bid: Math.max(0, strike - underlyingPrice) + 2.0,
    ask: Math.max(0, strike - underlyingPrice) + 2.5,
    last: Math.max(0, strike - underlyingPrice) + 2.25,
    volume: Math.floor(Math.random() * 800) + 50,
    openInterest: Math.floor(Math.random() * 4000) + 300,
    impliedVolatility: 0.25 + Math.random() * 0.2,
    delta: -(Math.random() * 0.8 + 0.1),
    gamma: Math.random() * 0.02,
    theta: -(Math.random() * 0.1 + 0.05),
    vega: Math.random() * 0.5 + 0.1,
    rho: -(Math.random() * 0.1 + 0.05)
  }))

  return {
    symbol,
    underlyingPrice,
    calls,
    puts,
    expirations
  }
}

// Demo provider
class DemoProvider implements Provider {
  name = 'Demo'

  async getQuote(symbol: string): Promise<Quote> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const quote = DEMO_QUOTES[symbol.toUpperCase()]
    if (!quote) {
      throw new Error(`Symbol ${symbol} not found in demo data`)
    }
    
    // Add some random variation to simulate live data
    const variation = (Math.random() - 0.5) * 0.01 // ±0.5%
    return {
      ...quote,
      price: quote.price * (1 + variation),
      timestamp: new Date().toISOString()
    }
  }

  async getOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const quote = await this.getQuote(symbol)
    return generateDemoChain(symbol, quote.price)
  }

  streamQuote(symbol: string, onTick: (quote: Quote) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const quote = await this.getQuote(symbol)
        onTick(quote)
      } catch (error) {
        console.error('Error streaming quote:', error)
      }
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }
}

// Polygon provider
class PolygonProvider implements Provider {
  name = 'Polygon'
  private apiKey: string
  private baseUrl = 'https://api.polygon.io'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getQuote(symbol: string): Promise<Quote> {
    const response = await fetch(
      `${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${this.apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`)
    }
    
    const data = await response.json()
    const ticker = data.results
    
    return {
      symbol: ticker.ticker,
      price: ticker.lastTrade.p,
      change: ticker.lastTrade.p - ticker.prevDay.p,
      changePercent: (ticker.lastTrade.p - ticker.prevDay.p) / ticker.prevDay.p,
      volume: ticker.lastTrade.s,
      high: ticker.day.h,
      low: ticker.day.l,
      open: ticker.day.o,
      previousClose: ticker.prevDay.p,
      timestamp: ticker.lastTrade.t
    }
  }

  async getOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain> {
    const response = await fetch(
      `${this.baseUrl}/v3/reference/options/contracts?underlying_ticker=${symbol}&expiration_date=${expiry || ''}&apikey=${this.apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform Polygon data to our format
    const calls: ChainOption[] = data.results
      .filter((option: any) => option.contract_type === 'call')
      .map((option: any) => ({
        symbol: option.ticker,
        type: 'call',
        strike: option.strike_price,
        expiry: option.expiration_date,
        bid: null, // Polygon doesn't provide real-time options data in free tier
        ask: null,
        last: null,
        volume: null,
        openInterest: null,
        impliedVolatility: null,
        delta: null,
        gamma: null,
        theta: null,
        vega: null,
        rho: null
      }))

    const puts: ChainOption[] = data.results
      .filter((option: any) => option.contract_type === 'put')
      .map((option: any) => ({
        symbol: option.ticker,
        type: 'put',
        strike: option.strike_price,
        expiry: option.expiration_date,
        bid: null,
        ask: null,
        last: null,
        volume: null,
        openInterest: null,
        impliedVolatility: null,
        delta: null,
        gamma: null,
        theta: null,
        vega: null,
        rho: null
      }))

    const quote = await this.getQuote(symbol)
    
    return {
      symbol,
      underlyingPrice: quote.price,
      calls,
      puts,
      expirations: [...new Set(data.results.map((option: any) => option.expiration_date))] as string[]
    }
  }

  streamQuote(symbol: string, onTick: (quote: Quote) => void): () => void {
    // Polygon doesn't provide free WebSocket, so we'll poll
    const interval = setInterval(async () => {
      try {
        const quote = await this.getQuote(symbol)
        onTick(quote)
      } catch (error) {
        console.error('Error streaming quote:', error)
      }
    }, 5000) // Poll every 5 seconds to respect rate limits

    return () => clearInterval(interval)
  }
}

// Provider factory
export function createProvider(config: MarketDataConfig): Provider {
  switch (config.provider) {
    case 'polygon':
      if (!config.apiKey) {
        console.warn('Polygon API key not provided, falling back to demo provider')
        return new DemoProvider()
      }
      return new PolygonProvider(config.apiKey)
    
    case 'tradier':
    case 'alpaca':
      // TODO: Implement other providers
      console.warn(`${config.provider} provider not implemented, falling back to demo provider`)
      return new DemoProvider()
    
    case 'demo':
    default:
      return new DemoProvider()
  }
}

// Default provider instance
export const defaultProvider = createProvider({
  provider: process.env.NEXT_PUBLIC_MARKET_DATA_PROVIDER as any || 'demo',
  apiKey: process.env.NEXT_PUBLIC_POLYGON_API_KEY,
  pollInterval: 5000
})
