"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown } from "lucide-react"

const topTrades = [
  {
    symbol: "NVDA",
    side: "Buy",
    pnl: 2450.0,
    return: 18.5,
    date: "2024-01-15",
    duration: "5 days",
  },
  {
    symbol: "TSLA",
    side: "Sell",
    pnl: 1890.0,
    return: 12.3,
    date: "2024-01-20",
    duration: "3 days",
  },
  {
    symbol: "AAPL",
    side: "Buy",
    pnl: 1250.0,
    return: 8.7,
    date: "2024-01-25",
    duration: "7 days",
  },
]

const worstTrades = [
  {
    symbol: "META",
    side: "Buy",
    pnl: -1200.0,
    return: -15.2,
    date: "2024-01-10",
    duration: "2 days",
  },
  {
    symbol: "AMZN",
    side: "Sell",
    pnl: -890.0,
    return: -8.9,
    date: "2024-01-18",
    duration: "4 days",
  },
  {
    symbol: "GOOGL",
    side: "Buy",
    pnl: -650.0,
    return: -5.4,
    date: "2024-01-22",
    duration: "6 days",
  },
]

export function TopTrades() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Best & Worst Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="best" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="best">Best Trades</TabsTrigger>
            <TabsTrigger value="worst">Worst Trades</TabsTrigger>
          </TabsList>

          <TabsContent value="best" className="space-y-4">
            {topTrades.map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">{trade.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {trade.date} • {trade.duration}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">+${trade.pnl.toLocaleString()}</div>
                  <div className="text-sm text-green-600">+{trade.return}%</div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="worst" className="space-y-4">
            {worstTrades.map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">{trade.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {trade.date} • {trade.duration}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">${trade.pnl.toLocaleString()}</div>
                  <div className="text-sm text-red-600">{trade.return}%</div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
