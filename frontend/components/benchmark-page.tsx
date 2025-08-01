"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, BarChart3, Target } from "lucide-react"

const benchmarkData = [
  {
    name: "S&P 500",
    symbol: "SPY",
    ytdReturn: 12.5,
    monthReturn: 2.1,
    weekReturn: 0.8,
    correlation: 0.85,
  },
  {
    name: "NASDAQ 100",
    symbol: "QQQ",
    ytdReturn: 18.3,
    monthReturn: 3.2,
    weekReturn: 1.2,
    correlation: 0.92,
  },
  {
    name: "Russell 2000",
    symbol: "IWM",
    ytdReturn: 8.7,
    monthReturn: 1.5,
    weekReturn: 0.3,
    correlation: 0.65,
  },
  {
    name: "Dow Jones",
    symbol: "DIA",
    ytdReturn: 9.8,
    monthReturn: 1.8,
    weekReturn: 0.6,
    correlation: 0.78,
  },
]

const portfolioPerformance = {
  ytdReturn: 15.2,
  monthReturn: 2.8,
  weekReturn: 1.1,
  sharpeRatio: 1.85,
  alpha: 2.7,
  beta: 1.15,
}

export function BenchmarkPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Benchmark Comparison</h2>
        <div className="flex items-center space-x-2">
          <Select defaultValue="ytd">
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ytd">YTD</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="3y">3 Years</SelectItem>
              <SelectItem value="5y">5 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{portfolioPerformance.ytdReturn}%</div>
            <p className="text-xs text-muted-foreground">Year to date performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alpha</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{portfolioPerformance.alpha}%</div>
            <p className="text-xs text-muted-foreground">Excess return vs S&P 500</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beta</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioPerformance.beta}</div>
            <p className="text-xs text-muted-foreground">Market sensitivity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{portfolioPerformance.sharpeRatio}</div>
            <p className="text-xs text-muted-foreground">Risk-adjusted returns</p>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Benchmarks</CardTitle>
          <CardDescription>Compare your portfolio against major market indices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benchmark</TableHead>
                <TableHead>YTD Return</TableHead>
                <TableHead>Month Return</TableHead>
                <TableHead>Week Return</TableHead>
                <TableHead>Correlation</TableHead>
                <TableHead>Outperformance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">
                  <div>
                    <p className="font-bold">Your Portfolio</p>
                    <p className="text-sm text-muted-foreground">Personal</p>
                  </div>
                </TableCell>
                <TableCell className="text-green-600 font-medium">+{portfolioPerformance.ytdReturn}%</TableCell>
                <TableCell className="text-green-600 font-medium">+{portfolioPerformance.monthReturn}%</TableCell>
                <TableCell className="text-green-600 font-medium">+{portfolioPerformance.weekReturn}%</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
              {benchmarkData.map((benchmark) => {
                const ytdOutperformance = portfolioPerformance.ytdReturn - benchmark.ytdReturn
                const monthOutperformance = portfolioPerformance.monthReturn - benchmark.monthReturn
                const weekOutperformance = portfolioPerformance.weekReturn - benchmark.weekReturn

                return (
                  <TableRow key={benchmark.symbol}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{benchmark.name}</p>
                        <p className="text-sm text-muted-foreground">{benchmark.symbol}</p>
                      </div>
                    </TableCell>
                    <TableCell className={benchmark.ytdReturn >= 0 ? "text-green-600" : "text-red-600"}>
                      {benchmark.ytdReturn >= 0 ? "+" : ""}
                      {benchmark.ytdReturn}%
                    </TableCell>
                    <TableCell className={benchmark.monthReturn >= 0 ? "text-green-600" : "text-red-600"}>
                      {benchmark.monthReturn >= 0 ? "+" : ""}
                      {benchmark.monthReturn}%
                    </TableCell>
                    <TableCell className={benchmark.weekReturn >= 0 ? "text-green-600" : "text-red-600"}>
                      {benchmark.weekReturn >= 0 ? "+" : ""}
                      {benchmark.weekReturn}%
                    </TableCell>
                    <TableCell>{benchmark.correlation}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={ytdOutperformance >= 0 ? "default" : "secondary"}
                          className={ytdOutperformance >= 0 ? "text-green-600" : "text-red-600"}
                        >
                          {ytdOutperformance >= 0 ? "+" : ""}
                          {ytdOutperformance.toFixed(1)}%
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Chart</CardTitle>
          <CardDescription>Historical performance comparison over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Performance comparison chart will be displayed here</p>
              <p className="text-xs text-gray-400">Portfolio vs S&P 500, NASDAQ, and other benchmarks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
