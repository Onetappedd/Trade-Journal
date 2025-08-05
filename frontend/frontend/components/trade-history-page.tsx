"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react"

const mockTrades = [
  {
    id: 1,
    date: "2024-01-15",
    symbol: "AAPL",
    action: "BUY",
    quantity: 100,
    price: 175.5,
    fees: 9.95,
    pnl: 234.5,
    status: "Closed",
    strategy: "Swing Trading",
  },
  {
    id: 2,
    date: "2024-01-14",
    symbol: "TSLA",
    action: "SELL",
    quantity: 50,
    price: 245.3,
    fees: 9.95,
    pnl: -123.45,
    status: "Closed",
    strategy: "Day Trading",
  },
  {
    id: 3,
    date: "2024-01-13",
    symbol: "MSFT",
    action: "BUY",
    quantity: 75,
    price: 378.9,
    fees: 9.95,
    pnl: 456.78,
    status: "Open",
    strategy: "Position Trading",
  },
  {
    id: 4,
    date: "2024-01-12",
    symbol: "GOOGL",
    action: "SELL",
    quantity: 25,
    price: 2750.0,
    fees: 9.95,
    pnl: 789.12,
    status: "Closed",
    strategy: "Swing Trading",
  },
  {
    id: 5,
    date: "2024-01-11",
    symbol: "NVDA",
    action: "BUY",
    quantity: 30,
    price: 875.2,
    fees: 9.95,
    pnl: -345.67,
    status: "Closed",
    strategy: "Scalping",
  },
]

export function TradeHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredTrades = mockTrades.filter((trade) => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || trade.status.toLowerCase() === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Trade History</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your trades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trades ({filteredTrades.length})</CardTitle>
          <CardDescription>Your complete trading history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>{trade.date}</TableCell>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={trade.action === "BUY" ? "default" : "secondary"}>{trade.action}</Badge>
                  </TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell>${trade.price.toFixed(2)}</TableCell>
                  <TableCell className={trade.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.status === "Open" ? "outline" : "secondary"}>{trade.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{trade.strategy}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
