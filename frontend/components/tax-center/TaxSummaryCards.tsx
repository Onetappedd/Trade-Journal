"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Calendar, DollarSign, Clock, Target } from "lucide-react"

const taxData = {
  ytdRealizedPnL: 45250.75,
  ytdUnrealizedPnL: -8420.3,
  totalTrades: 156,
  netPnL: 36830.45,
  realizedGains: 62180.25,
  realizedLosses: -16929.5,
  shortTermGains: 28450.75,
  longTermGains: 16799.5,
}

export function TaxSummaryCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">YTD Realized P&L</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${taxData.ytdRealizedPnL.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From {taxData.totalTrades} closed positions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">YTD Unrealized P&L</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">${taxData.ytdUnrealizedPnL.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From open positions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${taxData.netPnL.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total realized gains/losses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Realized Gains</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${taxData.realizedGains.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total winning trades</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Realized Losses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">${taxData.realizedLosses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total losing trades</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Short-Term Gains</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${taxData.shortTermGains.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Held ≤ 1 year (taxed as income)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Long-Term Gains</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${taxData.longTermGains.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Held &gt; 1 year (preferential tax rate)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{taxData.totalTrades}</div>
          <p className="text-xs text-muted-foreground">Taxable events this year</p>
        </CardContent>
      </Card>
    </div>
  )
}
