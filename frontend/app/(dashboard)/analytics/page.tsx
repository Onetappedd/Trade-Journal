"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3 } from "lucide-react"

const monthlyPnL = [
  { month: "Jan", pnl: 2450, trades: 45 },
  { month: "Feb", pnl: -890, trades: 38 },
  { month: "Mar", pnl: 3200, trades: 52 },
  { month: "Apr", pnl: 1800, trades: 41 },
  { month: "May", pnl: 4100, trades: 48 },
  { month: "Jun", pnl: -1200, trades: 35 },
]

const assetTypeData = [
  { name: "Stocks", value: 65, pnl: 8450 },
  { name: "Options", value: 25, pnl: 3200 },
  { name: "Futures", value: 8, pnl: 890 },
  { name: "Crypto", value: 2, pnl: 307 },
]

const brokerData = [
  { name: "Webull", trades: 89, pnl: 4200 },
  { name: "Robinhood", trades: 67, pnl: 2800 },
  { name: "Schwab", trades: 45, pnl: 3400 },
  { name: "IBKR", trades: 32, pnl: 2447 },
]

const dailyPnL = [
  { date: "Mon", pnl: 245 },
  { date: "Tue", pnl: -89 },
  { date: "Wed", pnl: 567 },
  { date: "Thu", pnl: 123 },
  { date: "Fri", pnl: -234 },
  { date: "Sat", pnl: 0 },
  { date: "Sun", pnl: 0 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6m")

  const stats = [
    {
      title: "Total P&L",
      value: "$12,847.32",
      change: "+8.2%",
      icon: DollarSign,
      positive: true,
    },
    {
      title: "Win Rate",
      value: "68.4%",
      change: "+2.1%",
      icon: Target,
      positive: true,
    },
    {
      title: "Avg P&L per Trade",
      value: "$52.03",
      change: "-$3.21",
      icon: TrendingUp,
      positive: false,
    },
    {
      title: "Best Month",
      value: "$4,100",
      change: "May 2024",
      icon: BarChart3,
      positive: true,
    },
  ]

  return (
    <div className="flex flex-col">
      <Navbar title="Analytics" />

      <div className="flex-1 space-y-6 p-6">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.positive ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={stat.positive ? "text-green-500" : "text-red-500"}>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Monthly P&L Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly P&L</CardTitle>
                  <CardDescription>Your profit and loss over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyPnL}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "P&L"]} />
                      <Bar dataKey="pnl" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Asset Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Type Distribution</CardTitle>
                  <CardDescription>Breakdown by asset type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={assetTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Daily P&L Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Daily P&L Trend</CardTitle>
                <CardDescription>Your daily performance this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyPnL}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "P&L"]} />
                    <Area type="monotone" dataKey="pnl" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Win/Loss Ratio */}
              <Card>
                <CardHeader>
                  <CardTitle>Win/Loss Analysis</CardTitle>
                  <CardDescription>Your trading success metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Win Rate</span>
                      <span className="font-medium">68.4%</span>
                    </div>
                    <Progress value={68.4} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Profit Factor</span>
                      <span className="font-medium">1.85</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Risk/Reward Ratio</span>
                      <span className="font-medium">1:2.3</span>
                    </div>
                    <Progress value={76} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Best/Worst Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Trade Extremes</CardTitle>
                  <CardDescription>Your best and worst performing trades</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Best Trade</span>
                      <Badge variant="outline" className="text-green-600">
                        +$1,245
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">NVDA Call Option</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Worst Trade</span>
                      <Badge variant="outline" className="text-red-600">
                        -$890
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">TSLA Put Option</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Longest Hold</span>
                      <Badge variant="outline">45 days</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">AAPL Stock</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Broker Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Broker Performance</CardTitle>
                  <CardDescription>P&L breakdown by broker</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={brokerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "P&L"]} />
                      <Bar dataKey="pnl" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Symbols */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Symbols</CardTitle>
                  <CardDescription>Your most profitable tickers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { symbol: "AAPL", pnl: 2450, trades: 12 },
                      { symbol: "NVDA", pnl: 1890, trades: 8 },
                      { symbol: "TSLA", pnl: 1234, trades: 15 },
                      { symbol: "SPY", pnl: 890, trades: 22 },
                      { symbol: "QQQ", pnl: 567, trades: 9 },
                    ].map((item) => (
                      <div key={item.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{item.symbol}</Badge>
                          <span className="text-sm text-muted-foreground">{item.trades} trades</span>
                        </div>
                        <span className="font-medium text-green-600">+${item.pnl}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Time of Day Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Time of Day Performance</CardTitle>
                  <CardDescription>When you trade best</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { time: "9:30-10:30 AM", pnl: 3200, color: "bg-green-500" },
                      { time: "10:30-11:30 AM", pnl: 1800, color: "bg-blue-500" },
                      { time: "11:30-12:30 PM", pnl: -400, color: "bg-red-500" },
                      { time: "12:30-1:30 PM", pnl: 600, color: "bg-yellow-500" },
                      { time: "1:30-2:30 PM", pnl: 2100, color: "bg-green-500" },
                      { time: "2:30-4:00 PM", pnl: 1400, color: "bg-blue-500" },
                    ].map((item) => (
                      <div key={item.time} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm">{item.time}</span>
                        </div>
                        <span className={`font-medium ${item.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${item.pnl}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Day of Week Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Day of Week Performance</CardTitle>
                  <CardDescription>Your best trading days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { day: "Monday", pnl: 2450, winRate: 72 },
                      { day: "Tuesday", pnl: 1890, winRate: 68 },
                      { day: "Wednesday", pnl: 3200, winRate: 75 },
                      { day: "Thursday", pnl: 1234, winRate: 65 },
                      { day: "Friday", pnl: 890, winRate: 58 },
                    ].map((item) => (
                      <div key={item.day} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.day}</span>
                          <span className="text-sm text-green-600">+${item.pnl}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={item.winRate} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground">{item.winRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
