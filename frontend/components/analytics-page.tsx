"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign } from "lucide-react"

const performanceMetrics = {
  totalTrades: 247,
  winningTrades: 169,
  losingTrades: 78,
  winRate: 68.4,
  avgWin: 245.67,
  avgLoss: -123.45,
  profitFactor: 1.98,
  sharpeRatio: 1.85,
  maxDrawdown: -8.5,
  totalPnL: 12345.67,
}

const monthlyData = [
  { month: "Jan 2024", trades: 52, pnl: 2345.67, winRate: 71.2 },
  { month: "Dec 2023", trades: 48, pnl: 1876.43, winRate: 66.7 },
  { month: "Nov 2023", trades: 41, pnl: 3421.89, winRate: 73.2 },
  { month: "Oct 2023", trades: 39, pnl: -567.23, winRate: 59.0 },
  { month: "Sep 2023", trades: 44, pnl: 2987.45, winRate: 70.5 },
  { month: "Aug 2023", trades: 23, pnl: 1234.56, winRate: 65.2 },
]

const strategyBreakdown = [
  { strategy: "Swing Trading", trades: 89, pnl: 5678.9, winRate: 72.1 },
  { strategy: "Day Trading", trades: 124, pnl: 4321.23, winRate: 65.3 },
  { strategy: "Scalping", trades: 34, pnl: 2345.54, winRate: 70.6 },
]

export function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <div className="flex items-center space-x-2">
          <Select defaultValue="ytd">
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ytd">YTD</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+${performanceMetrics.totalPnL.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +20.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.winRate}%</div>
            <Progress value={performanceMetrics.winRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.winningTrades} wins / {performanceMetrics.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{performanceMetrics.profitFactor}</div>
            <p className="text-xs text-muted-foreground">Gross profit / Gross loss</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{performanceMetrics.maxDrawdown}%</div>
            <p className="text-xs text-muted-foreground">Largest peak-to-trough decline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Trading results by month</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell>{month.trades}</TableCell>
                    <TableCell className={month.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                      {month.pnl >= 0 ? "+" : ""}${month.pnl.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{month.winRate}%</span>
                        <Progress value={month.winRate} className="w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Strategy Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Strategy Performance</CardTitle>
            <CardDescription>Results by trading strategy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategyBreakdown.map((strategy) => (
              <div key={strategy.strategy} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{strategy.strategy}</span>
                  <Badge variant="outline">{strategy.trades} trades</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={strategy.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                    {strategy.pnl >= 0 ? "+" : ""}${strategy.pnl.toFixed(2)}
                  </span>
                  <span>{strategy.winRate}% win rate</span>
                </div>
                <Progress value={strategy.winRate} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
              <span className="font-medium">{performanceMetrics.sharpeRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average Win</span>
              <span className="font-medium text-green-600">+${performanceMetrics.avgWin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average Loss</span>
              <span className="font-medium text-red-600">${performanceMetrics.avgLoss}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trading Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Trades</span>
              <span className="font-medium">{performanceMetrics.totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Trades/Month</span>
              <span className="font-medium">41</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Best Month</span>
              <span className="font-medium text-green-600">Nov 2023</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Ratios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Profit Factor</span>
              <span className="font-medium">{performanceMetrics.profitFactor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Win/Loss Ratio</span>
              <span className="font-medium">1.99</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Expectancy</span>
              <span className="font-medium text-green-600">$50.02</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>Portfolio value over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Equity curve chart will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
