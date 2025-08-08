"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"

interface DashboardStatsProps {
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

export function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? "+" : ""
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getChangeType = (value: number) => value >= 0 ? "positive" : "negative"

  const statCards = [
    {
      title: "Total Portfolio Value",
      value: formatCurrency(stats.totalValue),
      change: formatCurrency(stats.monthPnL),
      changeType: getChangeType(stats.monthPnL),
      icon: DollarSign,
    },
    {
      title: "Total P&L",
      value: formatCurrency(stats.totalPnL),
      change: formatCurrency(stats.weekPnL),
      changeType: getChangeType(stats.weekPnL),
      icon: stats.totalPnL >= 0 ? TrendingUp : TrendingDown,
      changeLabel: "this week",
    },
    {
      title: "Win Rate",
      value: formatPercent(stats.winRate),
      change: formatCurrency(stats.todayPnL),
      changeType: getChangeType(stats.todayPnL),
      icon: Activity,
      changeLabel: "today's P&L",
    },
    {
      title: "Active Positions",
      value: stats.activePositions.toString(),
      change: stats.activePositions > 0 ? "Open" : "No positions",
      changeType: "neutral" as const,
      icon: Activity,
      changeLabel: "",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${
              stat.changeType === "positive" ? "text-green-600" : 
              stat.changeType === "negative" ? "text-red-600" : 
              "text-muted-foreground"
            }`}>
              {stat.change} {stat.changeLabel || "from last month"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}