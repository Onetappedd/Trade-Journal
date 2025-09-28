"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OnboardingModal, useOnboarding } from "@/components/onboarding-modal"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Settings,
  Filter,
  Download,
  Upload,
  History,
  PieChart,
  LineChart,
  DollarSign,
  Percent,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Briefcase,
  Shield,
  ArrowUpRight,
} from "lucide-react"
import { getSession } from "@/lib/auth"
import { useWebSocket } from "@/hooks/useWebSocket"

export default function DashboardPage() {
  const { showOnboarding, closeOnboarding } = useOnboarding()
  const router = useRouter()
  const [positions, setPositions] = useState([])
  const [hasTrades, setHasTrades] = useState(true)

  const dashboardOverview = {
    dayPnL: "+$2,847.32",
    portfolioValue: "$847,293",
    recentTrades: [
      {
        symbol: "AAPL",
        side: "BUY",
        quantity: 100,
        price: "$175.23",
        pnl: "+$247.50",
        time: "2 min ago",
        status: "filled",
      },
      {
        symbol: "TSLA",
        side: "SELL",
        quantity: 50,
        price: "$242.18",
        pnl: "-$125.30",
        time: "15 min ago",
        status: "filled",
      },
      {
        symbol: "NVDA",
        side: "BUY",
        quantity: 25,
        price: "$891.45",
        pnl: "+$1,247.80",
        time: "1 hour ago",
        status: "filled",
      },
    ],
  }

  const alerts = []
  const positionsData = [
    { category: "Tech", value: 450000 },
    { category: "Finance", value: 200000 },
    { category: "Healthcare", value: 150000 },
    { category: "Energy", value: 47293 },
  ]

  const isOverviewLoading = false
  const isAlertsLoading = false
  const isPositionsLoading = false
  const overviewError = null
  const alertsError = null
  const positionsError = null

  const { socket } = useWebSocket("/ws/dashboard")

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === "livePnL") {
          // Update live P&L
        }
      }
    }
  }, [socket])

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (!session) {
        router.push("/auth/login")
      } else if (!session.user.onboarded) {
        showOnboarding()
      }
    }
    checkSession()
  }, [router, showOnboarding])

  useEffect(() => {
    setPositions(positionsData)
    if (dashboardOverview && dashboardOverview.recentTrades.length === 0) {
      setHasTrades(false)
    }
  }, [])

  const calculateAssetAllocation = () => {
    const allocation = {}
    positions.forEach((position) => {
      if (allocation[position.category]) {
        allocation[position.category] += position.value
      } else {
        allocation[position.category] = position.value
      }
    })
    const totalValue = Object.values(allocation).reduce((acc, val) => acc + val, 0)
    return Object.entries(allocation).map(([category, value]) => ({
      category,
      percentage: ((value / totalValue) * 100).toFixed(0) + "%",
      color: `bg-${category.toLowerCase()}-400`,
    }))
  }

  if (isOverviewLoading || isAlertsLoading || isPositionsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (overviewError || alertsError || positionsError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p>Error loading data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back, John</h1>
              <p className="text-slate-400 text-sm sm:text-base">Here's your trading performance overview for today</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-10 sm:h-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total P&L</p>
                    <p className="text-2xl font-bold text-emerald-400">{dashboardOverview.dayPnL}</p>
                    <p className="text-sm text-emerald-400 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +12.4% today
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-950/50 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Win Rate</p>
                    <p className="text-2xl font-bold text-white">67.2%</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.1% vs last week
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-950/50 flex items-center justify-center">
                    <Percent className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Risk Score</p>
                    <p className="text-2xl font-bold text-amber-400">7.2</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      Moderate Risk
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-950/50 flex items-center justify-center">
                    <Target className="h-6 w-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Active Positions</p>
                    <p className="text-2xl font-bold text-white">23</p>
                    <p className="text-sm text-slate-400 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      $847K exposure
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-950/50 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Charts and Analytics */}
          <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            {/* Portfolio Performance Chart */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="text-lg sm:text-xl text-white">Portfolio Performance</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-emerald-950/50 text-emerald-400 border-emerald-800/50">
                      <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse mr-2"></div>
                      Live
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center mb-6">
                  <div className="text-center space-y-3">
                    <LineChart className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-400 mx-auto" />
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-white">Real-time P&L Chart</p>
                      <p className="text-xs sm:text-sm text-slate-400">Interactive performance visualization</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-white">{dashboardOverview.portfolioValue}</div>
                    <div className="text-xs text-slate-400">Portfolio Value</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-emerald-400">+24.7%</div>
                    <div className="text-xs text-slate-400">YTD Return</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">2.34</div>
                    <div className="text-xs text-slate-400">Sharpe Ratio</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">-2.1%</div>
                    <div className="text-xs text-slate-400">Max Drawdown</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="text-lg sm:text-xl text-white">Recent Trades</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardOverview.recentTrades.map((trade, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">{trade.symbol}</span>
                          </div>
                          <div>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <Badge
                                variant={trade.side === "BUY" ? "default" : "secondary"}
                                className={trade.side === "BUY" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}
                              >
                                {trade.side}
                              </Badge>
                              <span className="text-white font-medium text-sm sm:text-base">
                                {trade.quantity} shares
                              </span>
                            </div>
                            <div className="text-sm text-slate-400">@ {trade.price}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                        <div className="text-left sm:text-right">
                          <div
                            className={`font-semibold ${trade.pnl.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {trade.pnl}
                          </div>
                          <div className="text-sm text-slate-400">{trade.time}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={trade.status === "filled" ? "default" : "secondary"}
                            className={
                              trade.status === "filled"
                                ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
                                : "bg-amber-950/50 text-amber-400 border-amber-800/50"
                            }
                          >
                            {trade.status === "filled" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {trade.status}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent w-full sm:w-auto"
                  >
                    <History className="h-4 w-4 mr-2" />
                    View All Trades
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6 sm:space-y-8">
            {/* Risk Metrics */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-amber-400" />
                  Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Value at Risk (95%)</span>
                    <span className="text-white font-medium">$12.4K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Expected Shortfall</span>
                    <span className="text-white font-medium">$18.7K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Portfolio Beta</span>
                    <span className="text-white font-medium">0.87</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Correlation Risk</span>
                    <span className="text-amber-400 font-medium">Medium</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Concentration Risk</span>
                    <span className="text-emerald-400 font-medium">Low</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/50">
                  <Button
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Detailed Risk Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Asset Allocation */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-400" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center mb-4">
                  <div className="text-center space-y-2">
                    <PieChart className="h-8 w-8 text-blue-400 mx-auto" />
                    <p className="text-sm text-slate-400">Interactive Portfolio Breakdown</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {calculateAssetAllocation().map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                        <span className="text-slate-300 text-sm">{item.category}</span>
                      </div>
                      <span className="text-white font-medium text-sm">{item.percentage}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-emerald-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-12 text-xs sm:text-sm"
                  >
                    <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Import</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-12 text-xs sm:text-sm"
                  >
                    <Download className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-12 text-xs sm:text-sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Analytics</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-12 text-xs sm:text-sm"
                  >
                    <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
