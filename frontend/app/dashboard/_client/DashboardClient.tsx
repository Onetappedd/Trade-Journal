'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  DashboardData, 
  Trade, 
  Timeframe, 
  CustomRange,
  ChartDataPoint,
  fmtUSD,
  fmtPct,
  withSignUSD,
  colorByCategory
} from '@/types/dashboard'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Plus,
  Settings,
  Upload,
  BarChart3,
  PieChart,
  Calendar,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface DashboardClientProps {
  user: User
  dashboardData: DashboardData
}

export default function DashboardClient({ user, dashboardData }: DashboardClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [timeframe, setTimeframe] = useState<Timeframe>('today')
  const [customRange, setCustomRange] = useState<CustomRange | null>(null)
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState<WebSocket | null>(null)

  // Derived state
  const hasTrades = !!dashboardData?.trades?.length

  // Date calculations
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = (() => {
    const d = new Date()
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  })()
  const startOfMonth = (() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })()
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Period calculations
  const getPeriodPnL = (trades: Trade[], from: Date) =>
    trades.filter(t => new Date(t.closedAt ?? t.openedAt ?? Date.now()) >= from)
          .reduce((a, t) => a + (t.pnl ?? 0), 0)

  const getFilteredTrades = (trades: Trade[], timeframe: Timeframe, customRange?: CustomRange | null) => {
    let from: Date
    switch (timeframe) {
      case 'today':
        from = startOfDay
        break
      case 'wtd':
        from = startOfWeek
        break
      case 'mtd':
        from = startOfMonth
        break
      case 'ytd':
        from = startOfYear
        break
      case 'custom':
        from = customRange?.start ?? startOfDay
        break
      default:
        from = startOfDay
    }
    
    return trades.filter(t => new Date(t.closedAt ?? t.openedAt ?? Date.now()) >= from)
  }

  const filteredTrades = useMemo(() => 
    getFilteredTrades(dashboardData?.trades ?? [], timeframe, customRange),
    [dashboardData?.trades, timeframe, customRange]
  )

  // KPI calculations
  const todayPnL = getPeriodPnL(dashboardData?.trades ?? [], startOfDay)
  const wtdPnL = getPeriodPnL(dashboardData?.trades ?? [], startOfWeek)
  const mtdPnL = getPeriodPnL(dashboardData?.trades ?? [], startOfMonth)
  const ytdPnL = getPeriodPnL(dashboardData?.trades ?? [], startOfYear)
  
  const last20 = (dashboardData?.trades ?? []).slice(-20)
  const winRate20 = last20.length ? last20.filter(t => (t.pnl ?? 0) > 0).length / last20.length : 0

  // Chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!filteredTrades.length) return []
    
    // Group trades by date and calculate daily/cumulative PnL
    const dailyMap = new Map<string, number>()
    const cumMap = new Map<string, number>()
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.closedAt ?? trade.openedAt ?? Date.now())
      const dateKey = date.toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) ?? 0
      dailyMap.set(dateKey, existing + (trade.pnl ?? 0))
    })
    
    // Calculate cumulative
    let cumulative = 0
    const sortedDates = Array.from(dailyMap.keys()).sort()
    sortedDates.forEach(date => {
      cumulative += dailyMap.get(date) ?? 0
      cumMap.set(date, cumulative)
    })
    
    return sortedDates.map(date => ({
      dateLabel: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: new Date(date),
      daily: dailyMap.get(date) ?? 0,
      cum: cumMap.get(date) ?? 0
    }))
  }, [filteredTrades])

  // WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')
    setSocket(ws)
    
    return () => {
      ws.close()
    }
  }, [])

  // WebSocket message handling
  useEffect(() => {
    if (!socket) return
    
    const onMsg = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg?.type === 'livePnL' && typeof msg.value === 'number') {
          // Update dashboard data with live PnL
          toast({
            title: 'Live Update',
            description: `Portfolio P&L updated: ${withSignUSD(msg.value)}`,
          })
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('WebSocket message parse error:', error)
        }
      }
    }
    
    socket.addEventListener('message', onMsg)
    return () => socket.removeEventListener('message', onMsg)
  }, [socket, toast])

  // Safe fetch utility
  const safeFetch = async (input: RequestInfo, init?: RequestInit) => {
    const ctrl = new AbortController()
    const p = fetch(input, { ...init, signal: ctrl.signal })
    ;(p as any).abort = () => ctrl.abort()
    return p
  }

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      setLoading(true)
      const response = await safeFetch(`/api/export?scope=${timeframe}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trades-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Export Complete',
        description: 'CSV file downloaded successfully',
      })
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV file',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Timeframe chips
  const timeframeOptions: { value: Timeframe; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'wtd', label: 'WTD' },
    { value: 'mtd', label: 'MTD' },
    { value: 'ytd', label: 'YTD' },
  ]

  // KPI Cards
  const kpiCards = [
    {
      title: 'Today P&L',
      value: withSignUSD(todayPnL),
      icon: TrendingUp,
      testId: 'kpi-day-pnl',
      change: todayPnL >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'WTD P&L',
      value: withSignUSD(wtdPnL),
      icon: BarChart3,
      testId: 'kpi-wtd',
      change: wtdPnL >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'MTD P&L',
      value: withSignUSD(mtdPnL),
      icon: Calendar,
      testId: 'kpi-mtd',
      change: mtdPnL >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Win Rate (20)',
      value: fmtPct(winRate20),
      icon: Target,
      testId: 'kpi-winrate20',
      change: winRate20 >= 0.5 ? 'positive' : 'negative'
    }
  ]

  // Risk event severity icons
  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {user?.user_metadata?.name || user?.email || 'User'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Here's your trading performance overview for today
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/settings')}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/import')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Trades
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {timeframeOptions.map((option) => (
          <Button
            key={option.value}
            variant={timeframe === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe(option.value)}
            className="min-h-10"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div data-testid="kpi-skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <Skeleton className="h-3 w-24 bg-slate-800 rounded mb-4" />
              <Skeleton className="h-8 w-32 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasTrades && (
        <div className="text-center py-12">
          <div className="mb-6">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No trades yet</h3>
            <p className="text-slate-400 mb-6">Start by importing your trading data to see your performance analytics.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/import')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="cta-import-csv"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/settings/integrations')}
                data-testid="cta-connect-broker"
              >
                <Zap className="h-4 w-4 mr-2" />
                Connect Broker
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/trades/new?from=dashboard')}
                data-testid="cta-add-manual-trade"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Trade
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show if has trades */}
      {!loading && hasTrades && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {kpiCards.map((card) => (
              <Card key={card.title} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6 min-h-[110px]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-400">{card.title}</p>
                    <card.icon className={`h-4 w-4 ${
                      card.change === 'positive' ? 'text-emerald-400' : 'text-red-400'
                    }`} />
                  </div>
                  <p 
                    className={`text-2xl font-bold ${
                      card.change === 'positive' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                    data-testid={card.testId}
                  >
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Portfolio Performance Chart */}
          <Card className="bg-slate-900 border-slate-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Performance</CardTitle>
              <CardDescription>Daily P&L and cumulative performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-portfolio">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="daily" 
                      fill="#10B981"
                      name="Daily P&L"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="cum" 
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      name="Cumulative P&L"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card className="bg-slate-900 border-slate-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Recent Trades</CardTitle>
              <CardDescription>Your latest trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-testid="list-recent-trades">
                {filteredTrades.slice(0, 5).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        trade.side === 'buy' ? 'bg-emerald-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="font-medium text-white">{trade.symbol}</p>
                        <p className="text-sm text-slate-400">
                          {trade.side.toUpperCase()} {trade.quantity} @ {fmtUSD(trade.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        (trade.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {withSignUSD(trade.pnl ?? 0)}
                      </p>
                      <p className="text-sm text-slate-400">
                        {trade.closedAt ? new Date(trade.closedAt).toLocaleDateString() : 'Open'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Events */}
          {dashboardData.riskEvents && dashboardData.riskEvents.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Recent Risk Events</CardTitle>
                <CardDescription>Important risk alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" data-testid="risk-events">
                  {dashboardData.riskEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
                      {getRiskIcon(event.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{event.details}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(event.at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.kind}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Asset Allocation */}
          {dashboardData.positions && dashboardData.positions.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Asset Allocation</CardTitle>
                <CardDescription>Portfolio distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.positions.map((position) => (
                    <div key={position.symbol} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          colorByCategory[position.category] ?? 'bg-slate-400'
                        }`} />
                        <div>
                          <p className="font-medium text-white">{position.symbol}</p>
                          <p className="text-sm text-slate-400">{position.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">{fmtUSD(position.value)}</p>
                        <p className={`text-sm ${
                          position.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {withSignUSD(position.changePct)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription>Common trading tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/trades/new?from=dashboard')}
                  className="h-20 flex flex-col space-y-2"
                  data-testid="action-add-manual-trade"
                >
                  <Plus className="h-6 w-6" />
                  <span>Add Manual Trade</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={loading}
                  className="h-20 flex flex-col space-y-2"
                  data-testid="action-export-csv"
                >
                  <Download className="h-6 w-6" />
                  <span>Export CSV</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/analytics')}
                  className="h-20 flex flex-col space-y-2"
                  data-testid="action-view-analytics"
                >
                  <BarChart3 className="h-6 w-6" />
                  <span>View Analytics</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/settings/integrations')}
                  className="h-20 flex flex-col space-y-2"
                  data-testid="action-manage-integrations"
                >
                  <Zap className="h-6 w-6" />
                  <span>Manage Integrations</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Broker Sync Status */}
          {dashboardData.integrations && dashboardData.integrations.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Integration Status</CardTitle>
                <CardDescription>Broker connection status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.integrations.map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {integration.status === 'connected' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <div>
                          <p className="font-medium text-white">{integration.name}</p>
                          <p className="text-sm text-slate-400 capitalize">{integration.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {integration.lastSync && (
                          <p className="text-sm text-slate-400">
                            {new Date(integration.lastSync).toLocaleString()}
                          </p>
                        )}
                        {integration.status !== 'connected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/settings/integrations')}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
