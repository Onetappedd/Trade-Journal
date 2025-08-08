// Real-time price fetching utility
// Using Alpha Vantage API (free tier: 25 requests/day or 5 requests/minute)
// Alternative: Yahoo Finance unofficial API (no key required)

interface PriceData {
  symbol: string
  price: number
  change?: number
  changePercent?: number
  timestamp?: string
}

// Cache prices for 30 seconds to avoid API spam
const priceCache = new Map<string, { price: number; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

// Yahoo Finance API (no key required, unofficial but reliable)
async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    // Yahoo Finance API v8 endpoint
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      { 
        next: { revalidate: 30 }, // Next.js cache for 30 seconds
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    
    return price || null
  } catch (error) {
    console.error(`Failed to fetch Yahoo price for ${symbol}:`, error)
    return null
  }
}

// Alpha Vantage API (requires free API key)
async function fetchAlphaVantagePrice(symbol: string, apiKey: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
      { next: { revalidate: 30 } }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    const price = parseFloat(data['Global Quote']?.['05. price'])
    
    return isNaN(price) ? null : price
  } catch (error) {
    console.error(`Failed to fetch Alpha Vantage price for ${symbol}:`, error)
    return null
  }
}

// Finnhub API (requires free API key)
async function fetchFinnhubPrice(symbol: string, apiKey: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 30 } }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    const price = data?.c // current price
    
    return price || null
  } catch (error) {
    console.error(`Failed to fetch Finnhub price for ${symbol}:`, error)
    return null
  }
}

// Twelve Data API (free tier: 800 requests/day)
async function fetchTwelveDataPrice(symbol: string, apiKey: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`,
      { next: { revalidate: 30 } }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    const price = parseFloat(data?.price)
    
    return isNaN(price) ? null : price
  } catch (error) {
    console.error(`Failed to fetch Twelve Data price for ${symbol}:`, error)
    return null
  }
}

/**
 * Get real-time prices for multiple tickers
 * Uses multiple fallback APIs to ensure reliability
 */
export async function getRealTimePrices(
  tickers: string[]
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}
  const now = Date.now()
  
  // Remove duplicates and filter empty strings
  const uniqueTickers = [...new Set(tickers.filter(t => t && t.trim()))]
  
  // Check cache first
  const tickersToFetch: string[] = []
  for (const ticker of uniqueTickers) {
    const cached = priceCache.get(ticker)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      prices[ticker] = cached.price
    } else {
      tickersToFetch.push(ticker)
    }
  }
  
  if (tickersToFetch.length === 0) {
    return prices
  }
  
  // Fetch prices in parallel
  const pricePromises = tickersToFetch.map(async (ticker) => {
    // Try Yahoo Finance first (no API key required)
    let price = await fetchYahooPrice(ticker)
    
    // If Yahoo fails and we have API keys, try other services
    if (!price && process.env.ALPHA_VANTAGE_API_KEY) {
      price = await fetchAlphaVantagePrice(ticker, process.env.ALPHA_VANTAGE_API_KEY)
    }
    
    if (!price && process.env.FINNHUB_API_KEY) {
      price = await fetchFinnhubPrice(ticker, process.env.FINNHUB_API_KEY)
    }
    
    if (!price && process.env.TWELVE_DATA_API_KEY) {
      price = await fetchTwelveDataPrice(ticker, process.env.TWELVE_DATA_API_KEY)
    }
    
    // If we got a price, cache it
    if (price !== null) {
      priceCache.set(ticker, { price, timestamp: now })
      prices[ticker] = price
    }
    
    return { ticker, price }
  })
  
  await Promise.all(pricePromises)
  
  return prices
}

/**
 * Get a single real-time price
 */
export async function getRealTimePrice(ticker: string): Promise<number | null> {
  const prices = await getRealTimePrices([ticker])
  return prices[ticker] || null
}

/**
 * Get price data with additional metrics
 */
export async function getPriceData(tickers: string[]): Promise<PriceData[]> {
  const prices = await getRealTimePrices(tickers)
  
  return Object.entries(prices).map(([symbol, price]) => ({
    symbol,
    price,
    timestamp: new Date().toISOString()
  }))
}

/**
 * Calculate price change from entry price
 */
export function calculatePriceChange(
  currentPrice: number,
  entryPrice: number
): { change: number; changePercent: number } {
  const change = currentPrice - entryPrice
  const changePercent = (change / entryPrice) * 100
  
  return { change, changePercent }
}