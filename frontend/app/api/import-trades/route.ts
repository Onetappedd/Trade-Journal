import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
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
    } catch (e) {
      console.error("Failed to parse JSON:", e)
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

  const trades = Array.isArray(payload.trades) ? payload.trades : []
  if (!trades.length) return NextResponse.json({ error: "No trades to import" }, { status: 400 })

  // Limit batch size to prevent timeouts
  const BATCH_SIZE = 50
  if (trades.length > BATCH_SIZE) {
    return NextResponse.json({ 
      error: `Too many trades. Please import in batches of ${BATCH_SIZE} or less.`,
      success: 0,
      duplicates: 0,
      errors: [`Current batch size: ${trades.length}, Maximum: ${BATCH_SIZE}`]
    }, { status: 400 })
  }

  // Fetch existing trades to check for duplicates (more efficient query)
  const { data: existingTrades } = await supabase
    .from("trades")
    .select("symbol, side, quantity, entry_price, entry_date, asset_type, broker, strike_price, expiration_date, option_type")
    .eq("user_id", user.id)
    .gte("entry_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Only check last year for duplicates

  let success = 0, error = 0, duplicates = 0
  const errors: string[] = []
  const validTrades: any[] = []
  const invalidTrades: any[] = []
  
  // First pass: validate all trades and prepare for batch insert
  for (const t of trades) {
    // Validate required fields
    if (!t.symbol || !t.side || typeof t.quantity !== "number" || typeof t.entry_price !== "number" || !t.entry_date || !t.asset_type || !t.broker) {
      invalidTrades.push({
        trade: t,
        error: `Missing required fields for trade: ${t.symbol || 'unknown'}`
      })
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
        invalidTrades.push({
          trade: t,
          error: `Missing required option fields for ${t.symbol}: expiration_date, option_type, or strike_price`
        })
        continue
      }
    }
    
    // Check for duplicates in existing trades
    if (existingTrades && existingTrades.length > 0) {
      const isDuplicate = existingTrades.some(existing => {
        // Check if entry dates are within 1 minute of each other (to account for timezone differences)
        const existingDate = new Date(existing.entry_date).getTime()
        const newDate = new Date(tradeData.entry_date).getTime()
        const timeDiff = Math.abs(existingDate - newDate)
        const oneMinute = 60 * 1000
        
        // For options, check all option-specific fields
        if (tradeData.asset_type === "option" && existing.asset_type === "option") {
          return existing.symbol === tradeData.symbol &&
                 existing.side === tradeData.side &&
                 existing.quantity === tradeData.quantity &&
                 Math.abs(existing.entry_price - tradeData.entry_price) < 0.01 && // Allow small price differences
                 timeDiff < oneMinute &&
                 existing.strike_price === tradeData.strike_price &&
                 existing.expiration_date === tradeData.expiration_date &&
                 existing.option_type === tradeData.option_type
        }
        
        // For stocks, check basic fields
        return existing.symbol === tradeData.symbol &&
               existing.side === tradeData.side &&
               existing.quantity === tradeData.quantity &&
               Math.abs(existing.entry_price - tradeData.entry_price) < 0.01 &&
               timeDiff < oneMinute
      })
      
      if (isDuplicate) {
        duplicates++
        errors.push(`Duplicate: ${t.symbol} ${t.side} ${t.quantity} @ ${t.entry_price}`)
        continue
      }
    }
    
    // Add to valid trades for batch insert
    validTrades.push(tradeData)
  }

  // Batch insert all valid trades at once (much faster)
  if (validTrades.length > 0) {
    console.log(`Attempting to batch insert ${validTrades.length} trades`)
    
    // Insert in smaller chunks to avoid database limits
    const CHUNK_SIZE = 10
    for (let i = 0; i < validTrades.length; i += CHUNK_SIZE) {
      const chunk = validTrades.slice(i, i + CHUNK_SIZE)
      
      const { data: insertedData, error: insertError } = await supabase
        .from("trades")
        .insert(chunk)
        .select()
      
      if (insertError) {
        error += chunk.length
        errors.push(`Failed to insert batch ${i/CHUNK_SIZE + 1}: ${insertError.message}`)
        console.error("Batch insert error:", insertError)
      } else {
        success += insertedData?.length || 0
        console.log(`Successfully inserted batch ${i/CHUNK_SIZE + 1}: ${insertedData?.length} trades`)
      }
    }
  }

  // Add invalid trade errors to the errors array
  invalidTrades.forEach(({ error: err }) => {
    errors.push(err)
    error++
  })

  // Return detailed information including duplicates
    return NextResponse.json({ 
      success, 
      error,
      duplicates,
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors for debugging
      message: `Imported ${success} trades, ${duplicates} duplicates skipped, ${error} failed` 
    })
  } catch (error) {
    // Catch any unexpected errors and return JSON
    console.error("Unexpected error in import-trades API:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred during import",
      success: 0,
      duplicates: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    }, { status: 500 })
  }
}