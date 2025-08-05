"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { format } from "date-fns"
import Link from "next/link"

interface Trade {
  id: string
  symbol: string
  side: "buy" | "sell"
  quantity: number
  entry_price: number
  exit_price: number | null
  entry_date: string
  exit_date: string | null
  asset_type: "stock" | "option" | "crypto" | "forex"
  strategy: string | null
  notes: string | null
  fees: number | null
  pnl: number | null
  created_at: string
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all")
  const [filterAssetType, setFilterAssetType] = useState<"all" | "stock" | "option" | "crypto" | "forex">("all")

  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTrades(data || [])
    } catch (error) {
      console.error("Error fetching trades:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.strategy && trade.strategy.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "open" && !trade.exit_price) ||
      (filterStatus === "closed" && trade.exit_price)

    const matchesAssetType = filterAssetType === "all" || trade.asset_type === filterAssetType

    return matchesSearch && matchesStatus && matchesAssetType
  })

  const calculatePnL = (trade: Trade) => {
    if (!trade.exit_price) return null
    const pnl =
      trade.side === "buy"
        ? (trade.exit_price - trade.entry_price) * trade.quantity
        : (trade.entry_price - trade.exit_price) * trade.quantity
    return pnl - (trade.fees || 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const totalPnL = filteredTrades.reduce((sum, trade) => {
    const pnl = calculatePnL(trade)
    return sum + (pnl || 0)
  }, 0)

  const openTrades = filteredTrades.filter((trade) => !trade.exit_price).length
  const closedTrades = filteredTrades.filter((trade) => trade.exit_price).length
  const winningTrades = filteredTrades.filter((trade) => {
    const pnl = calculatePnL(trade)
    return pnl && pnl > 0
  }).length

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Trade History</h1>
          <p className="text-muted-foreground">Track and analyze your trading performance</p>
        </div>
        <Link href="/trades/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPnL >= 0 ? "+" : ""}
              {((totalPnL / Math.max(1, filteredTrades.length * 1000)) * 100).toFixed(2)}% avg return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTrades}</div>
            <p className="text-xs text-muted-foreground">Active trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Trades</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedTrades}</div>
            <p className="text-xs text-muted-foreground">Completed positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {closedTrades > 0 ? ((winningTrades / closedTrades) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {winningTrades} of {closedTrades} profitable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or strategy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="open">Open Positions</SelectItem>
                <SelectItem value="closed">Closed Trades</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAssetType} onValueChange={(value: any) => setFilterAssetType(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="option">Options</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>{filteredTrades.length} trades found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No trades found</p>
              <Link href="/trades/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Trade
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Exit Price</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => {
                    const pnl = calculatePnL(trade)
                    return (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {trade.asset_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.side === "buy" ? "default" : "secondary"}>
                            {trade.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.quantity.toLocaleString()}</TableCell>
                        <TableCell>{formatCurrency(trade.entry_price)}</TableCell>
                        <TableCell>{trade.exit_price ? formatCurrency(trade.exit_price) : "-"}</TableCell>
                        <TableCell>{format(new Date(trade.entry_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {pnl !== null ? (
                            <span className={pnl >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(pnl)}</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.exit_price ? "default" : "secondary"}>
                            {trade.exit_price ? "Closed" : "Open"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
