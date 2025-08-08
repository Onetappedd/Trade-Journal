import { PnLCalendar } from "@/components/analytics/PnLCalendar"
import { PnLCalendarMonthly } from "@/components/analytics/PnLCalendarMonthly"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserTradesGroupedByDay } from "@/lib/calendar-metrics"
import { getSimplifiedCalendarData } from "@/lib/calendar-metrics-simple"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  // Get current user
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">P&L Calendar</h2>
          <p className="text-muted-foreground">Please log in to view your trading calendar</p>
        </div>
      </div>
    )
  }
  
  // Get calendar data for the last 12 months
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 12)
  
  // Debug: Also get simplified data to check
  const simpleData = await getSimplifiedCalendarData(user.id)
  console.log("[Calendar Page] Simple data check:", simpleData)
  
  const calendarData = await getUserTradesGroupedByDay(user.id, startDate, endDate)
  
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? "+" : ""
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }
  
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  
  const winRate = calendarData.tradingDays > 0 
    ? (calendarData.winningDays / calendarData.tradingDays) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">P&L Calendar</h2>
        <p className="text-muted-foreground">
          Visualize your daily trading performance with a heatmap calendar
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Realized P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              calendarData.totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(calendarData.totalRealizedPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 12 months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(winRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {calendarData.winningDays} of {calendarData.tradingDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(calendarData.bestDay.pnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {calendarData.bestDay.date 
                ? new Date(calendarData.bestDay.date).toLocaleDateString()
                : 'No trades yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Day</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(calendarData.worstDay.pnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {calendarData.worstDay.date 
                ? new Date(calendarData.worstDay.date).toLocaleDateString()
                : 'No trades yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Views */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <PnLCalendar data={calendarData} />
        </TabsContent>
        
        <TabsContent value="monthly">
          <PnLCalendarMonthly data={calendarData} />
        </TabsContent>
      </Tabs>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trading Consistency</CardTitle>
            <CardDescription>Your trading activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trading Days</span>
                <span className="text-sm text-muted-foreground">{calendarData.tradingDays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Winning Days</span>
                <span className="text-sm text-green-600">{calendarData.winningDays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Losing Days</span>
                <span className="text-sm text-red-600">{calendarData.losingDays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Break-even Days</span>
                <span className="text-sm text-muted-foreground">
                  {calendarData.tradingDays - calendarData.winningDays - calendarData.losingDays}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Daily P&L</span>
                <span className={`text-sm ${
                  calendarData.tradingDays > 0 && calendarData.totalRealizedPnL / calendarData.tradingDays >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {calendarData.tradingDays > 0 
                    ? formatCurrency(calendarData.totalRealizedPnL / calendarData.tradingDays)
                    : '$0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Win</span>
                <span className="text-sm text-green-600">
                  {calendarData.winningDays > 0 
                    ? formatCurrency(
                        Object.values(calendarData.dailyData)
                          .filter(d => d.realizedPnL > 0)
                          .reduce((sum, d) => sum + d.realizedPnL, 0) / calendarData.winningDays
                      )
                    : '$0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Loss</span>
                <span className="text-sm text-red-600">
                  {calendarData.losingDays > 0 
                    ? formatCurrency(
                        Object.values(calendarData.dailyData)
                          .filter(d => d.realizedPnL < 0)
                          .reduce((sum, d) => sum + d.realizedPnL, 0) / calendarData.losingDays
                      )
                    : '$0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profit Factor</span>
                <span className="text-sm text-muted-foreground">
                  {(() => {
                    const wins = Object.values(calendarData.dailyData)
                      .filter(d => d.realizedPnL > 0)
                      .reduce((sum, d) => sum + d.realizedPnL, 0)
                    const losses = Math.abs(Object.values(calendarData.dailyData)
                      .filter(d => d.realizedPnL < 0)
                      .reduce((sum, d) => sum + d.realizedPnL, 0))
                    return losses > 0 ? (wins / losses).toFixed(2) : '∞'
                  })()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}