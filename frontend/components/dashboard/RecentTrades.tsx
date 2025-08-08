"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface Trade {
  id: string
  symbol: string
  side: string
  quantity: number
  entry_price: number
  entry_date: string
  exit_price?: number | null
  exit_date?: string | null
  status?: string
  pnl: number
}

interface RecentTradesProps {
  trades: Trade[]
}

export function RecentTrades({ trades }: RecentTradesProps) {
  // Show placeholder if no trades
  const displayTrades = trades.length > 0 ? trades : [
    {
      id: "placeholder-1",
      symbol: "No trades yet",
      side: "buy",
      quantity: 0,
      entry_price: 0,
      entry_date: new Date().toISOString(),
      status: "open",
      pnl: 0,
    }
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Trades</CardTitle>
        <Link href="/dashboard/trades">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayTrades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{trade.symbol}</div>
                  {trade.quantity > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {trade.side.charAt(0).toUpperCase() + trade.side.slice(1)} {trade.quantity} @ ${trade.entry_price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {trade.pnl !== 0 && (trade.pnl >= 0 ? "+" : "")}
                    {trade.pnl !== 0 ? `$${Math.abs(trade.pnl).toFixed(2)}` : "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(trade.exit_date || trade.entry_date).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={trade.status === "open" ? "destructive" : "default"}>
                  {trade.status === "open" ? "Open" : "Closed"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}