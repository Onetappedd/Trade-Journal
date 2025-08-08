"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StrategyMetricsProps {
  metrics: {
    expectancy: number
    sharpeRatio: number
    maxDrawdown: number
    avgHoldTime: number
    profitFactor: number
    avgWin: number
    avgLoss: number
    largestWin: number
    largestLoss: number
  }
}

export function StrategyMetrics({ metrics }: StrategyMetricsProps) {
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? "+" : ""
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals)
  }

  const metricsList = [
    { label: "Expectancy", value: formatCurrency(metrics.expectancy) },
    { label: "Sharpe Ratio", value: formatNumber(metrics.sharpeRatio) },
    { label: "Max Drawdown", value: `${formatNumber(metrics.maxDrawdown, 1)}%` },
    { label: "Avg Hold Time", value: `${formatNumber(metrics.avgHoldTime, 1)} days` },
    { label: "Profit Factor", value: formatNumber(metrics.profitFactor) },
    { label: "Avg Win", value: formatCurrency(metrics.avgWin) },
    { label: "Avg Loss", value: formatCurrency(Math.abs(metrics.avgLoss)) },
    { label: "Largest Win", value: formatCurrency(metrics.largestWin) },
    { label: "Largest Loss", value: formatCurrency(metrics.largestLoss) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metricsList.map((metric) => (
            <div key={metric.label} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <span className="font-medium">{metric.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}