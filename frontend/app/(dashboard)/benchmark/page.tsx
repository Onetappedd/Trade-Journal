import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpIcon, TrendingUp, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const benchmarkData = [
  { month: "Jan", portfolio: 1000, sp500: 1000, nasdaq: 1000 },
  { month: "Feb", portfolio: 1200, sp500: 1050, nasdaq: 1080 },
  { month: "Mar", portfolio: 1100, sp500: 1020, nasdaq: 1040 },
  { month: "Apr", portfolio: 1400, sp500: 1100, nasdaq: 1150 },
  { month: "May", portfolio: 1300, sp500: 1080, nasdaq: 1120 },
  { month: "Jun", portfolio: 1600, sp500: 1150, nasdaq: 1200 },
]

const performanceMetrics = [
  { metric: "Total Return", portfolio: "60.0%", sp500: "15.0%", nasdaq: "20.0%" },
  { metric: "Annualized Return", portfolio: "45.2%", sp500: "12.5%", nasdaq: "16.8%" },
  { metric: "Volatility", portfolio: "18.5%", sp500: "14.2%", nasdaq: "22.1%" },
  { metric: "Sharpe Ratio", portfolio: "2.44", sp500: "0.88", nasdaq: "0.76" },
  { metric: "Max Drawdown", portfolio: "-8.5%", sp500: "-12.3%", nasdaq: "-15.7%" },
  { metric: "Beta", portfolio: "1.25", sp500: "1.00", nasdaq: "1.15" },
]

export default function BenchmarkPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Benchmark Analysis</h2>
        <div className="flex items-center space-x-2">
          <Select defaultValue="1y">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
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
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio vs S&P 500</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+45.0%</div>
            <p className="text-xs text-muted-foreground">Outperforming by 30.0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio vs NASDAQ</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+25.0%</div>
            <p className="text-xs text-muted-foreground">Outperforming by 5.0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk-Adjusted Return</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.44</div>
            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>Your portfolio vs major market indices</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="portfolio" stroke="#8884d8" strokeWidth={3} name="Portfolio" />
              <Line type="monotone" dataKey="sp500" stroke="#82ca9d" strokeWidth={2} name="S&P 500" />
              <Line type="monotone" dataKey="nasdaq" stroke="#ffc658" strokeWidth={2} name="NASDAQ" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Detailed comparison of key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Metric</th>
                  <th className="text-left p-2">Your Portfolio</th>
                  <th className="text-left p-2">S&P 500</th>
                  <th className="text-left p-2">NASDAQ</th>
                </tr>
              </thead>
              <tbody>
                {performanceMetrics.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{row.metric}</td>
                    <td className="p-2">
                      <Badge variant="default">{row.portfolio}</Badge>
                    </td>
                    <td className="p-2">{row.sp500}</td>
                    <td className="p-2">{row.nasdaq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Strong Performance</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your portfolio is significantly outperforming both the S&P 500 and NASDAQ with a 60% total return
                compared to 15% and 20% respectively.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Risk Management</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your Sharpe ratio of 2.44 indicates excellent risk-adjusted returns, significantly higher than market
                benchmarks.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Volatility Consideration</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your portfolio shows higher volatility (18.5%) compared to the S&P 500 (14.2%), but this is compensated
                by superior returns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
