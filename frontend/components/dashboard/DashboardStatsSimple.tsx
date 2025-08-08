import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStatsSimpleProps {
  stats: {
    totalValue: number
    totalPnL: number
    winRate: number
    activePositions: number
    todayPnL: number
    weekPnL: number
    monthPnL: number
  }
}

export function DashboardStatsSimple({ stats }: DashboardStatsSimpleProps) {
  const formatCurrency = (value: number, showSign: boolean = false) => {
    const prefix = showSign && value >= 0 ? "+" : ""
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatPercent = (value: number, showSign: boolean = false) => {
    const prefix = showSign && value >= 0 ? "+" : ""
    return `${prefix}${Math.abs(value).toFixed(1)}%`
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return "text-green-600 dark:text-green-400"
    if (value < 0) return "text-red-600 dark:text-red-400"
    return "text-muted-foreground"
  }

  const statCards = [
    {
      title: "Total Portfolio Value",
      value: formatCurrency(stats.totalValue),
      change: formatCurrency(stats.monthPnL, true),
      changeLabel: "past month",
      icon: DollarSign,
      iconColor: "text-blue-600",
      changeColor: getChangeColor(stats.monthPnL),
    },
    {
      title: "Total P&L",
      value: formatCurrency(stats.totalPnL, true),
      change: formatCurrency(stats.weekPnL, true),
      changeLabel: "this week",
      icon: stats.totalPnL >= 0 ? TrendingUp : TrendingDown,
      iconColor: stats.totalPnL >= 0 ? "text-green-600" : "text-red-600",
      changeColor: getChangeColor(stats.weekPnL),
    },
    {
      title: "Win Rate",
      value: formatPercent(stats.winRate),
      change: formatCurrency(stats.todayPnL, true),
      changeLabel: "today's P&L",
      icon: Percent,
      iconColor: "text-purple-600",
      changeColor: getChangeColor(stats.todayPnL),
    },
    {
      title: "Active Positions",
      value: stats.activePositions.toString(),
      change: stats.activePositions > 0 ? "Open" : "No positions",
      changeLabel: "",
      icon: Activity,
      iconColor: "text-orange-600",
      changeColor: "text-muted-foreground",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value}
            </div>
            <p className={cn("text-xs", stat.changeColor)}>
              {stat.change} {stat.changeLabel}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}