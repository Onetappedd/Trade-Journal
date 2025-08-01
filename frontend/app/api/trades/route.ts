import { type NextRequest, NextResponse } from "next/server"

// Mock trades data
const mockTrades = [
  {
    id: "trade-1",
    user_id: "user-1",
    symbol: "AAPL",
    asset_type: "stock",
    side: "buy",
    quantity: 100,
    entry_price: 150.0,
    exit_price: 155.0,
    entry_date: "2024-01-15T10:30:00Z",
    exit_date: "2024-01-20T15:45:00Z",
    pnl: 500.0,
    status: "closed",
    notes: "Good momentum trade on earnings beat",
    tags: ["swing-trade", "earnings-play"],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T15:45:00Z",
  },
  {
    id: "trade-2",
    user_id: "user-1",
    symbol: "TSLA",
    asset_type: "stock",
    side: "buy",
    quantity: 50,
    entry_price: 200.0,
    exit_price: null,
    entry_date: "2024-01-22T09:15:00Z",
    exit_date: null,
    pnl: 0,
    status: "open",
    notes: "Breakout above resistance",
    tags: ["day-trade", "breakout"],
    created_at: "2024-01-22T09:15:00Z",
    updated_at: "2024-01-22T09:15:00Z",
  },
  {
    id: "trade-3",
    user_id: "user-1",
    symbol: "NVDA",
    asset_type: "stock",
    side: "sell",
    quantity: 25,
    entry_price: 800.0,
    exit_price: 750.0,
    entry_date: "2024-01-10T14:20:00Z",
    exit_date: "2024-01-18T11:30:00Z",
    pnl: -1250.0,
    status: "closed",
    notes: "Stop loss hit on market downturn",
    tags: ["swing-trade", "stop-loss"],
    created_at: "2024-01-10T14:20:00Z",
    updated_at: "2024-01-18T11:30:00Z",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const status = searchParams.get("status")
  const asset_type = searchParams.get("asset_type")
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  let filteredTrades = [...mockTrades]

  // Apply filters
  if (symbol) {
    filteredTrades = filteredTrades.filter((trade) => trade.symbol.toLowerCase().includes(symbol.toLowerCase()))
  }

  if (status) {
    filteredTrades = filteredTrades.filter((trade) => trade.status === status)
  }

  if (asset_type) {
    filteredTrades = filteredTrades.filter((trade) => trade.asset_type === asset_type)
  }

  // Apply pagination
  const paginatedTrades = filteredTrades.slice(offset, offset + limit)

  return NextResponse.json({
    data: paginatedTrades,
    meta: {
      total: filteredTrades.length,
      limit,
      offset,
      has_more: offset + limit < filteredTrades.length,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["symbol", "asset_type", "side", "quantity", "entry_price", "entry_date"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create new trade with mock ID
    const newTrade = {
      id: `trade-${Date.now()}`,
      user_id: body.user_id || "user-1",
      symbol: body.symbol.toUpperCase(),
      asset_type: body.asset_type,
      side: body.side,
      quantity: Number.parseFloat(body.quantity),
      entry_price: Number.parseFloat(body.entry_price),
      exit_price: body.exit_price ? Number.parseFloat(body.exit_price) : null,
      entry_date: body.entry_date,
      exit_date: body.exit_date || null,
      pnl: body.exit_price
        ? (Number.parseFloat(body.exit_price) - Number.parseFloat(body.entry_price)) *
          Number.parseFloat(body.quantity) *
          (body.side === "buy" ? 1 : -1)
        : 0,
      status: body.exit_date ? "closed" : "open",
      notes: body.notes || "",
      tags: body.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // In a real app, this would be saved to the database
    mockTrades.push(newTrade)

    return NextResponse.json(newTrade, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}
