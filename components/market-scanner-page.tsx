"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, TrendingUp, TrendingDown, Volume, Star, Plus } from "lucide-react"

const mockScanResults = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 178.25,
    change: 2.75,
    changePercent: 1.57,
    volume: 45678900,
    marketCap: "2.8T",
    signal: "Bullish Breakout",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 238.9,
    change: -6.4,
    changePercent: -2.61,
    volume: 78901234,
    marketCap: "759B",
    signal: "Support Test",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 385.2,
    change: 6.3,
    changePercent: 1.66,
    volume: 23456789,
    marketCap: "2.9T",
    signal: "Momentum",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 2789.45,
    change: 39.45,
    changePercent: 1.43,
    volume: 12345678,
    marketCap: "1.7T",
    signal: "Volume Spike",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 875.2,
    change: -12.8,
    changePercent: -1.44,
    volume: 56789012,
    marketCap: "2.2T",
    signal: "Oversold",
  },
]

const presetScans = [
  { name: "Gap Up", count: 23 },
  { name: "Gap Down", count: 18 },
  { name: "High Volume", count: 45 },
  { name: "Breakout", count: 12 },
  { name: "Oversold", count: 34 },
  { name: "Overbought", count: 28 },
]

export function MarketScannerPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedScan, setSelectedScan] = useState("custom")

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Market Scanner</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Save Scan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="presets">Preset Scans</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          {/* Scanner Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Criteria</CardTitle>
              <CardDescription>Set your scanning parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Market Cap</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="large">Large Cap &gt;10B</SelectItem>
                      <SelectItem value="mid">Mid Cap 2B-10B</SelectItem>
                      <SelectItem value="small">Small Cap &lt;2B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="flex space-x-2">
                    <Input placeholder="Min" type="number" />
                    <Input placeholder="Max" type="number" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="high">Above Average</SelectItem>
                      <SelectItem value="unusual">Unusual Volume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Technical Signal</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="breakout">Breakout</SelectItem>
                      <SelectItem value="oversold">Oversold</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Run Scan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scan Results */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Results ({mockScanResults.length})</CardTitle>
              <CardDescription>Stocks matching your criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Market Cap</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockScanResults.map((stock) => (
                    <TableRow key={stock.symbol}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>{stock.name}</TableCell>
                      <TableCell>${stock.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {stock.change >= 0 ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {stock.change >= 0 ? "+" : ""}
                          {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Volume className="mr-1 h-3 w-3 text-muted-foreground" />
                          {(stock.volume / 1000000).toFixed(1)}M
                        </div>
                      </TableCell>
                      <TableCell>{stock.marketCap}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stock.signal}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {presetScans.map((scan) => (
              <Card key={scan.name} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{scan.name}</CardTitle>
                  <CardDescription>{scan.count} stocks found</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-transparent">
                    Run Scan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="watchlist">
          <Card>
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
              <CardDescription>Stocks you're monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Your watchlist is empty. Add stocks from scan results to start monitoring them.
                </p>
                <Button variant="outline">Add Stocks</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
