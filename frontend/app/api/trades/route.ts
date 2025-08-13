import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import type { Database } from "@/lib/database.types"

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

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

    const symbol = searchParams.get("symbol") || undefined
    const status = searchParams.get("status") || undefined
    const asset_class = searchParams.get("asset_class") || undefined
    // Normalize accountIds: accept repeated (?accountIds[]=a&accountIds[]=b) and comma-separated (?accountIds=a,b)
    const accountIdsParam = searchParams.getAll("accountIds[]")
    const accountIdsCSV = searchParams.get("accountIds")
    const accountIds = [
      ...accountIdsParam,
      ...(accountIdsCSV ? accountIdsCSV.split(',') : [])
    ].map(s => s.trim()).filter(Boolean)
    const start = searchParams.get("start") || undefined
    const end = searchParams.get("end") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Helper to apply filters consistently
    const validAssetClasses = ["futures", "options", "stocks", "crypto"]
    const validStatuses = ["open", "closed", "expired"]
    const applyFilters = (qb: any) => {
      let q = qb.eq('user_id', user.id)
      if (symbol) q = q.ilike('symbol', `%${symbol}%`)
      if (status && validStatuses.includes(status)) q = q.eq('status', status)
      if (asset_class && validAssetClasses.includes(asset_class)) q = q.eq('asset_type', asset_class)
      if (accountIds && accountIds.length > 0) q = q.in('account_id', accountIds)
      if (start) q = q.gte('effective_date', start)
      if (end) q = q.lte('effective_date', end)
      return q
    }

    // Count query with identical filters
    const { count, error: countError } = await applyFilters(
      supabase.from('trades_view').select('id', { count: 'exact', head: true })
    )
    if (countError) {
      console.error('Error counting trades:', countError)
      return NextResponse.json({ error: "Failed to count trades" }, { status: 500 })
    }

    // Data query with identical filters + ordering + range
    let dataQuery = applyFilters(
      supabase.from('trades_view').select('*')
    )
    // Order by close time if available, otherwise exit_date then entry_date
    dataQuery = dataQuery
      .order('effective_date', { ascending: false })
      .order('id', { ascending: false })

    const { data: trades, error } = await dataQuery
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching trades:', error)
      return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 })
    }

    return NextResponse.json({
      items: trades || [],
      meta: {
        count: count || 0,
        has_more: (count || 0) > (offset + (trades?.length || 0)),
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
      symbol: String(body.symbol).trim().toUpperCase(),
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
      underlying: body.underlying ? String(body.underlying).trim().toUpperCase() : null,
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
