import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const trades = Array.isArray(payload.trades) ? payload.trades : []
  if (!trades.length) return NextResponse.json({ error: "No trades to import" }, { status: 400 })

  let success = 0, error = 0
  for (const t of trades) {
    if (!t.symbol || !t.side || typeof t.quantity !== "number" || typeof t.entry_price !== "number" || !t.entry_date || !t.asset_type || !t.broker) {
      error++
      continue
    }
    const { error: insertError } = await supabase.from("trades").insert({
      user_id: user.id,
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      entry_price: t.entry_price,
      entry_date: t.entry_date,
      asset_type: t.asset_type,
      broker: t.broker,
    })
    if (insertError) error++
    else success++
  }

  return NextResponse.json({ success, error })
}
