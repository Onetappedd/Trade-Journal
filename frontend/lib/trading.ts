import { z } from "zod"

// Shared types and constants
export type Side = "buy" | "sell"

export const sideSchema = z.enum(["buy", "sell"]) // lower-case enforced

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
  // Check if price aligns to tick within epsilon
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
  // Long positive if exit>entry; short reverses sign
  const signed = side === "buy" ? perContract : -perContract
  return signed * contracts
}

// Zod Schemas
export const baseTradeSchema = z.object({
  symbol: z.string().trim().min(1, "Symbol is required"),
  side: sideSchema,
  quantity: z.number().int().positive("Must be > 0"),
  entry_price: z.number().positive("Entry price must be > 0"),
  entry_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid entry date" }),
  // Optional exit
  isClosed: z.boolean().optional().default(false),
  exit_price: z.number().positive("Exit price must be > 0").optional().nullable(),
  exit_date: z
    .string()
    .nullable()
    .optional()
    .refine((v) => v == null || !Number.isNaN(Date.parse(v)), { message: "Invalid exit date" }),
  notes: z.string().optional().nullable(),
})
  .refine((data) => {
    if (!data.isClosed) return true
    return data.exit_price != null && data.exit_date != null
  }, { message: "Exit price and date required when marking trade closed", path: ["exit_price"] })
  .refine((data) => {
    if (!data.isClosed || !data.exit_date) return true
    const e = Date.parse(data.entry_date)
    const x = Date.parse(data.exit_date)
    return x >= e
  }, { message: "Exit date must be on/after entry date", path: ["exit_date"] })

export const stockTradeSchema = baseTradeSchema.extend({
  asset_type: z.literal("stock"),
})

export const optionTradeSchema = baseTradeSchema.extend({
  asset_type: z.literal("option"),
  optionType: z.enum(["call", "put"]),
  strike: z.number().positive("Strike must be > 0"),
  expiration: z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid expiration date" }),
  multiplier: z.number().positive().default(100),
})
  .refine((data) => Date.parse(data.expiration) >= Date.parse(data.entry_date), {
    message: "Expiration must be on/after entry date",
    path: ["expiration"],
  })

export const futuresTradeSchema = baseTradeSchema.extend({
  asset_type: z.literal("futures"),
  contractCode: z.string().trim().min(1, "Contract code required"),
  tickSize: z.number().positive(),
  tickValue: z.number().positive(),
  pointMultiplier: z.number().positive(),
})

// DTO types
export type StockTradeInput = z.infer<typeof stockTradeSchema>
export type OptionTradeInput = z.infer<typeof optionTradeSchema>
export type FuturesTradeInput = z.infer<typeof futuresTradeSchema>
export type AnyTradeInput = StockTradeInput | OptionTradeInput | FuturesTradeInput

// Helper to compute realized/unrealized P&L preview
export function previewPnl(input: AnyTradeInput) {
  const { side, quantity, entry_price, exit_price } = input
  const closed = !!input.isClosed && exit_price != null
  if (!closed) return { realized: 0, unrealized: 0 }

  if (input.asset_type === "stock") {
    const realized = calcStockPnl({ side, qty: quantity, entry: entry_price, exit: exit_price ?? undefined })
    return { realized, unrealized: 0 }
  } else if (input.asset_type === "option") {
    const realized = calcOptionPnl({ side, contracts: quantity, entry: entry_price, exit: exit_price ?? undefined, multiplier: input.multiplier })
    return { realized, unrealized: 0 }
  } else {
    const realized = calcFuturesPnl({ side, contracts: quantity, entry: entry_price, exit: exit_price ?? undefined, pointMultiplier: input.pointMultiplier })
    return { realized, unrealized: 0 }
  }
}

export function validateTickPrices(input: FuturesTradeInput): { ok: true } | { ok: false; which: "entry" | "exit"; suggested: number } {
  const { tickSize, entry_price, exit_price } = input
  if (!enforceTick(entry_price, tickSize)) {
    return { ok: false, which: "entry", suggested: roundToTick(entry_price, tickSize) }
  }
  if (input.isClosed && exit_price != null && !enforceTick(exit_price, tickSize)) {
    return { ok: false, which: "exit", suggested: roundToTick(exit_price, tickSize) }
  }
  return { ok: true }
}
