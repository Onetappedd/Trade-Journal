import { Quote, ChainOption, OptionsChain, ContractMetadata, DividendSchedule } from '../options/types'

interface PolygonQuote {
  ticker: string
  last_quote: {
    bid: number
    ask: number
    bid_size: number
    ask_size: number
    timestamp: number
  }
  last_trade: {
    price: number
    size: number
    timestamp: number
  }
  min: {
    av: number
    t: number
    n: number
    o: number
    h: number
    l: number
    c: number
    v: number
    vw: number
  }
  prevDay: {
    o: number
    h: number
    l: number
    c: number
    v: number
    vw: number
  }
  updated: number
}

interface PolygonOption {
  underlying_asset: string
  strike_price: number
  expiration_date: string
  contract_type: 'call' | 'put'
  exercise_style: 'american' | 'european'
  shares_per_contract: number
  last_price: number
  bid: number
  ask: number
  volume: number
  open_interest: number
  implied_volatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  last_updated: number
}

interface PolygonContractDetails {
  underlying_asset: string
  strike_price: number
  expiration_date: string
  contract_type: 'call' | 'put'
  exercise_style: 'american' | 'european'
  shares_per_contract: number
  deliverable: string
  adjusted: boolean
  corporate_actions: {
    dividends: Array<{
      ex_date: string
      amount: number
    }>
    splits: Array<{
      ex_date: string
      ratio: string
    }>
  }
}

export class PolygonProvider {
  private apiKey: string
  private baseUrl = 'https://api.polygon.io'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getQuote(symbol: string): Promise<Quote> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`)
      }

      const data: PolygonQuote = await response.json()

      return {
        symbol: data.ticker,
        price: data.last_trade.price,
        bid: data.last_quote.bid,
        ask: data.last_quote.ask,
        volume: data.min.v,
        change: data.last_trade.price - data.prevDay.c,
        changePercent: ((data.last_trade.price - data.prevDay.c) / data.prevDay.c) * 100,
        high: data.min.h,
        low: data.min.l,
        open: data.min.o,
        previousClose: data.prevDay.c,
        timestamp: data.updated
      }
    } catch (error) {
      console.error('Error fetching quote from Polygon:', error)
      throw error
    }
  }

  async getOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain> {
    try {
      const url = expiry
        ? `${this.baseUrl}/v3/reference/options/contracts?underlying_ticker=${symbol}&expiration_date=${expiry}&apikey=${this.apiKey}`
        : `${this.baseUrl}/v3/reference/options/contracts?underlying_ticker=${symbol}&apikey=${this.apiKey}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`)
      }

      const data = await response.json()
      const contracts = data.results || []

      // Get current quote for underlying price
      const quote = await this.getQuote(symbol)

      // Group by expiration and type
      const calls: ChainOption[] = []
      const puts: ChainOption[] = []
      const expirations = new Set<string>()
      const metadata: ContractMetadata[] = []

      for (const contract of contracts) {
        const option: ChainOption = {
          strike: contract.strike_price,
          expiry: contract.expiration_date,
          type: contract.contract_type,
          bid: contract.bid || 0,
          ask: contract.ask || 0,
          mid: contract.bid && contract.ask ? (contract.bid + contract.ask) / 2 : contract.last_price || 0,
          last: contract.last_price || 0,
          volume: contract.volume || 0,
          openInterest: contract.open_interest || 0,
          impliedVolatility: contract.implied_volatility || 0,
          delta: contract.delta || 0,
          gamma: contract.gamma || 0,
          theta: contract.theta || 0,
          vega: contract.vega || 0,
          rho: contract.rho || 0,
          multiplier: contract.shares_per_contract || 100,
          style: contract.exercise_style || 'american',
          deliverable: contract.deliverable || '100 shares',
          adjusted: contract.adjusted || false
        }

        if (option.type === 'call') {
          calls.push(option)
        } else {
          puts.push(option)
        }

        expirations.add(contract.expiration_date)

        // Store metadata
        metadata.push({
          symbol: contract.underlying_asset,
          strike: contract.strike_price,
          expiry: contract.expiration_date,
          type: contract.contract_type,
          multiplier: contract.shares_per_contract || 100,
          style: contract.exercise_style || 'american',
          deliverable: contract.deliverable || '100 shares',
          adjusted: contract.adjusted || false,
          dividends: this.parseDividends(contract.corporate_actions?.dividends || [])
        })
      }

      return {
        symbol,
        underlyingPrice: quote.price,
        calls: calls.sort((a, b) => a.strike - b.strike),
        puts: puts.sort((a, b) => a.strike - b.strike),
        expirations: Array.from(expirations).sort(),
        metadata
      }
    } catch (error) {
      console.error('Error fetching options chain from Polygon:', error)
      throw error
    }
  }

  async getContractDetails(symbol: string, strike: number, expiry: string, type: 'call' | 'put'): Promise<ContractMetadata> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v3/reference/options/contracts?underlying_ticker=${symbol}&strike_price=${strike}&expiration_date=${expiry}&contract_type=${type}&apikey=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`)
      }

      const data = await response.json()
      const contract: PolygonContractDetails = data.results?.[0]

      if (!contract) {
        throw new Error('Contract not found')
      }

      return {
        symbol: contract.underlying_asset,
        strike: contract.strike_price,
        expiry: contract.expiration_date,
        type: contract.contract_type,
        multiplier: contract.shares_per_contract || 100,
        style: contract.exercise_style || 'american',
        deliverable: contract.deliverable || '100 shares',
        adjusted: contract.adjusted || false,
        dividends: this.parseDividends(contract.corporate_actions?.dividends || [])
      }
    } catch (error) {
      console.error('Error fetching contract details from Polygon:', error)
      throw error
    }
  }

  private parseDividends(dividends: Array<{ ex_date: string; amount: number }>): DividendSchedule[] {
    return dividends.map(div => ({
      exDate: div.ex_date,
      amount: div.amount
    }))
  }

  // Stream quotes with polling
  async streamQuote(symbol: string, callback: (quote: Quote) => void, interval = 2000): Promise<() => void> {
    let isRunning = true

    const poll = async () => {
      if (!isRunning) return

      try {
        const quote = await this.getQuote(symbol)
        callback(quote)
      } catch (error) {
        console.error('Error in quote stream:', error)
      }

      if (isRunning) {
        setTimeout(poll, interval)
      }
    }

    poll()

    return () => {
      isRunning = false
    }
  }
}

