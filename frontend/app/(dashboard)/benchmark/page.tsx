"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle } from "lucide-react"

const performanceData = [
  { month: "Jan", portfolio: 2.5, sp500: 1.8, nasdaq: 3.2, russell: 1.5 },
  { month: "Feb", portfolio: -1.2, sp500: -0.8, nasdaq: -2.1, russell: -0.5 },
  { month: "Mar", portfolio: 4.8, sp500: 3.1, nasdaq: 4.9, russell: 2.8 },
  { month: "Apr", portfolio: 2.1, sp500: 1.9, nasdaq: 2.5, russell: 1.7 },
  { month: "May", portfolio: 6.2, sp500: 4.8, nasdaq: 6.1, russell: 4.2 },
  { month: "Jun", portfolio: -2.8, sp500: -1.5, nasdaq: -3.2, russell: -1.8 },
]

const cumulativeData = [
  { month: "Jan", portfolio: 2.5, sp500: 1.8 },
  { month: "Feb", portfolio: 1.2, sp500: 1.0 },
  { month: "Mar", portfolio: 6.1, sp500: 4.1 },
  { month: "Apr", portfolio: 8.3, sp500: 6.1 },
  { month: "May", portfolio: 15.0, sp500: 11.2 },
  { month: "Jun", portfolio: 11.8, sp500: 9.5 },
]

const riskMetrics = [
  { metric: "Sharpe Ratio", portfolio: 1.85, sp500: 1.42, status: "outperforming" },
  { metric: "Max Drawdown", portfolio: -8.5, sp500: -12.3, status: "outperforming" },
  { metric: "Volatility", portfolio: 18.2, sp500: 16.8, status: "underperforming" },
  { metric: "Beta", portfolio: 1.15, sp500: 1.0, status: "neutral" },
]

export default function Benchmark() {
  const [timeframe, setTimeframe] = useState("6m")
  const [benchmark, setBenchmark] = useState("sp500")

  const portfolioReturn = 11.8
  const benchmarkReturn = 9.5
  const outperformance = portfolioReturn - benchmarkReturn

  const getBenchmarkName = (key: string) => {
    const names = {
      sp500: "S&P 500",
      nasdaq: "NASDAQ",
      russell: "Russell 2000",
      dow: "Dow Jones",
    }
    return names[key as keyof typeof names] || "S&P 500"
  }

  return (
    <div className="flex flex-col">
      <Navbar title="Benchmark Comparison" />

      <div className="flex-1 space-y-6 p-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Portfolio vs {getBenchmarkName(benchmark)}</h2>
          <div className="flex items-center gap-4">
            <Select value={benchmark} onValueChange={setBenchmark}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sp500">S&P 500</SelectItem>
                <SelectItem value="nasdaq">NASDAQ</SelectItem>
                <SelectItem value="russell">Russell 2000</SelectItem>
                <SelectItem value="dow">Dow Jones</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="ytd">YTD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{portfolioReturn.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Your Portfolio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{benchmarkReturn.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{getBenchmarkName(benchmark)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div
                className={`text-2xl font-bold flex items-center gap-1 ${outperformance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {outperformance >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {outperformance >= 0 ? "+" : ""}
                {outperformance.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Outperformance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">1.85</div>
              <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cumulative Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Performance</CardTitle>
              <CardDescription>Portfolio vs benchmark over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, ""]} />
                  <Area
                    type="monotone"
                    dataKey="portfolio"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Your Portfolio"
                  />
                  <Area
                    type="monotone"
                    dataKey="sp500"
                    stackId="2"
                    stroke="#6b7280"
                    fill="#6b7280"
                    fillOpacity={0.3}
                    name="S&P 500"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Returns */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Returns Comparison</CardTitle>
              <CardDescription>Month-by-month performance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, ""]} />
                  <Bar dataKey="portfolio" fill="#3b82f6" name="Your Portfolio" />
                  <Bar dataKey="sp500" fill="#6b7280" name="S&P 500" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Risk Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Risk-Adjusted Performance</CardTitle>
            <CardDescription>How your portfolio compares on risk metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {riskMetrics.map((metric) => (
                  <div key={metric.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.metric}</span>
                      <div className="flex items-center gap-2">
                        {metric.status === "outperforming" && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Award className="mr-1 h-3 w-3" />
                            Better
                          </Badge>
                        )}
                        {metric.status === "underperforming" && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Worse
                          </Badge>
                        )}
                        {metric.status === "neutral" && (
                          <Badge variant="secondary">
                            <Target className="mr-1 h-3 w-3" />
                            Similar
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Your Portfolio: <strong>{metric.portfolio}</strong>
                      </span>
                      <span>
                        {getBenchmarkName(benchmark)}: <strong>{metric.sp500}</strong>
                      </span>
                    </div>
                    <Progress
                      value={(Math.abs(metric.portfolio) / (Math.abs(metric.portfolio) + Math.abs(metric.sp500))) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Performance Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Return:</span>
                      <span className="font-medium text-blue-600">+{portfolioReturn.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Benchmark Return:</span>
                      <span className="font-medium">{benchmarkReturn.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alpha:</span>
                      <span className={`font-medium ${outperformance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {outperformance >= 0 ? "+" : ""}
                        {outperformance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-medium">68.4%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Lower drawdown than benchmark</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Higher risk-adjusted returns</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Slightly higher volatility</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Moderate correlation to market</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation vs S&P 500</CardTitle>
            <CardDescription>How your portfolio allocation compares to the benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { sector: "Technology", portfolio: 35, sp500: 28 },
                { sector: "Healthcare", portfolio: 15, sp500: 13 },
                { sector: "Financial", portfolio: 12, sp500: 16 },
                { sector: "Consumer Disc.", portfolio: 18, sp500: 12 },
                { sector: "Communication", portfolio: 8, sp500: 9 },
                { sector: "Industrials", portfolio: 7, sp500: 8 },
                { sector: "Energy", portfolio: 3, sp500: 5 },
                { sector: "Other", portfolio: 2, sp500: 9 },
              ].map((item) => (
                <div key={item.sector} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.sector}</span>
                    <span>
                      Portfolio: {item.portfolio}% | S&P: {item.sp500}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={item.portfolio} className="h-2" />
                    <Progress value={item.sp500} className="h-2 opacity-50" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
