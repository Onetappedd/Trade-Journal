"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/providers/auth-provider"
import { DollarSign, TrendingUp, Activity, Shield, RefreshCw } from "lucide-react"

interface TradeAnalytics {
  totalTrades: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export default function DashboardPage() {
  const { session, user } = useAuth()
  const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = async () => {
    if (!session) return
    
    setIsLoading(true)
    try {
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch('/api/portfolio/analytics', { headers })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'Trader'}
          </h1>
          <p className="text-slate-400">Here's your trading performance overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total P&L</p>
                  <p className={`text-2xl font-bold ${(analytics?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {analytics?.totalPnL ? (analytics.totalPnL >= 0 ? '+' : '') + analytics.totalPnL.toFixed(2) : 'N/A'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold text-white">{analytics?.winRate?.toFixed(1) || 'N/A'}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Trades</p>
                  <p className="text-2xl font-bold text-white">{analytics?.totalTrades || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-amber-400">{analytics?.sharpeRatio?.toFixed(2) || 'N/A'}</p>
                </div>
                <Shield className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-slate-800/30 rounded-lg flex items-center justify-center">
                <p className="text-slate-400">Performance chart placeholder</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-slate-800/30 rounded-lg flex items-center justify-center">
                <p className="text-slate-400">Recent trades placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}