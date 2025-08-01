"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, TrendingDown, TrendingUp, Shield, Calculator } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const drawdownData = [
  { date: "Jan", drawdown: -2.5, portfolio: 98500 },
  { date: "Feb", drawdown: -5.2, portfolio: 94800 },
  { date: "Mar", drawdown: -1.8, portfolio: 98200 },
  { date: "Apr", drawdown: -8.1, portfolio: 91900 },
  { date: "May", drawdown: -3.4, portfolio: 96600 },
  { date: "Jun", drawdown: -0.9, portfolio: 99100 },
]

const correlationData = [
  { symbol: "AAPL", correlation: 0.85, allocation: 15 },
  { symbol: "MSFT", correlation: 0.72, allocation: 12 },
  { symbol: "GOOGL", correlation: 0.68, allocation: 10 },
  { symbol: "TSLA", correlation: 0.45, allocation: 8 },
  { symbol: "SPY", correlation: 0.92, allocation: 20 },
]

export default function RiskManagementPage() {
  const [accountSize, setAccountSize] = useState("100000")
  const [riskPerTrade, setRiskPerTrade] = useState("2")
  const [entryPrice, setEntryPrice] = useState("")
  const [stopLoss, setStopLoss] = useState("")

  const calculatePositionSize = () => {
    const account = Number.parseFloat(accountSize)
    const risk = Number.parseFloat(riskPerTrade) / 100
    const entry = Number.parseFloat(entryPrice)
    const stop = Number.parseFloat(stopLoss)

    if (account && risk && entry && stop) {
      const riskAmount = account * risk
      const riskPerShare = Math.abs(entry - stop)
      const positionSize = Math.floor(riskAmount / riskPerShare)
      return { positionSize, riskAmount, riskPerShare }
    }
    return null
  }

  const calculation = calculatePositionSize()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Risk Management</h2>
      </div>

      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculator">Position Calculator</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown Analysis</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Matrix</TabsTrigger>
          <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Position Size Calculator
                </CardTitle>
                <CardDescription>Calculate optimal position size based on your risk tolerance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-size">Account Size ($)</Label>
                    <Input
                      id="account-size"
                      value={accountSize}
                      onChange={(e) => setAccountSize(e.target.value)}
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk-per-trade">Risk Per Trade (%)</Label>
                    <Input
                      id="risk-per-trade"
                      value={riskPerTrade}
                      onChange={(e) => setRiskPerTrade(e.target.value)}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry-price">Entry Price ($)</Label>
                    <Input
                      id="entry-price"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      placeholder="150.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stop-loss">Stop Loss ($)</Label>
                    <Input
                      id="stop-loss"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="145.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calculation Results</CardTitle>
              </CardHeader>
              <CardContent>
                {calculation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Position Size</Label>
                        <p className="text-2xl font-bold">{calculation.positionSize} shares</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Risk Amount</Label>
                        <p className="text-2xl font-bold text-red-600">${calculation.riskAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Risk Per Share</Label>
                      <p className="text-lg font-semibold">${calculation.riskPerShare.toFixed(2)}</p>
                    </div>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        This position size limits your risk to {riskPerTrade}% of your account balance.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Enter all values to calculate position size</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drawdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Drawdown Analysis
              </CardTitle>
              <CardDescription>Track your portfolio drawdowns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={drawdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-600">-8.1%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Drawdown</p>
                  <p className="text-2xl font-bold text-green-600">-0.9%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Recovery Time</p>
                  <p className="text-2xl font-bold">2 months</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Correlation Matrix</CardTitle>
              <CardDescription>Correlation between your holdings and market indices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationData.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.symbol}</Badge>
                      <span className="font-medium">{item.allocation}% allocation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Correlation:</span>
                      <Badge
                        variant={
                          item.correlation > 0.8 ? "destructive" : item.correlation > 0.6 ? "secondary" : "default"
                        }
                      >
                        {item.correlation.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  High correlation {String.fromCharCode(62)}0.8 with SPY indicates significant market risk exposure.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.42</div>
                <p className="text-xs text-muted-foreground">+0.12 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sortino Ratio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.89</div>
                <p className="text-xs text-muted-foreground">+0.08 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Value at Risk (95%)</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">-$3,240</div>
                <p className="text-xs text-muted-foreground">Daily VaR estimate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Beta</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.87</div>
                <p className="text-xs text-muted-foreground">vs S&P 500</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
