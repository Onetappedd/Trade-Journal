"use client"

import { useState, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { TradeFilters } from "@/components/trade-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Eye, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Trade {
  id: string
  symbol: string
  assetType: string
  broker: string
  entryDate: string
  exitDate?: string
  entryPrice: number
  exitPrice?: number
  quantity: number
  side: string
  pnl?: number
  status: string
  tags: string[]
  notes: string
}

const mockTrades: Trade[] = [
  {
    id: "1",
    symbol: "AAPL",
    assetType: "stock",
    broker: "webull",
    entryDate: "2024-01-15T09:30:00",
    exitDate: "2024-01-15T15:45:00",
    entryPrice: 185.5,
    exitPrice: 187.25,
    quantity: 100,
    side: "buy",
    pnl: 175.0,
    status: "closed",
    tags: ["Day Trade", "Breakout"],
    notes: "Clean breakout above resistance",
  },
  {
    id: "2",
    symbol: "TSLA",
    assetType: "option",
    broker: "robinhood",
    entryDate: "2024-01-14T10:15:00",
    exitDate: "2024-01-14T14:30:00",
    entryPrice: 2.45,
    exitPrice: 1.8,
    quantity: 10,
    side: "buy",
    pnl: -650.0,
    status: "closed",
    tags: ["Options", "Earnings Play"],
    notes: "Earnings miss, quick exit",
  },
  {
    id: "3",
    symbol: "NVDA",
    assetType: "stock",
    broker: "schwab",
    entryDate: "2024-01-13T11:00:00",
    entryPrice: 520.75,
    quantity: 50,
    side: "buy",
    status: "open",
    tags: ["Swing", "AI Play"],
    notes: "Long-term AI growth play",
  },
  {
    id: "4",
    symbol: "SPY",
    assetType: "option",
    broker: "ibkr",
    entryDate: "2024-01-12T09:45:00",
    exitDate: "2024-01-12T16:00:00",
    entryPrice: 1.25,
    exitPrice: 1.85,
    quantity: 20,
    side: "buy",
    pnl: 1200.0,
    status: "closed",
    tags: ["Scalp", "SPY"],
    notes: "Quick scalp on market bounce",
  },
  {
    id: "5",
    symbol: "QQQ",
    assetType: "stock",
    broker: "webull",
    entryDate: "2024-01-11T14:20:00",
    exitDate: "2024-01-11T15:55:00",
    entryPrice: 385.2,
    exitPrice: 383.45,
    quantity: 25,
    side: "buy",
    pnl: -43.75,
    status: "closed",
    tags: ["Day Trade", "Tech"],
    notes: "Failed to hold support",
  },
]

export default function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>(mockTrades)
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>(mockTrades)
  const [sortField, setSortField] = useState<keyof Trade>("entryDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [itemsPerPage, setItemsPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)

  const { toast } = useToast()

  const handleFiltersChange = useCallback(
    (filters: any) => {
      let filtered = [...trades]

      // Apply filters
      if (filters.ticker) {
        filtered = filtered.filter((trade) => trade.symbol.toLowerCase().includes(filters.ticker.toLowerCase()))
      }

      if (filters.assetType && filters.assetType !== "all") {
        filtered = filtered.filter((trade) => trade.assetType === filters.assetType)
      }

      if (filters.broker && filters.broker !== "all") {
        filtered = filtered.filter((trade) => trade.broker === filters.broker)
      }

      if (filters.status && filters.status !== "all") {
        filtered = filtered.filter((trade) => trade.status === filters.status)
      }

      if (filters.dateFrom) {
        filtered = filtered.filter((trade) => new Date(trade.entryDate) >= new Date(filters.dateFrom))
      }

      if (filters.dateTo) {
        filtered = filtered.filter((trade) => new Date(trade.entryDate) <= new Date(filters.dateTo))
      }

      if (filters.pnlMin) {
        filtered = filtered.filter((trade) => trade.pnl !== undefined && trade.pnl >= Number.parseFloat(filters.pnlMin))
      }

      if (filters.pnlMax) {
        filtered = filtered.filter((trade) => trade.pnl !== undefined && trade.pnl <= Number.parseFloat(filters.pnlMax))
      }

      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter((trade) => filters.tags.some((tag: string) => trade.tags.includes(tag)))
      }

      setFilteredTrades(filtered)
      setCurrentPage(1)
    },
    [trades],
  )

  const handleSort = (field: keyof Trade) => {
    const direction = field === sortField && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...filteredTrades].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]

      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1

      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    setFilteredTrades(sorted)
  }

  const handleDeleteTrade = (tradeId: string) => {
    setTrades((prev) => prev.filter((trade) => trade.id !== tradeId))
    setFilteredTrades((prev) => prev.filter((trade) => trade.id !== tradeId))
    toast({
      title: "Trade deleted",
      description: "The trade has been removed from your journal.",
    })
  }

  const totalPages = Math.ceil(filteredTrades.length / Number.parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * Number.parseInt(itemsPerPage)
  const endIndex = startIndex + Number.parseInt(itemsPerPage)
  const currentTrades = filteredTrades.slice(startIndex, endIndex)

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  const winningTrades = filteredTrades.filter((trade) => (trade.pnl || 0) > 0).length
  const winRate = filteredTrades.length > 0 ? (winningTrades / filteredTrades.length) * 100 : 0

  return (
    <div className="flex flex-col">
      <Navbar title="Trade History" />

      <div className="flex-1 space-y-6 p-6">
        {/* Filters */}
        <TradeFilters onFiltersChange={handleFiltersChange} />

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredTrades.length}</div>
              <p className="text-xs text-muted-foreground">Total Trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${totalPnL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total P&L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredTrades.filter((t) => t.status === "open").length}</div>
              <p className="text-xs text-muted-foreground">Open Trades</p>
            </CardContent>
          </Card>
        </div>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trades</CardTitle>
                <CardDescription>Your complete trading history</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("symbol")}>
                        Symbol <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("entryDate")}>
                        Entry Date <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Exit Date</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("pnl")}>
                        P&L <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.assetType}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{trade.broker}</TableCell>
                      <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className={trade.pnl && trade.pnl > 0 ? "text-green-600" : "text-red-600"}>
                        {trade.pnl ? `$${trade.pnl.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.status === "open" ? "default" : "secondary"}>{trade.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {trade.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {trade.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{trade.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTrade(trade.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length}{" "}
                  trades
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
