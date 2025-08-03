import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import type { Database } from "@/lib/database.types"

type Trade = Database['public']['Tables']['trades']['Row']
type TradeInsert = Database['public']['Tables']['trades']['Insert']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const symbol = searchParams.get("symbol")
    const status = searchParams.get("status")
    const asset_type = searchParams.get("asset_type")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (symbol) {
      query = query.ilike('symbol', `%${symbol}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (asset_type) {
      query = query.eq('asset_type', asset_type)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Apply pagination
    const { data: trades, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching trades:', error)
      return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 })
    }

    return NextResponse.json({
      data: trades || [],
      meta: {
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0),
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate required fields
    const requiredFields = ["symbol", "asset_type", "side", "quantity", "entry_price", "entry_date"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Prepare trade data
    const tradeData: TradeInsert = {
      user_id: user.id,
      symbol: body.symbol.toUpperCase(),
      asset_type: body.asset_type,
      side: body.side,
      quantity: Number.parseFloat(body.quantity),
      entry_price: Number.parseFloat(body.entry_price),
      exit_price: body.exit_price ? Number.parseFloat(body.exit_price) : null,
      entry_date: body.entry_date,
      exit_date: body.exit_date || null,
      notes: body.notes || null,
      strike_price: body.strike_price ? Number.parseFloat(body.strike_price) : null,
      expiry_date: body.expiry_date || null,
      option_type: body.option_type || null,
      status: body.exit_date ? "closed" : "open",
    }

    // Insert trade into database
    const { data: newTrade, error } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single()

    if (error) {
      console.error('Error creating trade:', error)
      return NextResponse.json({ error: "Failed to create trade" }, { status: 500 })
    }

    return NextResponse.json(newTrade, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}
