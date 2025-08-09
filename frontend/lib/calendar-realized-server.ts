import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type RealizedTrade = {
  id: string
  user_id: string
  symbol: string
  side: "buy" | "sell"
  quantity: number
  entry_price: number
  exit_price: number | null
  entry_date: string
  exit_date: string | null
  status: "open" | "closed"
  pnl: number | null
  asset_type?: string | null
}

export type DailyRealized = Record<string, number>
export type TradesByDay = Record<string, Array<{
  id: string
  symbol: string
  quantity: number
  entry_price: number
  exit_price: number
  realized: number
}>>

export async function getRealizedCalendarData(userId: string, startDateISO: string, endDateISO: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  // Fetch both open and closed trades whose entry or exit falls within the visible range
  // Only closed trades will contribute to realized P&L
  const { data, error } = await supabase
    .from("trades")
    .select("id,user_id,symbol,side,quantity,entry_price,exit_price,entry_date,exit_date,status,pnl,asset_type")
    .eq("user_id", userId)
    .or(
      `and(exit_date.gte.${startDateISO},exit_date.lte.${endDateISO}),and(entry_date.gte.${startDateISO},entry_date.lte.${endDateISO})`
    )

  if (error) {
    return { error: error.message, dailyPnL: {} as DailyRealized, tradesByDay: {} as TradesByDay }
  }

  const dailyPnL: DailyRealized = {}
  const tradesByDay: TradesByDay = {}

  // Helper to derive local YYYY-MM-DD
  const toLocalKey = (d: Date) => {
    const y = d.getFullYear()
    const m = `${d.getMonth() + 1}`.padStart(2, "0")
    const day = `${d.getDate()}`.padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  for (const t of (data || []) as RealizedTrade[]) {
    // Only closed trades with exit price contribute to realized P&L
    if (t.status !== "closed" || !t.exit_date || t.exit_price == null || t.entry_price == null) continue

    const key = toLocalKey(new Date(t.exit_date))
    // Realized formula with side adjustment
    const multiplier = (t.asset_type === "option") ? 100 : 1
    const realized = t.side === "buy"
      ? (t.exit_price - t.entry_price) * t.quantity * multiplier
      : (t.entry_price - t.exit_price) * t.quantity * multiplier

    dailyPnL[key] = (dailyPnL[key] || 0) + realized

    if (!tradesByDay[key]) tradesByDay[key] = []
    tradesByDay[key].push({
      id: t.id,
      symbol: t.symbol,
      quantity: t.quantity,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      realized,
    })
  }

  return { error: null as string | null, dailyPnL, tradesByDay }
}
