"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const recentTrades = [
  {
    symbol: "AAPL",
    side: "Buy",
    quantity: 100,
    price: 150.25,
    pnl: 555.0,
    date: "2024-01-20",
    status: "Closed",
  },
  {
    symbol: "TSLA",
    side: "Sell",
    quantity: 50,
    price: 220.0,
    pnl: -125.5,
    date: "2024-01-18",
    status: "Open",
  },
  {
    symbol: "MSFT",
    side: "Buy",
    quantity: 75,
    price: 380.5,
    pnl: 356.25,
    date: "2024-01-15",
    status: "Closed",
  },
  {
    symbol: "NVDA",
    side: "Buy",
    quantity: 25,
    price: 450.0,
    pnl: 1250.0,
    date: "2024-01-12",
    status: "Closed",
  },
]

export function RecentTrades() {
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
          {recentTrades.map((trade, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{trade.symbol}</div>
                  <div className="text-sm text-muted-foreground">
                    {trade.side} {trade.quantity} @ ${trade.price}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">{trade.date}</div>
                </div>
                <Badge variant={trade.status === "Open" ? "destructive" : "default"}>{trade.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
