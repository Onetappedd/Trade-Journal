"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { anyTradeSchema, type AnyTradeInput } from "@/lib/trading-schemas"
import { calcStockPnl, calcOptionPnl, calcFuturesPnl } from "@/lib/trading"

export async function addTradeAction(input: AnyTradeInput) {
  const parsed = anyTradeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() }
  }
  const data = parsed.data

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: userRes, error: authErr } = await supabase.auth.getUser()
  if (authErr || !userRes?.user) {
    return { ok: false as const, errors: { formErrors: ["Not authenticated"], fieldErrors: {} } }
  }
  const userId = userRes.user.id

  // Prepare base insert payload
  const basePayload: any = {
    user_id: userId,
    symbol: data.symbol.toUpperCase(),
    side: data.side,
    quantity: data.quantity,
    entry_price: data.entry_price,
    entry_date: new Date(data.entry_date).toISOString(),
    exit_price: data.isClosed ? (data.exit_price ?? null) : null,
    exit_date: data.isClosed && data.exit_date ? new Date(data.exit_date).toISOString() : null,
    status: data.isClosed ? "closed" : "open",
    asset_type: data.asset_type,
    pnl: null as number | null,
    details: null as any,
    multiplier: null as number | null,
    notes: data.notes ?? null,
  }

  if (data.asset_type === "stock") {
    basePayload.details = {}
  } else if (data.asset_type === "option") {
    basePayload.details = {
      optionType: data.optionType,
      strike: data.strike,
      expiration: data.expiration,
      multiplier: data.multiplier ?? 100,
    }
    basePayload.multiplier = data.multiplier ?? 100
  } else if (data.asset_type === "futures") {
    basePayload.details = {
      contractCode: data.contractCode,
      tickSize: data.tickSize,
      tickValue: data.tickValue,
      pointMultiplier: data.pointMultiplier,
    }
    basePayload.multiplier = data.pointMultiplier
  }

  // Compute realized pnl if closed
  if (data.isClosed && data.exit_price != null) {
    let pnl = 0
    if (data.asset_type === "stock") {
      pnl = calcStockPnl({ side: data.side, qty: data.quantity, entry: data.entry_price, exit: data.exit_price })
    } else if (data.asset_type === "option") {
      pnl = calcOptionPnl({ side: data.side, contracts: data.quantity, entry: data.entry_price, exit: data.exit_price, multiplier: basePayload.multiplier ?? 100 })
    } else {
      pnl = calcFuturesPnl({ side: data.side, contracts: data.quantity, entry: data.entry_price, exit: data.exit_price, pointMultiplier: basePayload.multiplier! })
    }
    basePayload.pnl = pnl
  }

  const { data: inserted, error } = await supabase
    .from("trades")
    .insert([basePayload])
    .select()
    .single()

  if (error) {
    return { ok: false as const, errors: { formErrors: [error.message], fieldErrors: {} } }
  }

  // Revalidate relevant pages
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/analytics")
  revalidatePath("/trades")

  return { ok: true as const, trade: inserted }
}
