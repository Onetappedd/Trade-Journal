"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useAuth } from "@/providers/auth-provider"
import {
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Settings,
  Bell,
  Search,
  Download,
  LineChart,
  RefreshCw,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Calculator,
  Layers,
  BarChart2,
  Gauge,
  Sigma,
  Brain,
  Crosshair,
  Globe,
  Building,
  Flame,
  Award,
  Maximize2,
  Filter,
  X,
  ZoomIn,
  MousePointer2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"

// Types matching your existing backend
interface TradeAnalytics {
  totalTrades: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  monthlyReturns: Array<{
    month: string;
    pnl: number;
    trades: number;
  }>;
  performanceBySymbol: Array<{
    symbol: string;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
}

export default function AnalyticsPage() {
  const { session } = useAuth()
  const [currentChart, setCurrentChart] = useState(0)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null)

  const [filters, setFilters] = useState({
    timeframe: "3M",
    strategy: "all",
    sector: "all",
    benchmark: "SPY",
  })

  const [chartMode, setChartMode] = useState("overlay") // overlay vs benchmark
  const [zoomEnabled, setZoomEnabled] = useState(false)

  const charts = [
    { title: "Performance Analysis", component: "performance" },
    { title: "Risk-Return Scatter", component: "risk-return" },
    { title: "Drawdown Analysis", component: "drawdown" },
    { title: "Trade Performance", component: "trade-performance" },
    { title: "Sector Performance", component: "sector" },
    { title: "Top Performers", component: "performers" },
  ]

  const timeframeOptions = [
    { value: "1W", label: "1 Week" },
    { value: "1M", label: "1 Month" },
    { value: "3M", label: "3 Months" },
    { value: "YTD", label: "Year to Date" },
    { value: "1Y", label: "1 Year" },
    { value: "ALL", label: "All Time" },
    { value: "CUSTOM", label: "Custom Range" },
  ]

  const strategyOptions = [
    { value: "all", label: "All Strategies" },
    { value: "swing", label: "Swing Trading" },
    { value: "day", label: "Day Trading" },
    { value: "options", label: "Options" },
    { value: "momentum", label: "Momentum" },
    { value: "mean-reversion", label: "Mean Reversion" },
  ]

  const sectorOptions = [
    { value: "all", label: "All Sectors" },
    { value: "tech", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "energy", label: "Energy" },
    { value: "consumer", label: "Consumer" },
  ]

  const benchmarkOptions = [
    { value: "SPY", label: "S&P 500 (SPY)" },
    { value: "QQQ", label: "NASDAQ (QQQ)" },
    { value: "IWM", label: "Russell 2000 (IWM)" },
    { value: "VTI", label: "Total Market (VTI)" },
  ]

  // Fetch analytics data from your existing API
  const fetchAnalytics = async () => {
    if (!session) return
    
    setIsLoading(true)
    setHasError(false)
    
    try {
      const response = await fetch('/api/portfolio/analytics', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setAnalytics(data)
      
      // Check if we have enough data
      if (data.totalTrades < 10) {
        setIsEmpty(true)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchAnalytics()
    }
  }, [session])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleRefreshData = async () => {
    await fetchAnalytics()
  }

  const handleExportAnalytics = () => {
    if (!analytics) return
    
    const csvData = [
      ['Metric', 'Value'],
      ['Total Trades', analytics.totalTrades],
      ['Total P&L', analytics.totalPnL],
      ['Realized P&L', analytics.realizedPnL],
      ['Unrealized P&L', analytics.unrealizedPnL],
      ['Win Rate', `${analytics.winRate.toFixed(2)}%`],
      ['Average Win', analytics.avgWin],
      ['Average Loss', analytics.avgLoss],
      ['Profit Factor', analytics.profitFactor.toFixed(2)],
      ['Sharpe Ratio', analytics.sharpeRatio.toFixed(2)],
      ['Max Drawdown', analytics.maxDrawdown],
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics-export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleRetry = () => {
    setHasError(false)
    handleRefreshData()
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={BarChart3}
            title="Not enough data yet"
            description="Import trades to see comprehensive performance analytics and insights"
            actionLabel="Import Trades"
            actionHref="/import"
          />
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2 bg-slate-800" />
            <Skeleton className="h-4 w-96 bg-slate-800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2 bg-slate-800" />
                  <Skeleton className="h-8 w-16 mb-2 bg-slate-800" />
                  <Skeleton className="h-3 w-24 bg-slate-800" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-slate-800" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-96 w-full bg-slate-800" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-slate-800" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-slate-800" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {hasError && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Failed to load analytics data</p>
                <p className="text-red-300/70 text-sm">There was an error loading your analytics. Please try again.</p>
              </div>
            </div>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="border-red-700 text-red-400 hover:bg-red-950 bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Portfolio Analytics</h1>
              <p className="text-slate-400 text-sm sm:text-base">Comprehensive performance analysis and risk metrics</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => setFilterDrawerOpen(true)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                onClick={handleExportAnalytics}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleRefreshData} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Return</p>
                    <p className={`text-2xl font-bold ${(analytics?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {analytics?.totalPnL ? (analytics.totalPnL >= 0 ? '+' : '') + analytics.totalPnL.toFixed(2) : 'N/A'}
                    </p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      vs {filters.benchmark}: +8.2%
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-950/50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Sharpe Ratio</p>
                    <p className="text-2xl font-bold text-white">{analytics?.sharpeRatio?.toFixed(2) || 'N/A'}</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Award className="h-3 w-3 mr-1" />
                      {(analytics?.sharpeRatio || 0) > 2 ? 'Excellent' : (analytics?.sharpeRatio || 0) > 1 ? 'Good' : 'Fair'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-950/50 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-400">
                      {analytics?.maxDrawdown ? (analytics.maxDrawdown >= 0 ? '+' : '') + analytics.maxDrawdown.toFixed(2) : 'N/A'}
                    </p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      Recovery: 12 days
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-red-950/50 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Win Rate</p>
                    <p className="text-2xl font-bold text-purple-400">{analytics?.winRate?.toFixed(1) || 'N/A'}%</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Brain className="h-3 w-3 mr-1" />
                      {analytics?.totalTrades || 0} trades
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-950/50 flex items-center justify-center">
                    <Sigma className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Profit Factor</p>
                    <p className="text-2xl font-bold text-amber-400">{analytics?.profitFactor?.toFixed(2) || 'N/A'}</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {analytics?.profitFactor > 2 ? 'Excellent' : analytics?.profitFactor > 1 ? 'Good' : 'Poor'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-950/50 flex items-center justify-center">
                    <Gauge className="h-6 w-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Column - Performance Charts */}
          <div className="xl:col-span-3 space-y-6 sm:space-y-8">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="text-lg sm:text-xl text-white">Performance Analysis</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={chartMode === "overlay" ? "default" : "ghost"}
                        onClick={() => setChartMode("overlay")}
                        className="h-7 px-2 text-xs"
                      >
                        Overlay
                      </Button>
                      <Button
                        size="sm"
                        variant={chartMode === "benchmark" ? "default" : "ghost"}
                        onClick={() => setChartMode("benchmark")}
                        className="h-7 px-2 text-xs"
                      >
                        vs Benchmark
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoomEnabled(!zoomEnabled)}
                      className={`text-slate-400 hover:text-white h-8 w-8 p-0 ${zoomEnabled ? "bg-emerald-950/50 text-emerald-400" : ""}`}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-96 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center mb-6 relative group">
                  <div className="text-center space-y-3">
                    <LineChart className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-400 mx-auto" />
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-white">Interactive Performance Chart</p>
                      <p className="text-xs sm:text-sm text-slate-400">
                        {chartMode === "overlay"
                          ? "Portfolio + Benchmark Overlay"
                          : "Portfolio vs Benchmark Comparison"}
                      </p>
                      {zoomEnabled && (
                        <p className="text-xs text-emerald-400 mt-2 flex items-center justify-center">
                          <MousePointer2 className="h-3 w-3 mr-1" />
                          Zoom mode enabled - drag to select range
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700/50 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs space-y-1">
                      <div className="text-slate-400">Dec 15, 2024</div>
                      <div className="text-emerald-400">Portfolio: {analytics?.totalPnL?.toFixed(2) || 'N/A'}</div>
                      <div className="text-blue-400">{filters.benchmark}: +12.3%</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-emerald-400">
                      {analytics?.totalPnL ? (analytics.totalPnL >= 0 ? '+' : '') + analytics.totalPnL.toFixed(0) : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-400">Total P&L</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-white">{analytics?.winRate?.toFixed(1) || 'N/A'}%</div>
                    <div className="text-xs text-slate-400">Win Rate</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-white">{analytics?.totalTrades || 'N/A'}</div>
                    <div className="text-xs text-slate-400">Total Trades</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-white">{analytics?.profitFactor?.toFixed(2) || 'N/A'}</div>
                    <div className="text-xs text-slate-400">Profit Factor</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Analysis */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl text-white flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-400" />
                  Trade Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Win/Loss Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Trades</span>
                        <span className="text-white font-medium">{analytics?.totalTrades || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Win Rate</span>
                        <span className="text-emerald-400 font-medium">{analytics?.winRate?.toFixed(1) || 'N/A'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Win</span>
                        <span className="text-emerald-400 font-medium">
                          {analytics?.avgWin ? (analytics.avgWin >= 0 ? '+' : '') + analytics.avgWin.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Loss</span>
                        <span className="text-red-400 font-medium">
                          {analytics?.avgLoss ? (analytics.avgLoss >= 0 ? '+' : '') + analytics.avgLoss.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Risk Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Profit Factor</span>
                        <span className="text-white font-medium">{analytics?.profitFactor?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sharpe Ratio</span>
                        <span className="text-white font-medium">{analytics?.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Drawdown</span>
                        <span className="text-red-400 font-medium">
                          {analytics?.maxDrawdown ? (analytics.maxDrawdown >= 0 ? '+' : '') + analytics.maxDrawdown.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Realized P&L</span>
                        <span className="text-emerald-400 font-medium">
                          {analytics?.realizedPnL ? (analytics.realizedPnL >= 0 ? '+' : '') + analytics.realizedPnL.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Performance by Symbol</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {analytics?.performanceBySymbol?.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                          <div>
                            <div className="text-white font-medium text-sm">{item.symbol}</div>
                            <div className="text-slate-400 text-xs">{item.trades} trades</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium text-sm ${item.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {item.pnl >= 0 ? '+' : ''}{item.pnl.toFixed(2)}
                            </div>
                            <div className="text-slate-400 text-xs">{item.winRate.toFixed(1)}%</div>
                          </div>
                        </div>
                      )) || <div className="text-slate-400 text-sm">No data available</div>}
                    </div>
                  </div>
                </div>

                <div className="h-32 sm:h-48 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-purple-400 mx-auto" />
                    <p className="text-xs sm:text-sm text-slate-400">P&L Distribution & Trade Heatmap</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Advanced Metrics */}
          <div className="space-y-6 sm:space-y-8">
            {/* Risk Metrics */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-amber-400" />
                  Advanced Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Sharpe Ratio</span>
                      <span className="text-white font-medium">{analytics?.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-emerald-400 h-2 rounded-full" 
                        style={{ width: `${Math.min((analytics?.sharpeRatio || 0) * 20, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Max Drawdown</span>
                      <span className="text-red-400 font-medium">
                        {analytics?.maxDrawdown ? (analytics.maxDrawdown >= 0 ? '+' : '') + analytics.maxDrawdown.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-red-400 h-2 rounded-full" 
                        style={{ width: `${Math.min(Math.abs(analytics?.maxDrawdown || 0) * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                    <div>
                      <div className="text-slate-400 text-sm">Total Trades</div>
                      <div className="text-white font-medium">{analytics?.totalTrades || 0}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Win Rate</div>
                      <div className="text-emerald-400 font-medium">{analytics?.winRate?.toFixed(1) || 'N/A'}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Avg Win</div>
                      <div className="text-emerald-400 font-medium">
                        {analytics?.avgWin ? (analytics.avgWin >= 0 ? '+' : '') + analytics.avgWin.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Avg Loss</div>
                      <div className="text-red-400 font-medium">
                        {analytics?.avgLoss ? (analytics.avgLoss >= 0 ? '+' : '') + analytics.avgLoss.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Returns */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-400" />
                  Monthly Returns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analytics?.monthlyReturns?.map((month, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium text-sm">{month.month}</div>
                        <div className="text-slate-400 text-xs">{month.trades} trades</div>
                      </div>
                      <div className={`font-medium ${month.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {month.pnl >= 0 ? '+' : ''}{month.pnl.toFixed(2)}
                      </div>
                    </div>
                  )) || <div className="text-slate-400 text-sm">No monthly data available</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Filter Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setFilterDrawerOpen(false)} />
          <div className="ml-auto h-full w-80 bg-slate-900 border-l border-slate-800 shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Analytics Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterDrawerOpen(false)}
                className="text-slate-400 hover:text-white h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Timeframe Filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">Timeframe</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeframeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.timeframe === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("timeframe", option.value)}
                      className="justify-start text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Strategy Filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">Strategy</label>
                <select
                  value={filters.strategy}
                  onChange={(e) => handleFilterChange("strategy", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm"
                >
                  {strategyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sector Filter */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">Sector</label>
                <select
                  value={filters.sector}
                  onChange={(e) => handleFilterChange("sector", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm"
                >
                  {sectorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Benchmark Selector */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">Benchmark</label>
                <select
                  value={filters.benchmark}
                  onChange={(e) => handleFilterChange("benchmark", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm"
                >
                  {benchmarkOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply Filters */}
              <div className="pt-4 border-t border-slate-800">
                <Button
                  onClick={() => {
                    setFilterDrawerOpen(false)
                    // Apply filters logic here
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}