"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart, Cell 
} from "recharts"
import { 
  TrendingUp, TrendingDown, Calendar, BarChart3, 
  Target, Activity, DollarSign, RefreshCw 
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import {
  calculatePeriodPerformance,
  compareToBenchmark,
  compareStrategies,
  calculateUserPerformance,
  type PeriodPerformance,
  type BenchmarkComparison,
  type StrategyPerformance
} from "@/lib/performance-comparison"

export function PerformanceComparison() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [selectedBenchmark, setSelectedBenchmark] = useState<'SPY' | 'QQQ'>('SPY')
  
  // State for different comparisons
  const [periodComparisons, setPeriodComparisons] = useState<PeriodPerformance[]>([])
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkComparison | null>(null)
  const [strategyData, setStrategyData] = useState<StrategyPerformance[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? "+" : ""
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? "+" : ""
    return `${prefix}${value.toFixed(2)}%`
  }

  // Fetch all comparison data
  const fetchComparisonData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      // Set date range based on selected period
      switch (selectedPeriod) {
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 12) // Last 12 months
          break
        case 'quarterly':
          startDate.setMonth(startDate.getMonth() - 12) // Last 4 quarters
          break
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 3) // Last 3 years
          break
      }
      
      // Fetch period comparisons
      const periods: PeriodPerformance[] = []
      const currentDate = new Date()
      
      if (selectedPeriod === 'monthly') {
        for (let i = 0; i < 12; i++) {
          const date = new Date(currentDate)
          date.setMonth(date.getMonth() - i)
          const perf = await calculatePeriodPerformance(user.id, 'monthly', date)
          periods.push(perf)
        }
      } else if (selectedPeriod === 'quarterly') {
        for (let i = 0; i < 4; i++) {
          const date = new Date(currentDate)
          date.setMonth(date.getMonth() - (i * 3))
          const perf = await calculatePeriodPerformance(user.id, 'quarterly', date)
          periods.push(perf)
        }
      } else {
        for (let i = 0; i < 3; i++) {
          const date = new Date(currentDate)
          date.setFullYear(date.getFullYear() - i)
          const perf = await calculatePeriodPerformance(user.id, 'yearly', date)
          periods.push(perf)
        }
      }
      
      setPeriodComparisons(periods.reverse())
      
      // Fetch benchmark comparison
      const benchmark = await compareToBenchmark(user.id, selectedBenchmark, startDate, endDate)
      setBenchmarkData(benchmark)
      
      // Fetch strategy comparison
      const strategies = await compareStrategies(user.id, startDate, endDate)
      setStrategyData(strategies)
      
      // Prepare chart data
      const userPerf = await calculateUserPerformance(user.id, startDate, endDate)
      const chartPoints = userPerf.map(point => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolio: point.value,
        change: point.percentChange
      }))
      setChartData(chartPoints)
      
    } catch (error) {
      console.error("Error fetching comparison data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComparisonData()
  }, [user, selectedPeriod, selectedBenchmark])

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please log in to view performance comparisons</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>
                Compare your trading performance across different time periods and benchmarks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedBenchmark} onValueChange={(v: any) => setSelectedBenchmark(v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPY">SPY</SelectItem>
                  <SelectItem value="QQQ">QQQ</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchComparisonData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Benchmark Comparison */}
      {benchmarkData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Benchmark Comparison vs {selectedBenchmark}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Your Performance</p>
                    <p className={`text-2xl font-bold ${
                      benchmarkData.userPerformance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(benchmarkData.userPerformance)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{selectedBenchmark} Performance</p>
                    <p className={`text-2xl font-bold ${
                      benchmarkData.benchmarkPerformance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(benchmarkData.benchmarkPerformance)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Alpha (Excess Return)</p>
                    <p className={`text-2xl font-bold ${
                      benchmarkData.alpha >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(benchmarkData.alpha)}
                    </p>
                    <Badge variant={benchmarkData.alpha >= 0 ? "default" : "destructive"}>
                      {benchmarkData.alpha >= 0 ? "Outperforming" : "Underperforming"}
                    </Badge>
                  </div>
                </div>
                
                {/* Visual comparison bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>You</span>
                    <span>{formatPercent(benchmarkData.userPerformance)}</span>
                  </div>
                  <Progress 
                    value={Math.abs(benchmarkData.userPerformance)} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>{selectedBenchmark}</span>
                    <span>{formatPercent(benchmarkData.benchmarkPerformance)}</span>
                  </div>
                  <Progress 
                    value={Math.abs(benchmarkData.benchmarkPerformance)} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Period Comparison Tabs */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">Performance Chart</TabsTrigger>
          <TabsTrigger value="periods">Period Analysis</TabsTrigger>
          <TabsTrigger value="strategies">Strategy Comparison</TabsTrigger>
        </TabsList>

        {/* Performance Chart */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value.toFixed(2)}`, 'Portfolio Value']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorPortfolio)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Period Analysis */}
        <TabsContent value="periods">
          <Card>
            <CardHeader>
              <CardTitle>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Average Return</p>
                      <p className="text-xl font-bold">
                        {formatPercent(
                          periodComparisons.reduce((sum, p) => sum + p.percentReturn, 0) / 
                          (periodComparisons.length || 1)
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Best Period</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatPercent(
                          Math.max(...periodComparisons.map(p => p.percentReturn), 0)
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Worst Period</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatPercent(
                          Math.min(...periodComparisons.map(p => p.percentReturn), 0)
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-xl font-bold">
                        {formatPercent(
                          (periodComparisons.filter(p => p.percentReturn > 0).length / 
                          (periodComparisons.length || 1)) * 100
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Period Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={periodComparisons.map((p, i) => ({
                      period: `Period ${i + 1}`,
                      return: p.percentReturn,
                      trades: p.totalTrades
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar 
                      dataKey="return" 
                      name="Return (%)"
                      >
                      {periodComparisons.map((p, idx) => (
                      <Cell key={idx} fill={p.percentReturn >= 0 ? "#10b981" : "#ef4444"} />
                      ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Detailed Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Period</th>
                          <th className="text-right p-2">Return</th>
                          <th className="text-right p-2">P&L</th>
                          <th className="text-right p-2">Trades</th>
                          <th className="text-right p-2">Win Rate</th>
                          <th className="text-right p-2">Avg Trade</th>
                          <th className="text-right p-2">Max DD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodComparisons.map((period, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">
                              {new Date(period.startDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </td>
                            <td className={`text-right p-2 font-medium ${
                              period.percentReturn >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercent(period.percentReturn)}
                            </td>
                            <td className={`text-right p-2 ${
                              period.absoluteReturn >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(period.absoluteReturn)}
                            </td>
                            <td className="text-right p-2">{period.totalTrades}</td>
                            <td className="text-right p-2">{formatPercent(period.winRate)}</td>
                            <td className="text-right p-2">{formatCurrency(period.averageTrade)}</td>
                            <td className="text-right p-2 text-red-600">
                              {formatCurrency(-period.maxDrawdown)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Comparison */}
        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance Comparison</CardTitle>
              <CardDescription>
                Compare performance across different trading strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : strategyData.length > 0 ? (
                <div className="space-y-4">
                  {/* Strategy Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {strategyData.map((strategy) => (
                      <Card key={strategy.strategy}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base capitalize">
                            {strategy.strategy}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total P&L</span>
                            <span className={`font-bold ${
                              strategy.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(strategy.totalPnL)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Win Rate</span>
                            <span className="font-medium">{formatPercent(strategy.winRate)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Trades</span>
                            <span className="font-medium">{strategy.tradeCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Avg Trade</span>
                            <span className="font-medium">{formatCurrency(strategy.averagePnL)}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">
                                Best: {formatCurrency(strategy.bestTrade)}
                              </span>
                              <span className="text-red-600">
                                Worst: {formatCurrency(strategy.worstTrade)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Strategy Comparison Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={strategyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="strategy" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="totalPnL" fill="#10b981" name="Total P&L" />
                      <Bar dataKey="averagePnL" fill="#3b82f6" name="Avg P&L" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No strategy data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}