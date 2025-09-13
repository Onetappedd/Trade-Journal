/*
WIRING CHECKLIST - Analytics Page (/analytics)

REQUIRED API ENDPOINTS:
- GET /api/analytics/performance?timeframe=3M&strategy=all&sector=all&benchmark=SPY
  → Returns: PerformanceAnalytics (summary, equityCurve, benchmarkCurve, monthlyReturns, riskMetrics)
- GET /api/analytics/attribution?groupBy=strategy|sector|period&timeframe=3M
  → Returns: AttributionAnalysis (byStrategy, bySector, byPeriod, byInstrument)
- GET /api/analytics/drawdown?timeframe=3M
  → Returns: DrawdownAnalysis (currentDrawdown, maxDrawdown, drawdownPeriods, recoveryTimes)
- GET /api/analytics/correlation?symbols=AAPL,MSFT&timeframe=3M
  → Returns: CorrelationMatrix (symbols, matrix, heatmapData)

REQUIRED FEATURES:
- Interactive charts with zoom/brush functionality (Recharts with brush component)
- Benchmark overlay toggle (SPY, QQQ, custom benchmark)
- Filter drawer with timeframe, strategy, sector selectors
- Real-time chart updates via WebSocket /ws/analytics/:userId
- CSV export functionality for chart data
- Error handling with retry mechanism
- Loading skeletons for all chart sections
- Empty state when insufficient data (< 10 trades)

STATE MANAGEMENT:
- filters: { timeframe, strategy, sector, benchmark }
- chartMode: 'overlay' | 'benchmark'
- zoomEnabled: boolean for chart interactions
- selectedDataPoints: for hover tooltips and details

AUTH REQUIREMENTS:
- Redirect to /auth/login if not authenticated
- Require minimum trade data for meaningful analytics
*/

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { showNotification } from "@/lib/notifications"
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

