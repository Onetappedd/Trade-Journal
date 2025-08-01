"use client"

import { useState, useMemo } from "react"
import { TradeFilters } from "@/components/trade-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Eye, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteTradeAction } from "@/app/actions/trades"
import { format } from "date-fns"

type Trade = {
  id: string
  symbol: string
  asset_type: string
  entry_date: string
  exit_date?: string | null
  entry_price: number
  exit_price?: number | null
  quantity: number
  side: string
  pnl?: number | null
  status: string
  tags: string[]
  notes?: string | null
}

export function TradeHistoryClient({ initialTrades }: { initialTrades: Trade[] }) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades)
  const [filters, setFilters] = useState<any>({})
  const [sortField, setSortField] = useState<keyof Trade>("entry_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [itemsPerPage, setItemsPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)

  const { toast } = useToast()

  const filteredTrades = useMemo(() => {
    let filtered = [...trades]

    if (filters.ticker) {
      filtered = filtered.filter((trade) => trade.symbol.toLowerCase().includes(filters.ticker.toLowerCase()))
    }
    // Add other filters here based on your TradeFilters component
    // ...

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    return sorted
  }, [trades, filters, sortField, sortDirection])

  const handleSort = (field: keyof Trade) => {
    const direction = field === sortField && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)
  }

  const handleDeleteTrade = async (tradeId: string) => {
    const result = await deleteTradeAction(tradeId)
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setTrades((prev) => prev.filter((trade) => trade.id !== tradeId))
      toast({
        title: "Trade deleted",
        description: "The trade has been removed from your journal.",
      })
    }
  }

  const totalPages = Math.ceil(filteredTrades.length / Number.parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * Number.parseInt(itemsPerPage)
  const endIndex = startIndex + Number.parseInt(itemsPerPage)
  const currentTrades = filteredTrades.slice(startIndex, endIndex)

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  const winningTrades = filteredTrades.filter((trade) => (trade.pnl || 0) > 0).length
  const closedTrades = filteredTrades.filter((trade) => trade.status === "closed").length
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0

  return (
    <>
      <TradeFilters onFiltersChange={setFilters} />

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
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("entry_date")}>
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
                      <Badge variant="outline" className="capitalize">
                        {trade.asset_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(trade.entry_date), "PP")}</TableCell>
                    <TableCell>{trade.exit_date ? format(new Date(trade.exit_date), "PP") : "-"}</TableCell>
                    <TableCell className={trade.pnl && trade.pnl > 0 ? "text-green-600" : "text-red-600"}>
                      {trade.pnl ? `$${trade.pnl.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.status === "open" ? "default" : "secondary"} className="capitalize">
                        {trade.status}
                      </Badge>
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
    </>
  )
}
