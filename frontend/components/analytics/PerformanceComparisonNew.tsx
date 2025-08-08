"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { 
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, ReferenceLine, BarChart, Bar, LineChart, Line, CartesianGrid
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface PerformanceData {
  date: string
  portfolio: number
  benchmark: number
  portfolioReturn: number
  benchmarkReturn: number
}

interface PeriodData {
  period: string
  return: number
  pnl: number
  trades: number
  winRate: number
  avgTrade: number
  maxDrawdown: number
}

interface PerformanceComparisonProps {
  portfolioData: Array<{ date: string; value: number }>
  initialCapital?: number
  closedTrades?: any[]
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload[0]) return null

  return (
    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">
        {new Date(label).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm">
            {entry.name}: {entry.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export function PerformanceComparisonNew({ 
  portfolioData = [], 
  initialCapital = 10000,
  closedTrades = []
}: PerformanceComparisonProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("ALL")
  const [selectedBenchmark, setSelectedBenchmark] = useState<"SPY" | "QQQ" | "DIA">("SPY")
  const [viewMode, setViewMode] = useState<"percent" | "dollar">("percent")

  // Generate benchmark data (simulated for now - in production, fetch real data)
  const benchmarkData = useMemo(() => {
    if (portfolioData.length === 0) return []
    
    // Simulate benchmark performance (SPY average ~10% annual return)
    const annualReturn = selectedBenchmark === "SPY" ? 0.10 : 
                        selectedBenchmark === "QQQ" ? 0.15 : 0.08
    const dailyReturn = annualReturn / 252
    
    let benchmarkValue = initialCapital
    return portfolioData.map((point, index) => {
      // Add some random variation
      const randomVariation = (Math.random() - 0.5) * 0.02
      benchmarkValue = benchmarkValue * (1 + dailyReturn + randomVariation)
      
      return {
        date: point.date,
        portfolio: point.value,
        benchmark: benchmarkValue,
        portfolioReturn: ((point.value - initialCapital) / initialCapital) * 100,
        benchmarkReturn: ((benchmarkValue - initialCapital) / initialCapital) * 100,
      }
    })
  }, [portfolioData, initialCapital, selectedBenchmark])

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (benchmarkData.length === 0) return []
    
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (selectedPeriod) {
      case "1M":
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case "3M":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case "6M":
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case "1Y":
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      case "ALL":
        return benchmarkData
    }
    
    return benchmarkData.filter(d => new Date(d.date) >= cutoffDate)
  }, [benchmarkData, selectedPeriod])

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        portfolioReturn: 0,
        benchmarkReturn: 0,
        alpha: 0,
        outperforming: false
      }
    }
    
    const latest = filteredData[filteredData.length - 1]
    const first = filteredData[0]
    
    const portfolioReturn = ((latest.portfolio - first.portfolio) / first.portfolio) * 100
    const benchmarkReturn = ((latest.benchmark - first.benchmark) / first.benchmark) * 100
    const alpha = portfolioReturn - benchmarkReturn
    
    return {
      portfolioReturn,
      benchmarkReturn,
      alpha,
      outperforming: alpha > 0
    }
  }, [filteredData])

  // Calculate period breakdown (monthly/quarterly/yearly)
  const periodBreakdown = useMemo(() => {
    const periods: PeriodData[] = []
    const now = new Date()
    
    // Generate last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      // Filter trades for this period
      const periodTrades = closedTrades.filter(t => {
        const tradeDate = new Date(t.exit_date || t.entry_date)
        return tradeDate >= periodStart && tradeDate <= periodEnd
      })
      
      const periodPnL = periodTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      const wins = periodTrades.filter(t => (t.pnl || 0) > 0).length
      const winRate = periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0
      const avgTrade = periodTrades.length > 0 ? periodPnL / periodTrades.length : 0
      
      periods.push({
        period: periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        return: initialCapital > 0 ? (periodPnL / initialCapital) * 100 : 0,
        pnl: periodPnL,
        trades: periodTrades.length,
        winRate,
        avgTrade,
        maxDrawdown: 0 // Would need to calculate from equity curve
      })
    }
    
    return periods
  }, [closedTrades, initialCapital])

  // Get chart data based on view mode
  const chartData = useMemo(() => {
    if (viewMode === "percent") {
      return filteredData.map(d => ({
        ...d,
        portfolio: d.portfolioReturn,
        benchmark: d.benchmarkReturn
      }))
    }
    return filteredData
  }, [filteredData, viewMode])

  return (
    <div className="space-y-6">
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
              {/* Period Selector */}
              <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="3M">3M</SelectItem>
                  <SelectItem value="6M">6M</SelectItem>
                  <SelectItem value="1Y">1Y</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Benchmark Selector */}
              <Select value={selectedBenchmark} onValueChange={(v: any) => setSelectedBenchmark(v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPY">SPY</SelectItem>
                  <SelectItem value="QQQ">QQQ</SelectItem>
                  <SelectItem value="DIA">DIA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  performanceMetrics.portfolioReturn >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {performanceMetrics.portfolioReturn >= 0 ? "+" : ""}
                  {performanceMetrics.portfolioReturn.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{selectedBenchmark} Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  performanceMetrics.benchmarkReturn >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {performanceMetrics.benchmarkReturn >= 0 ? "+" : ""}
                  {performanceMetrics.benchmarkReturn.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Alpha (Excess Return)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  performanceMetrics.alpha >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {performanceMetrics.alpha >= 0 ? "+" : ""}
                  {performanceMetrics.alpha.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={performanceMetrics.outperforming ? "default" : "destructive"}
                  className="text-lg px-3 py-1"
                >
                  {performanceMetrics.outperforming ? "Outperforming" : "Underperforming"}
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Performance Chart</CardTitle>
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(v) => v && setViewMode(v as "percent" | "dollar")}
                  className="bg-muted/50 rounded-lg p-1"
                >
                  <ToggleGroupItem 
                    value="percent" 
                    aria-label="Percent view"
                    className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  >
                    <Percent className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="dollar" 
                    aria-label="Dollar view"
                    className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  >
                    <DollarSign className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <XAxis 
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#888' }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                    interval="preserveStartEnd"
                  />
                  
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#888' }}
                    tickFormatter={(value) => viewMode === "percent" ? `${value}%` : `$${(value/1000).toFixed(0)}k`}
                  />
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" strokeOpacity={0.3} />
                  
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    name="Your Portfolio"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    name={selectedBenchmark}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Period Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Return</p>
                    <p className={cn(
                      "text-lg font-bold",
                      periodBreakdown.reduce((sum, p) => sum + p.return, 0) / periodBreakdown.length >= 0
                        ? "text-green-600" : "text-red-600"
                    )}>
                      {(periodBreakdown.reduce((sum, p) => sum + p.return, 0) / periodBreakdown.length).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Best Period</p>
                    <p className="text-lg font-bold text-green-600">
                      {Math.max(...periodBreakdown.map(p => p.return)).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Worst Period</p>
                    <p className="text-lg font-bold text-red-600">
                      {Math.min(...periodBreakdown.map(p => p.return)).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-lg font-bold">
                      {(periodBreakdown.reduce((sum, p) => sum + p.winRate, 0) / periodBreakdown.filter(p => p.trades > 0).length || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {/* Period Chart */}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={periodBreakdown}>
                    <XAxis 
                      dataKey="period" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#888' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#888' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip />
                    <Bar 
                      dataKey="return" 
                      name="Return (%)"
                      fill={(entry: any) => entry.return >= 0 ? "#10b981" : "#ef4444"}
                    />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Period Table */}
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
                      </tr>
                    </thead>
                    <tbody>
                      {periodBreakdown.slice(-12).reverse().map((period, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2">{period.period}</td>
                          <td className={cn(
                            "text-right p-2 font-medium",
                            period.return >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {period.return >= 0 ? "+" : ""}{period.return.toFixed(2)}%
                          </td>
                          <td className={cn(
                            "text-right p-2",
                            period.pnl >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {period.pnl >= 0 ? "+" : ""}${Math.abs(period.pnl).toFixed(2)}
                          </td>
                          <td className="text-right p-2">{period.trades}</td>
                          <td className="text-right p-2">{period.winRate.toFixed(1)}%</td>
                          <td className={cn(
                            "text-right p-2",
                            period.avgTrade >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {period.avgTrade >= 0 ? "+" : ""}${Math.abs(period.avgTrade).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}