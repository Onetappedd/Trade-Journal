"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react"

const stats = [
  {
    title: "Total Trades",
    value: "247",
    change: "+12%",
    changeType: "positive" as const,
    icon: Activity,
  },
  {
    title: "Win Rate",
    value: "68.4%",
    change: "+2.1%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Realized P&L",
    value: "$12,847",
    change: "+$1,234",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Avg Trade Size",
    value: "$2,450",
    change: "-$150",
    changeType: "negative" as const,
    icon: TrendingDown,
  },
]

export function TradesStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
