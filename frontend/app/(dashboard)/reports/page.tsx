"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download, FileText, CalendarIcon, DollarSign } from "lucide-react"
import { format } from "date-fns"

// Mock data for reports
const weeklyReports = [
  {
    week: "Dec 25-31, 2023",
    trades: 12,
    pnl: 2450.5,
    winRate: 75,
    bestTrade: "NVDA +$890",
    worstTrade: "TSLA -$234",
  },
  {
    week: "Dec 18-24, 2023",
    trades: 8,
    pnl: -890.25,
    winRate: 37.5,
    bestTrade: "AAPL +$456",
    worstTrade: "SPY -$567",
  },
  {
    week: "Dec 11-17, 2023",
    trades: 15,
    pnl: 3200.75,
    winRate: 80,
    bestTrade: "TSLA +$1200",
    worstTrade: "QQQ -$123",
  },
]

const monthlyData = [
  { month: "Jan", pnl: 2450, trades: 45, winRate: 68 },
  { month: "Feb", pnl: -890, trades: 38, winRate: 42 },
  { month: "Mar", pnl: 3200, trades: 52, winRate: 75 },
  { month: "Apr", pnl: 1800, trades: 41, winRate: 63 },
  { month: "May", pnl: 4100, trades: 48, winRate: 79 },
  { month: "Jun", pnl: -1200, trades: 35, winRate: 37 },
]

const performanceMetrics = [
  { metric: "Total P&L", value: "$12,847.32", change: "+8.2%" },
  { metric: "Win Rate", value: "68.4%", change: "+2.1%" },
  { metric: "Profit Factor", value: "1.85", change: "+0.12" },
  { metric: "Sharpe Ratio", value: "1.42", change: "+0.08" },
  { metric: "Max Drawdown", value: "-8.1%", change: "-1.2%" },
  { metric: "Avg Trade", value: "$52.03", change: "-$3.21" },
]

const topPerformers = [
  { symbol: "NVDA", trades: 8, pnl: 2890, winRate: 87.5 },
  { symbol: "AAPL", trades: 12, pnl: 2450, winRate: 75 },
  { symbol: "TSLA", trades: 15, pnl: 1890, winRate: 66.7 },
  { symbol: "SPY", trades: 22, pnl: 1234, winRate: 59.1 },
  { symbol: "QQQ", trades: 9, pnl: 890, winRate: 77.8 },
]

export default function Reports() {
  const [reportType, setReportType] = useState("weekly")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedMetrics, setSelectedMetrics] = useState(["pnl", "winRate", "trades", "sharpeRatio"])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getPLColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"
  }

  const exportReport = (format: string) => {
    // Mock export functionality
    console.log(`Exporting report as ${format}`)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate custom performance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportReport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport("excel")}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {performanceMetrics.map((metric) => (
              <Card key={metric.metric}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p
                    className={`text-xs ${metric.change.startsWith("+") ? "text-green-600" : metric.change.startsWith("-") ? "text-red-600" : "text-muted-foreground"}`}
                  >
                    {metric.change} from last period
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>P&L and win rate by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "pnl" ? formatCurrency(Number(value)) : `${value}%`,
                      name === "pnl" ? "P&L" : name === "winRate" ? "Win Rate" : "Trades",
                    ]}
                  />
                  <Bar dataKey="pnl" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Symbols</CardTitle>
              <CardDescription>Best performing symbols by P&L</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Win Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.map((performer) => (
                    <TableRow key={performer.symbol}>
                      <TableCell>
                        <Badge variant="outline">{performer.symbol}</Badge>
                      </TableCell>
                      <TableCell>{performer.trades}</TableCell>
                      <TableCell className={getPLColor(performer.pnl)}>{formatCurrency(performer.pnl)}</TableCell>
                      <TableCell>{formatPercent(performer.winRate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Reports</CardTitle>
              <CardDescription>Detailed weekly trading summaries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyReports.map((report, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{report.week}</h3>
                      <Badge variant={report.pnl >= 0 ? "default" : "destructive"}>{formatCurrency(report.pnl)}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Trades</div>
                        <div className="font-medium">{report.trades}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                        <div className="font-medium">{formatPercent(report.winRate)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Best Trade</div>
                        <div className="font-medium text-green-600">{report.bestTrade}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Worst Trade</div>
                        <div className="font-medium text-red-600">{report.worstTrade}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Analysis</CardTitle>
              <CardDescription>Comprehensive monthly performance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-3">P&L Trend</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), "P&L"]} />
                      <Line type="monotone" dataKey="pnl" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Win Rate Trend</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, "Win Rate"]} />
                      <Line type="monotone" dataKey="winRate" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Create personalized reports with custom parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range Selector */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <span>to</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Metrics Selection */}
              <div className="space-y-2">
                <Label>Include Metrics</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: "pnl", label: "P&L" },
                    { id: "winRate", label: "Win Rate" },
                    { id: "trades", label: "Trade Count" },
                    { id: "sharpeRatio", label: "Sharpe Ratio" },
                    { id: "maxDrawdown", label: "Max Drawdown" },
                    { id: "profitFactor", label: "Profit Factor" },
                    { id: "avgTrade", label: "Avg Trade" },
                    { id: "bestTrade", label: "Best Trade" },
                  ].map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMetrics([...selectedMetrics, metric.id])
                          } else {
                            setSelectedMetrics(selectedMetrics.filter((m) => m !== metric.id))
                          }
                        }}
                      />
                      <Label htmlFor={metric.id} className="text-sm">
                        {metric.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="detailed">Detailed Analysis</SelectItem>
                    <SelectItem value="comparison">Period Comparison</SelectItem>
                    <SelectItem value="breakdown">Symbol Breakdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
