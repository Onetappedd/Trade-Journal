"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, Clock } from "lucide-react"

const metrics = [
  {
    title: "Expectancy",
    value: "$52.30",
    description: "Average profit per trade",
    icon: Target,
    color: "text-green-600",
  },
  {
    title: "Sharpe Ratio",
    value: "1.42",
    description: "Risk-adjusted returns",
    icon: TrendingUp,
    color: "text-blue-600",
  },
  {
    title: "Max Drawdown",
    value: "-8.5%",
    description: "Largest peak-to-trough decline",
    icon: TrendingDown,
    color: "text-red-600",
  },
  {
    title: "Avg Hold Time",
    value: "3.2 days",
    description: "Average position duration",
    icon: Clock,
    color: "text-purple-600",
  },
]

export function StrategyMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.title} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${metric.color}`}>
                  <metric.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{metric.title}</div>
                  <div className="text-xs text-muted-foreground">{metric.description}</div>
                </div>
              </div>
              <div className={`font-bold ${metric.color}`}>{metric.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
