"use client"

import * as React from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TradeStats() {
  const { user } = useAuth()
  const fetcher = async () => {
    if (!user) return []
    const supabase = createClient()
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
    if (error) throw error
    return data || []
  }
  const { data: trades, isLoading } = useSWR(user ? ["user-trades", user.id] : null, fetcher)

  if (isLoading) return <div>Loading stats...</div>
  if (!trades || trades.length === 0) return <div>No trades yet.</div>

  // Compute stats
  const total = trades.length
  const closed = trades.filter((t: any) => t.status === "closed")
  const wins = closed.filter((t: any) => (t.exit_price && t.entry_price && t.side === "buy") ? t.exit_price > t.entry_price : false)
  const losses = closed.filter((t: any) => (t.exit_price && t.entry_price && t.side === "buy") ? t.exit_price < t.entry_price : false)
  const winRate = closed.length ? ((wins.length / closed.length) * 100).toFixed(1) : "0.0"
  const totalPnL = closed.reduce((sum: number, t: any) => sum + ((t.exit_price && t.entry_price && t.side === "buy") ? (t.exit_price - t.entry_price) * t.quantity : 0), 0)
  const avgPnL = closed.length ? (totalPnL / closed.length).toFixed(2) : "0.00"
  const bestTrade = closed.reduce((max: number, t: any) => Math.max(max, ((t.exit_price && t.entry_price && t.side === "buy") ? (t.exit_price - t.entry_price) * t.quantity : 0)), 0)
  const worstTrade = closed.reduce((min: number, t: any) => Math.min(min, ((t.exit_price && t.entry_price && t.side === "buy") ? (t.exit_price - t.entry_price) * t.quantity : 0)), 0)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Trade Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Trades</p>
            <p className="font-medium tabular-nums">{total}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Win Rate</p>
            <p className="font-medium text-green-600 tabular-nums">{winRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total P&L</p>
            <p className="font-medium tabular-nums">${totalPnL.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg P&L</p>
            <p className="font-medium tabular-nums">${avgPnL}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Best Trade</p>
            <p className="font-medium text-green-700 tabular-nums">${bestTrade.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Worst Trade</p>
            <p className="font-medium text-red-700 tabular-nums">${worstTrade.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
