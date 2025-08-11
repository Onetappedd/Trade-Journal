import { parseISO, formatISO, utcToZonedTime } from 'date-fns-tz'

// --- OPTIONS ---
export function normalizeOptionsQuantity(contracts: number): number {
  // US equity options: 1 contract = 100 shares
  return contracts * 100
}

export function parseOCCSymbol(occ: string) {
  // Example: "AAPL 250118C00200000"
  // OCC format: [root] [YYMMDD][C/P][strike * 1000]
  const [underlying, rest] = occ.split(' ')
  const expiry = '20' + rest.slice(0, 6) // YYMMDD → YYYYMMDD
  const right = rest[6] === 'C' ? 'call' : 'put'
  const strike = parseFloat(rest.slice(7)) / 1000
  return { underlying, expiry, right, strike }
}

export function sumOptionFees(commissions: number, regulatory: number, exchange: number): number {
  return (commissions || 0) + (regulatory || 0) + (exchange || 0)
}

// --- FUTURES ---
export type FuturesContractMeta = {
  root: string
  multiplier: number
  pointValue: number
  tickSize: number
  currency: string
}

export const FUTURES_CONTRACTS: Record<string, FuturesContractMeta> = {
  ES: { root: 'ES', multiplier: 1, pointValue: 50, tickSize: 0.25, currency: 'USD' },
  MES: { root: 'MES', multiplier: 1, pointValue: 5, tickSize: 0.25, currency: 'USD' },
  NQ: { root: 'NQ', multiplier: 1, pointValue: 20, tickSize: 0.25, currency: 'USD' },
  MNQ: { root: 'MNQ', multiplier: 1, pointValue: 2, tickSize: 0.25, currency: 'USD' },
  CL: { root: 'CL', multiplier: 1, pointValue: 1000, tickSize: 0.01, currency: 'USD' },
  GC: { root: 'GC', multiplier: 1, pointValue: 100, tickSize: 0.1, currency: 'USD' },
  // Add more as needed
}

export function canonicalizeFuturesSymbol(symbol: string) {
  // Example: ESZ5, MNQU5
  // Extract root and expiry
  const match = symbol.match(/^([A-Z]+)[FGHJKMNQUVXZ][0-9]$/)
  if (!match) return { root: symbol, expiry: null }
  return { root: match[1], expiry: symbol.slice(-2) }
}

export function calcFuturesPnl(contracts: number, points: number, pointValue: number): number {
  return contracts * points * pointValue
}

export function getFuturesMeta(root: string): FuturesContractMeta | undefined {
  return FUTURES_CONTRACTS[root]
}

// --- CRYPTO ---
export function canonicalizeCryptoMarket(symbol: string): string {
  // e.g., BTCUSD, btc_usd, BTC-USD → BTC-USD
  const [base, quote] = symbol.replace('_', '-').replace('usd', 'USD').toUpperCase().split('-')
  return `${base}-USD`
}

// --- TIMEZONE ---
export function bucketDateInTimezone(date: string, timezone: string): string {
  // Returns ISO date string in user's timezone
  const zoned = utcToZonedTime(parseISO(date), timezone)
  return formatISO(zoned, { representation: 'date' })
}
