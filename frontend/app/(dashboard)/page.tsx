"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { supabase } from "@/lib/supabase"
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  getProfitLossColor,
  calculateWinRate,
  calculateTotalPnL,
  calculateAverageProfit,
} from "@/lib/utils"

interface Trade {
  id: string
  symbol: string
  asset_type: string
  trade_type: string
  quantity: number
  entry_price: number
  exit_price: number | null
  profit_loss: number | null
  trade_date: string
  exit_date: string | null
  status: string
  tags: string[]
}

interface DashboardStats {
  totalTrades: number
  totalPnL: number
  winRate: number
  averageProfit: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalTrades: 0,
    totalPnL: 0,
    winRate: 0,
    averageProfit: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Fetch trades
      const { data: tradesData, error: tradesError } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("trade_date", { ascending: false })
        .limit(5)

      if (tradesError) {
        throw tradesError
      }

      const trades = tradesData || []
      setTrades(trades)

      // Calculate stats
      const totalTrades = trades.length
      const totalPnL = calculateTotalPnL(trades)
      const winRate = calculateWinRate(trades)
      const averageProfit = calculateAverageProfit(trades)

      setStats({
        totalTrades,
        totalPnL,
        winRate,
        averageProfit,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchDashboardData} variant="outline" className="w-full bg-transparent">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track your trading performance and analyze your strategies.</p>
        </div>
        <Button onClick={() => router.push("/add-trade")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Trade
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTrades > 0 ? "Active trading" : "Start trading"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitLossColor(stats.totalPnL)}`}>
              {formatCurrency(stats.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">{stats.totalPnL >= 0 ? "Profitable" : "Needs improvement"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.winRate)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.winRate >= 50 ? "Above average" : "Room for improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitLossColor(stats.averageProfit)}`}>
              {formatCurrency(stats.averageProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Per trade</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Your latest trading activity</CardDescription>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No trades yet</p>
              <Button onClick={() => router.push("/add-trade")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Trade
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.symbol}</span>
                      <Badge variant={trade.trade_type === "buy" ? "default" : "secondary"}>
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{trade.asset_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {trade.quantity} shares @ {formatCurrency(trade.entry_price)} • {formatDate(trade.trade_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${getProfitLossColor(trade.profit_loss || 0)}`}>
                      {trade.profit_loss ? formatCurrency(trade.profit_loss) : "—"}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">{trade.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
