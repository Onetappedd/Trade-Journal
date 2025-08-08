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
  const errors: string[] = []
  
  for (const t of trades) {
    // Validate required fields
    if (!t.symbol || !t.side || typeof t.quantity !== "number" || typeof t.entry_price !== "number" || !t.entry_date || !t.asset_type || !t.broker) {
      error++
      errors.push(`Missing required fields for trade: ${t.symbol || 'unknown'}`)
      continue
    }

    // Prepare the trade data with proper formatting
    const tradeData: any = {
      user_id: user.id,
      symbol: String(t.symbol),
      side: String(t.side).toLowerCase(),
      quantity: Number(t.quantity),
      entry_price: Number(t.entry_price),
      entry_date: new Date(t.entry_date).toISOString(),
      asset_type: String(t.asset_type).toLowerCase(),
      broker: String(t.broker),
      notes: t.notes || null,
    }

    // Add optional fields only if they exist
    if (t.underlying) tradeData.underlying = String(t.underlying)
    
    // For options, these fields are REQUIRED by the database constraint
    if (t.asset_type === "option") {
      // Use expiration_date (not expiry) as that's the actual column name
      if (t.expiry) tradeData.expiration_date = String(t.expiry).split('T')[0] // Ensure date format YYYY-MM-DD
      if (t.option_type) tradeData.option_type = String(t.option_type).toLowerCase()
      if (t.strike_price !== undefined && t.strike_price !== null) tradeData.strike_price = Number(t.strike_price)
      
      // Ensure all required option fields are present
      if (!tradeData.expiration_date || !tradeData.option_type || tradeData.strike_price === undefined) {
        error++
        errors.push(`Missing required option fields for ${t.symbol}: expiration_date, option_type, or strike_price`)
        continue
      }
    }
    
    // Don't send status field - let database default handle it
    // The database likely has a constraint or default value for status

    console.log("Attempting to insert trade:", tradeData)

    const { data: insertedData, error: insertError } = await supabase
      .from("trades")
      .insert(tradeData)
      .select()
      .single()
    
    if (insertError) {
      error++
      errors.push(`Failed to insert ${t.symbol}: ${insertError.message} (${insertError.code})`)
      console.error("Insert error details:", {
        error: insertError,
        tradeData,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      success++
      console.log("Successfully inserted trade:", insertedData)
    }
  }

  // Return detailed error information if there were failures
  if (errors.length > 0) {
    return NextResponse.json({ 
      success, 
      error,
      errors: errors.slice(0, 10), // Return first 10 errors for debugging
      message: `Imported ${success} trades, ${error} failed` 
    })
  }

  return NextResponse.json({ success, error })
}