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
  const [hasTrades, setHasTrades] = useState(false)
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  const dashboardOverview = dashboardData ? {
    dayPnL: dashboardData.dayPnL || "+$0.00",
    portfolioValue: dashboardData.portfolioValue || "$0.00",
    recentTrades: dashboardData.trades || [],
  } : {
    dayPnL: "+$0.00",
    portfolioValue: "$0.00",
    recentTrades: [],
  }

  const alerts = [
    {
      id: 1,
      type: "warning",
      message: "High volatility detected in your portfolio",
      time: "2 minutes ago",
    },
    {
      id: 2,
      type: "info",
      message: "New trade opportunity: AAPL",
      time: "15 minutes ago",
    },
  ]

  const positionsData = [
    { symbol: "AAPL", quantity: 100, value: 15000, category: "Technology", change: "+2.5%" },
    { symbol: "TSLA", quantity: 50, value: 12000, category: "Automotive", change: "-1.2%" },
    { symbol: "MSFT", quantity: 75, value: 18000, category: "Technology", change: "+0.8%" },
  ]

  const { socket } = useWebSocket()

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
      } else {
        setUser(session.user)
        // Fetch real dashboard data
        await fetchDashboardData(session)
        if (!session.user.onboarded) {
          showOnboarding()
        }
      }
    }
    checkSession()
  }, [router, showOnboarding])

  const fetchDashboardData = async (session) => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard data fetched:', data)
        setDashboardData(data)
        setHasTrades(data.trades && data.trades.length > 0)
      } else {
        console.error('Failed to fetch dashboard data:', response.statusText)
        setHasTrades(false)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setHasTrades(false)
    } finally {
      setLoading(false)
    }
  }

  // Test API connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const session = await getSession()
        if (session) {
          const response = await fetch('/api/test-dashboard', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('Dashboard test successful:', data)
          } else {
            console.error('Dashboard test failed:', response.statusText)
          }
        }
      } catch (error) {
        console.error('Dashboard test error:', error)
      }
    }
    
    testConnection()
  }, [])

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome back, {user?.user_metadata?.name || user?.email || 'User'}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">Here's your trading performance overview for today</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => router.push('/import')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Trades
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            <span className="ml-2 text-slate-400">Loading dashboard...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasTrades && (
          <div className="text-center py-12">
            <div className="mb-4">
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No trades yet</h3>
              <p className="text-slate-400 mb-6">Start by importing your trading data to see your performance analytics.</p>
              <Button 
                onClick={() => router.push('/import')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Trades
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats - Only show if has trades */}
        {!loading && hasTrades && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Today's P&L</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardOverview.dayPnL}</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Portfolio Value</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardOverview.portfolioValue}</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Active Positions</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{positions.length}</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Win Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">68%</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Portfolio Performance - Only show if has trades */}
        {!loading && hasTrades && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Portfolio Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                  <p className="text-slate-400">Chart placeholder</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calculateAssetAllocation().map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                        <span className="text-slate-300 text-sm">{item.category}</span>
                      </div>
                      <span className="text-white font-medium">{item.percentage}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* Recent Trades - Only show if has trades */}
        {!loading && hasTrades && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Trades
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardOverview.recentTrades.slice(0, 5).map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${trade.side === 'buy' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                      <div>
                        <p className="text-white font-medium">{trade.symbol}</p>
                        <p className="text-slate-400 text-sm">{trade.side} • {trade.quantity} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${trade.price}</p>
                      <p className={`text-sm ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Max Drawdown</span>
                  <span className="text-white font-medium">-8.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sharpe Ratio</span>
                  <span className="text-white font-medium">1.45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Beta</span>
                  <span className="text-white font-medium">0.89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Volatility</span>
                  <span className="text-white font-medium">12.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Quick Actions - Only show if has trades */}
        {!loading && hasTrades && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => router.push('/trades')}
          >
            <div className="flex flex-col items-center text-center">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="font-medium">View All Trades</span>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => router.push('/analytics')}
          >
            <div className="flex flex-col items-center text-center">
              <PieChart className="h-6 w-6 mb-2" />
              <span className="font-medium">Analytics</span>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => router.push('/import')}
          >
            <div className="flex flex-col items-center text-center">
              <Upload className="h-6 w-6 mb-2" />
              <span className="font-medium">Import Data</span>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto p-4 sm:p-6 bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => router.push('/settings')}
          >
            <div className="flex flex-col items-center text-center">
              <Settings className="h-6 w-6 mb-2" />
              <span className="font-medium">Settings</span>
            </div>
          </Button>
        </div>
        )}
      </main>
    </div>
  )
}