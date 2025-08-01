"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Volume, Star, Plus, RefreshCw } from "lucide-react"

const trendingStocks = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.2,
    change: 45.3,
    changePercent: 5.46,
    volume: 89234567,
    marketCap: "2.2T",
    mentions: 1247,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 238.9,
    change: 12.45,
    changePercent: 5.5,
    volume: 78901234,
    marketCap: "759B",
    mentions: 892,
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    price: 165.75,
    change: 8.9,
    changePercent: 5.67,
    volume: 45678901,
    marketCap: "268B",
    mentions: 634,
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 178.25,
    change: 2.75,
    changePercent: 1.57,
    volume: 45678900,
    marketCap: "2.8T",
    mentions: 567,
  },
]

const topGainers = [
  { symbol: "SMCI", price: 245.67, change: 23.45, changePercent: 10.55 },
  { symbol: "PLTR", price: 18.9, change: 1.67, changePercent: 9.68 },
  { symbol: "RIVN", price: 12.34, change: 1.02, changePercent: 9.02 },
  { symbol: "LCID", price: 8.76, change: 0.67, changePercent: 8.28 },
  { symbol: "NIO", price: 15.43, change: 1.12, changePercent: 7.82 },
]

const topLosers = [
  { symbol: "NFLX", price: 456.78, change: -34.56, changePercent: -7.03 },
  { symbol: "PYPL", price: 67.89, change: -4.23, changePercent: -5.87 },
  { symbol: "SHOP", price: 78.9, change: -4.56, changePercent: -5.46 },
  { symbol: "SQ", price: 89.12, change: -4.78, changePercent: -5.09 },
  { symbol: "ROKU", price: 45.67, change: -2.34, changePercent: -4.88 },
]

const mostActive = [
  { symbol: "SPY", volume: 123456789, price: 478.9, change: 2.34 },
  { symbol: "QQQ", volume: 98765432, price: 389.45, change: 4.56 },
  { symbol: "TSLA", volume: 78901234, price: 238.9, change: 12.45 },
  { symbol: "AAPL", volume: 67890123, price: 178.25, change: 2.75 },
  { symbol: "NVDA", volume: 56789012, price: 875.2, change: 45.3 },
]

export function TrendingTickersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Trending Tickers</h2>
        <div className="flex items-center space-x-2">
          <Select defaultValue="1d">
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="1w">1 Week</SelectItem>
              <SelectItem value="1m">1 Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Trending Stocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Most Trending
          </CardTitle>
          <CardDescription>Stocks with highest social media mentions and volume</CardDescription>
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
                <TableHead>Mentions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trendingStocks.map((stock) => (
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
                      {stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Volume className="mr-1 h-3 w-3 text-muted-foreground" />
                      {(stock.volume / 1000000).toFixed(1)}M
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{stock.mentions}</Badge>
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

      {/* Market Movers */}
      <Tabs defaultValue="gainers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
          <TabsTrigger value="losers">Top Losers</TabsTrigger>
          <TabsTrigger value="active">Most Active</TabsTrigger>
        </TabsList>

        <TabsContent value="gainers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <TrendingUp className="mr-2 h-5 w-5" />
                Top Gainers
              </CardTitle>
              <CardDescription>Stocks with the highest percentage gains today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topGainers.map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">${stock.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+${stock.change.toFixed(2)}</p>
                      <p className="text-sm text-green-600">+{stock.changePercent.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="losers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <TrendingDown className="mr-2 h-5 w-5" />
                Top Losers
              </CardTitle>
              <CardDescription>Stocks with the highest percentage losses today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topLosers.map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">${stock.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">${stock.change.toFixed(2)}</p>
                      <p className="text-sm text-red-600">{stock.changePercent.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume className="mr-2 h-5 w-5" />
                Most Active
              </CardTitle>
              <CardDescription>Stocks with the highest trading volume today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostActive.map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{(stock.volume / 1000000).toFixed(1)}M volume</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${stock.price.toFixed(2)}</p>
                      <p className={`text-sm ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