// Demo provider for testing without API key
export class DemoPolygonProvider extends PolygonProvider {
  constructor() {
    super('demo')
  }

  async getQuote(symbol: string): Promise<Quote> {
    // Return demo data
    const basePrice = 150 + Math.random() * 50
    const change = (Math.random() - 0.5) * 10
    const price = basePrice + change

    return {
      symbol,
      price,
      bid: price - 0.01,
      ask: price + 0.01,
      volume: Math.floor(Math.random() * 1000000),
      change,
      changePercent: (change / basePrice) * 100,
      high: price + Math.random() * 5,
      low: price - Math.random() * 5,
      open: basePrice,
      previousClose: basePrice,
      timestamp: Date.now()
    }
  }

  async getOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain> {
    const quote = await this.getQuote(symbol)
    const strikes = [120, 130, 140, 150, 160, 170, 180]
    const expirations = ['2024-01-19', '2024-02-16', '2024-03-15']
    const selectedExpiry = expiry || expirations[0]

    const calls: ChainOption[] = strikes.map(strike => ({
      strike,
      expiry: selectedExpiry,
      type: 'call' as const,
      bid: Math.max(0, quote.price - strike) + Math.random() * 5,
      ask: Math.max(0, quote.price - strike) + Math.random() * 5 + 0.5,
      mid: Math.max(0, quote.price - strike) + Math.random() * 5 + 0.25,
      last: Math.max(0, quote.price - strike) + Math.random() * 5,
      volume: Math.floor(Math.random() * 1000),
      openInterest: Math.floor(Math.random() * 5000),
      impliedVolatility: 0.2 + Math.random() * 0.3,
      delta: Math.random(),
      gamma: Math.random() * 0.01,
      theta: -(Math.random() * 0.1),
      vega: Math.random() * 0.1,
      rho: Math.random() * 0.01,
      multiplier: 100,
      style: 'american' as const,
      deliverable: '100 shares',
      adjusted: false
    }))

    const puts: ChainOption[] = strikes.map(strike => ({
      strike,
      expiry: selectedExpiry,
      type: 'put' as const,
      bid: Math.max(0, strike - quote.price) + Math.random() * 5,
      ask: Math.max(0, strike - quote.price) + Math.random() * 5 + 0.5,
      mid: Math.max(0, strike - quote.price) + Math.random() * 5 + 0.25,
      last: Math.max(0, strike - quote.price) + Math.random() * 5,
      volume: Math.floor(Math.random() * 1000),
      openInterest: Math.floor(Math.random() * 5000),
      impliedVolatility: 0.2 + Math.random() * 0.3,
      delta: -Math.random(),
      gamma: Math.random() * 0.01,
      theta: -(Math.random() * 0.1),
      vega: Math.random() * 0.1,
      rho: -Math.random() * 0.01,
      multiplier: 100,
      style: 'american' as const,
      deliverable: '100 shares',
      adjusted: false
    }))

    return {
      symbol,
      underlyingPrice: quote.price,
      calls,
      puts,
      expirations,
      metadata: strikes.map(strike => ({
        symbol,
        strike,
        expiry: selectedExpiry,
        type: 'call' as const,
        multiplier: 100,
        style: 'american' as const,
        deliverable: '100 shares',
        adjusted: false,
        dividends: []
      }))
    }
  }
}