export default function AnalyticsPage() {
  const [currentChart, setCurrentChart] = useState(0)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleRefreshData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      showNotification.success("Analytics data refreshed successfully")
    } catch (error) {
      setHasError(true)
      showNotification.error("Failed to refresh analytics data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportAnalytics = () => {
    showNotification.info("Exporting analytics data with current filters...")
    // Export logic here
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
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">RiskR</span>
              </div>

              <nav className="hidden lg:flex items-center space-x-8">
                <a href="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Dashboard
                </a>
                <a href="/analytics" className="text-emerald-400 font-medium border-b-2 border-emerald-400 pb-4">
                  Analytics
                </a>
                <a href="/import" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Import Trades
                </a>
                <a href="/history" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Trade History
                </a>
                <a href="/settings" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Settings
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search metrics, symbols..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                    <p className="text-2xl font-bold text-emerald-400">+24.7%</p>
                    <p className="text-sm text-emerald-400 flex items-center mt-1">
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
                    <p className="text-2xl font-bold text-white">2.34</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Award className="h-3 w-3 mr-1" />
                      Excellent
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
                    <p className="text-2xl font-bold text-red-400">-8.2%</p>
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
                    <p className="text-slate-400 text-sm font-medium">Alpha</p>
                    <p className="text-2xl font-bold text-purple-400">+16.5%</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Brain className="h-3 w-3 mr-1" />
                      vs Benchmark
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
                    <p className="text-slate-400 text-sm font-medium">Beta</p>
                    <p className="text-2xl font-bold text-amber-400">0.87</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      Lower volatility
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
                      <div className="text-emerald-400">Portfolio: +24.7%</div>
                      <div className="text-blue-400">{filters.benchmark}: +12.3%</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-emerald-400">+$587K</div>
                    <div className="text-xs text-slate-400">Total P&L</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-white">18.4%</div>
                    <div className="text-xs text-slate-400">Annualized Return</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-white">12.3%</div>
                    <div className="text-xs text-slate-400">Volatility</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-lg font-semibold text-white">1.49</div>
                    <div className="text-xs text-slate-400">Information Ratio</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:hidden">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">{charts[currentChart].title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentChart(currentChart > 0 ? currentChart - 1 : charts.length - 1)}
                        className="text-slate-400 hover:text-white h-8 w-8 p-0"
                      >
                        ←
                      </Button>
                      <span className="text-sm text-slate-400">
                        {currentChart + 1}/{charts.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentChart(currentChart < charts.length - 1 ? currentChart + 1 : 0)}
                        className="text-slate-400 hover:text-white h-8 w-8 p-0"
                      >
                        →
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="h-12 w-12 text-emerald-400 mx-auto flex items-center justify-center">
                        {currentChart === 0 && <LineChart className="h-12 w-12" />}
                        {currentChart === 1 && <Crosshair className="h-12 w-12" />}
                        {currentChart === 2 && <TrendingDown className="h-12 w-12" />}
                        {currentChart === 3 && <BarChart3 className="h-12 w-12" />}
                        {currentChart === 4 && <Building className="h-12 w-12" />}
                        {currentChart === 5 && <Flame className="h-12 w-12" />}
                      </div>
                      <p className="text-sm text-slate-400">{charts[currentChart].title}</p>
                    </div>
                  </div>

                  {/* Chart indicators */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {charts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentChart(index)}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === currentChart ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Risk-Return Analysis - hidden on mobile */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-8">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white flex items-center">
                    <Target className="h-5 w-5 mr-2 text-emerald-400" />
                    Risk-Return Scatter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center mb-4">
                    <div className="text-center space-y-2">
                      <Crosshair className="h-12 w-12 text-emerald-400 mx-auto" />
                      <p className="text-sm text-slate-400">Risk vs Return Analysis</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-white font-medium">Efficient Frontier</div>
                      <div className="text-slate-400">Optimal allocation</div>
                    </div>
                    <div>
                      <div className="text-emerald-400 font-medium">Your Portfolio</div>
                      <div className="text-slate-400">Above benchmark</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
                    Drawdown Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center mb-4">
                    <div className="text-center space-y-2">
                      <TrendingDown className="h-12 w-12 text-red-400 mx-auto" />
                      <p className="text-sm text-slate-400">Underwater Curve</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-red-400 font-medium">Max DD: -8.2%</div>
                      <div className="text-slate-400">Mar 15 - Apr 2</div>
                    </div>
                    <div>
                      <div className="text-emerald-400 font-medium">Recovery: 12d</div>
                      <div className="text-slate-400">Avg: 8.5 days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                        <span className="text-white font-medium">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Winning Trades</span>
                        <span className="text-emerald-400 font-medium">838 (67.2%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Losing Trades</span>
                        <span className="text-red-400 font-medium">409 (32.8%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Win</span>
                        <span className="text-emerald-400 font-medium">+$1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Loss</span>
                        <span className="text-red-400 font-medium">-$523</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Risk Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Profit Factor</span>
                        <span className="text-white font-medium">2.38</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk/Reward</span>
                        <span className="text-white font-medium">1:2.4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Risk per Trade</span>
                        <span className="text-white font-medium">2.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kelly Criterion</span>
                        <span className="text-amber-400 font-medium">18.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expectancy</span>
                        <span className="text-emerald-400 font-medium">+$634</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Time Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Hold Time</span>
                        <span className="text-white font-medium">3.2 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Best Month</span>
                        <span className="text-emerald-400 font-medium">March (+12.4%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Worst Month</span>
                        <span className="text-red-400 font-medium">August (-3.1%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Best Day</span>
                        <span className="text-emerald-400 font-medium">Monday</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trading Frequency</span>
                        <span className="text-white font-medium">4.2/day</span>
                      </div>
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

            {/* Desktop Sector & Asset Analysis - hidden on mobile */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-8">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white flex items-center">
                    <Building className="h-5 w-5 mr-2 text-blue-400" />
                    Sector Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { sector: "Technology", return: "+32.4%", allocation: "42%", color: "bg-emerald-400" },
                      { sector: "Healthcare", return: "+18.7%", allocation: "23%", color: "bg-blue-400" },
                      { sector: "Finance", return: "+12.1%", allocation: "18%", color: "bg-purple-400" },
                      { sector: "Energy", return: "-2.3%", allocation: "12%", color: "bg-red-400" },
                      { sector: "Consumer", return: "+8.9%", allocation: "5%", color: "bg-amber-400" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                          <span className="text-slate-300 font-medium">{item.sector}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-400 text-sm">{item.allocation}</span>
                          <span
                            className={`font-medium ${item.return.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {item.return}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white flex items-center">
                    <Flame className="h-5 w-5 mr-2 text-orange-400" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { symbol: "NVDA", return: "+127.3%", value: "$89.2K", change: "+$49.8K" },
                      { symbol: "AAPL", return: "+45.7%", value: "$156.4K", change: "+$49.1K" },
                      { symbol: "MSFT", return: "+38.2%", value: "$134.7K", change: "+$37.2K" },
                      { symbol: "GOOGL", return: "+29.1%", value: "$98.3K", change: "+$22.1K" },
                      { symbol: "TSLA", return: "+18.9%", value: "$67.8K", change: "+$10.8K" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white">{item.symbol}</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{item.symbol}</div>
                            <div className="text-slate-400 text-sm">{item.value}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-medium">{item.return}</div>
                          <div className="text-emerald-400 text-sm">{item.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <span className="text-slate-400 text-sm">Value at Risk (95%)</span>
                      <span className="text-red-400 font-medium">$24.7K</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: "24%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Expected Shortfall</span>
                      <span className="text-red-400 font-medium">$38.2K</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "38%" }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                    <div>
                      <div className="text-slate-400 text-sm">Sortino Ratio</div>
                      <div className="text-white font-medium">3.12</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Calmar Ratio</div>
                      <div className="text-white font-medium">2.98</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Treynor Ratio</div>
                      <div className="text-white font-medium">0.284</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Jensen's Alpha</div>
                      <div className="text-emerald-400 font-medium">+16.5%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Correlation Matrix */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-400" />
                  Asset Correlations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center mb-4">
                  <div className="text-center space-y-2">
                    <Layers className="h-12 w-12 text-purple-400 mx-auto" />
                    <p className="text-sm text-slate-400">Correlation Heatmap</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Correlation</span>
                    <span className="text-white">0.34</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Correlation</span>
                    <span className="text-amber-400">0.87 (AAPL-MSFT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diversification</span>
                    <span className="text-emerald-400">Good</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Attribution */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-emerald-400" />
                  Performance Attribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Asset Selection</span>
                      <span className="text-emerald-400 font-medium">+12.3%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-400 h-2 rounded-full" style={{ width: "82%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Sector Allocation</span>
                      <span className="text-blue-400 font-medium">+4.2%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: "28%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Market Timing</span>
                      <span className="text-purple-400 font-medium">+8.2%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: "55%" }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/50">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Total Alpha</span>
                      <span className="text-emerald-400 font-medium">+24.7%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Regime Analysis */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-400" />
                  Market Regime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-emerald-950/30 rounded-lg border border-emerald-800/30">
                    <div className="text-emerald-400 font-semibold">Bull Market</div>
                    <div className="text-slate-400 text-sm">High confidence (87%)</div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">VIX Level</span>
                      <span className="text-emerald-400">14.2 (Low)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Market Breadth</span>
                      <span className="text-emerald-400">Strong</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Momentum</span>
                      <span className="text-emerald-400">Positive</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Regime Duration</span>
                      <span className="text-white">127 days</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/50">
                    <div className="text-slate-400 text-sm mb-2">Performance by Regime</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Bull Markets</span>
                        <span className="text-emerald-400">+28.4%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Bear Markets</span>
                        <span className="text-red-400">-12.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Sideways</span>
                        <span className="text-white">+3.7%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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

              {/* Custom Date Range (when timeframe is CUSTOM) */}
              {filters.timeframe === "CUSTOM" && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">Custom Range</label>
                  <div className="space-y-3">
                    <input
                      type="date"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm"
                      placeholder="End Date"
                    />
                  </div>
                </div>
              )}

              {/* Apply Filters */}
              <div className="pt-4 border-t border-slate-800">
                <Button
                  onClick={() => {
                    setFilterDrawerOpen(false)
                    showNotification.success("Filters applied successfully")
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
