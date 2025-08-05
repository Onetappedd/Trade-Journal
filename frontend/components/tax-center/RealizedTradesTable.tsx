"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

type Trade = {
  id: string
  date: string
  symbol: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  pnl: number
  holdingPeriod: number
  taxType: "SHORT" | "LONG"
}

const mockTrades: Trade[] = [
  {
    id: "1",
    date: "2024-01-15",
    symbol: "AAPL",
    type: "SELL",
    quantity: 100,
    price: 185.5,
    pnl: 2450.0,
    holdingPeriod: 45,
    taxType: "SHORT",
  },
  {
    id: "2",
    date: "2024-01-20",
    symbol: "TSLA",
    type: "SELL",
    quantity: 50,
    price: 220.75,
    pnl: -850.0,
    holdingPeriod: 12,
    taxType: "SHORT",
  },
  {
    id: "3",
    date: "2024-02-10",
    symbol: "MSFT",
    type: "SELL",
    quantity: 75,
    price: 415.25,
    pnl: 3200.0,
    holdingPeriod: 380,
    taxType: "LONG",
  },
  {
    id: "4",
    date: "2024-02-28",
    symbol: "GOOGL",
    type: "SELL",
    quantity: 25,
    price: 142.8,
    pnl: 1850.0,
    holdingPeriod: 28,
    taxType: "SHORT",
  },
  {
    id: "5",
    date: "2024-03-15",
    symbol: "NVDA",
    type: "SELL",
    quantity: 30,
    price: 875.25,
    pnl: 4200.0,
    holdingPeriod: 420,
    taxType: "LONG",
  },
]

type SortField = keyof Trade
type SortDirection = "asc" | "desc"

export function RealizedTradesTable() {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedTrades = [...mockTrades].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realized Trades</CardTitle>
        <CardDescription>All closed positions with tax implications for the current year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("date")} className="h-auto p-0 font-semibold">
                    Date <SortIcon field="date" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("symbol")} className="h-auto p-0 font-semibold">
                    Symbol <SortIcon field="symbol" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("quantity")} className="h-auto p-0 font-semibold">
                    Quantity <SortIcon field="quantity" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("price")} className="h-auto p-0 font-semibold">
                    Price <SortIcon field="price" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("pnl")} className="h-auto p-0 font-semibold">
                    P&L <SortIcon field="pnl" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("holdingPeriod")}
                    className="h-auto p-0 font-semibold"
                  >
                    Holding Period <SortIcon field="holdingPeriod" />
                  </Button>
                </TableHead>
                <TableHead>Tax Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>{trade.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{trade.quantity}</TableCell>
                  <TableCell className="text-right">${trade.price.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${trade.pnl.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{trade.holdingPeriod} days</TableCell>
                  <TableCell>
                    <Badge variant={trade.taxType === "LONG" ? "default" : "destructive"}>{trade.taxType}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
