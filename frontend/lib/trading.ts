// Client-side trading utilities (no Zod imports here)

export type Side = "buy" | "sell"

// Futures contract specs captured at trade time
export const FUTURES_SPECS = {
  ES: { contractCode: "ES", tickSize: 0.25, tickValue: 12.5, pointMultiplier: 50 },
  MES: { contractCode: "MES", tickSize: 0.25, tickValue: 1.25, pointMultiplier: 5 },
  NQ: { contractCode: "NQ", tickSize: 0.25, tickValue: 5, pointMultiplier: 20 },
  MNQ: { contractCode: "MNQ", tickSize: 0.25, tickValue: 0.5, pointMultiplier: 2 },
  YM: { contractCode: "YM", tickSize: 1, tickValue: 5, pointMultiplier: 5 },
  MYM: { contractCode: "MYM", tickSize: 1, tickValue: 0.5, pointMultiplier: 0.5 },
  CL: { contractCode: "CL", tickSize: 0.01, tickValue: 10, pointMultiplier: 1000 },
  MCL: { contractCode: "MCL", tickSize: 0.01, tickValue: 1, pointMultiplier: 100 },
  GC: { contractCode: "GC", tickSize: 0.1, tickValue: 10, pointMultiplier: 100 },
  MGC: { contractCode: "MGC", tickSize: 0.1, tickValue: 1, pointMultiplier: 10 },
} as const
export type FuturesCode = keyof typeof FUTURES_SPECS

export const epsilon = 1e-8

// Tick helpers
export function enforceTick(price: number, tickSize: number) {
  const remainder = Math.abs((price / tickSize) - Math.round(price / tickSize))
  return remainder < epsilon
}

export function roundToTick(price: number, tickSize: number) {
  return Math.round(price / tickSize) * tickSize
}

// P&L utils
export function calcStockPnl(args: { side: Side; qty: number; entry: number; exit?: number | null }) {
  const { side, qty, entry, exit } = args
  if (exit == null || Number.isNaN(exit)) return 0
  return side === "buy" ? (exit - entry) * qty : (entry - exit) * qty
}

export function calcOptionPnl(args: { side: Side; contracts: number; entry: number; exit?: number | null; multiplier?: number }) {
  const { side, contracts, entry, exit, multiplier = 100 } = args
  if (exit == null || Number.isNaN(exit)) return 0
  return side === "buy"
    ? (exit - entry) * multiplier * contracts
    : (entry - exit) * multiplier * contracts
}

export function calcFuturesPnl(args: { side: Side; contracts: number; entry: number; exit?: number | null; pointMultiplier: number }) {
  const { side, contracts, entry, exit, pointMultiplier } = args
  if (exit == null || Number.isNaN(exit)) return 0
  const pointMove = exit - entry
  const perContract = pointMove * pointMultiplier
  const signed = side === "buy" ? perContract : -perContract
  return signed * contracts
}

// Preview helper (pure math based on provided fields)
export function previewPnl(input: any) {
  const { side, quantity, entry_price, exit_price } = input
  const closed = !!input.isClosed && exit_price != null
  if (!closed) return { realized: 0, unrealized: 0 }

  if (input.asset_type === "stock") {
    const realized = calcStockPnl({ side, qty: quantity, entry: entry_price, exit: exit_price })
    return { realized, unrealized: 0 }
  } else if (input.asset_type === "option") {
    const realized = calcOptionPnl({ side, contracts: quantity, entry: entry_price, exit: exit_price, multiplier: input.multiplier ?? 100 })
    return { realized, unrealized: 0 }
  } else {
    const realized = calcFuturesPnl({ side, contracts: quantity, entry: entry_price, exit: exit_price, pointMultiplier: input.pointMultiplier })
    return { realized, unrealized: 0 }
  }
}
