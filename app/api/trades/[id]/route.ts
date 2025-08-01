import { type NextRequest, NextResponse } from "next/server"

// Mock trades data (same as above for consistency)
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
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const trade = mockTrades.find((t) => t.id === params.id)

  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 })
  }

  return NextResponse.json(trade)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const tradeIndex = mockTrades.findIndex((t) => t.id === params.id)

    if (tradeIndex === -1) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    // Update the trade
    const updatedTrade = {
      ...mockTrades[tradeIndex],
      ...body,
      updated_at: new Date().toISOString(),
    }

    // Recalculate PnL if prices changed
    if (body.exit_price || body.entry_price || body.quantity) {
      const exitPrice = updatedTrade.exit_price
      const entryPrice = updatedTrade.entry_price
      const quantity = updatedTrade.quantity
      const side = updatedTrade.side

      if (exitPrice && entryPrice) {
        updatedTrade.pnl = (exitPrice - entryPrice) * quantity * (side === "buy" ? 1 : -1)
        updatedTrade.status = "closed"
      }
    }

    mockTrades[tradeIndex] = updatedTrade

    return NextResponse.json(updatedTrade)
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const tradeIndex = mockTrades.findIndex((t) => t.id === params.id)

  if (tradeIndex === -1) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 })
  }

  mockTrades.splice(tradeIndex, 1)

  return NextResponse.json({ message: "Trade deleted successfully" }, { status: 200 })
}
