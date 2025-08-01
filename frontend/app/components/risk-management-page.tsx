"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, TrendingDown, Target, DollarSign } from "lucide-react"

export function RiskManagementPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Risk Management</h2>
        <Badge variant="outline" className="text-green-600">
          <Shield className="mr-1 h-3 w-3" />
          Low Risk
        </Badge>
      </div>

      {/* Risk Alerts */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your position in TSLA exceeds 15% of your portfolio. Consider reducing exposure.
        </AlertDescription>
      </Alert>

      {/* Risk Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Risk</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Low</div>
            <Progress value={25} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">25% risk level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-8.5%</div>
            <p className="text-xs text-muted-foreground">Largest peak-to-trough decline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value at Risk</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,450</div>
            <p className="text-xs text-muted-foreground">95% confidence, 1-day VaR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1.85</div>
            <p className="text-xs text-muted-foreground">Risk-adjusted returns</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Position Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Position Risk Analysis</CardTitle>
            <CardDescription>Risk breakdown by individual positions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { symbol: "AAPL", allocation: 18.5, risk: "Low", beta: 1.2 },
              { symbol: "TSLA", allocation: 15.8, risk: "High", beta: 2.1 },
              { symbol: "MSFT", allocation: 22.3, risk: "Medium", beta: 0.9 },
              { symbol: "GOOGL", allocation: 43.4, risk: "Medium", beta: 1.1 },
            ].map((position) => (
              <div key={position.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium">{position.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {position.allocation}% allocation • β {position.beta}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      position.risk === "Low" ? "secondary" : position.risk === "Medium" ? "outline" : "destructive"
                    }
                  >
                    {position.risk}
                  </Badge>
                  <Progress value={position.allocation} className="w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Limits & Controls</CardTitle>
            <CardDescription>Set and monitor your risk parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Max Position Size</span>
                <span className="text-sm">20%</span>
              </div>
              <Progress value={75} />
              <p className="text-xs text-muted-foreground">Current max: 15% (TSLA)</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily Loss Limit</span>
                <span className="text-sm">$5,000</span>
              </div>
              <Progress value={30} />
              <p className="text-xs text-muted-foreground">Today's loss: $1,500</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Portfolio Beta</span>
                <span className="text-sm">1.15</span>
              </div>
              <Progress value={57.5} />
              <p className="text-xs text-muted-foreground">Target: 1.0 - 1.5</p>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full bg-transparent">
                Update Risk Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Stress Test Scenarios</CardTitle>
          <CardDescription>Portfolio performance under various market conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-red-600">Market Crash (-20%)</h4>
              <p className="text-2xl font-bold text-red-600 mt-2">-$17,450</p>
              <p className="text-sm text-muted-foreground">Estimated portfolio loss</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-yellow-600">Recession (-10%)</h4>
              <p className="text-2xl font-bold text-yellow-600 mt-2">-$8,725</p>
              <p className="text-sm text-muted-foreground">Estimated portfolio loss</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-600">Volatility Spike</h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">+15%</p>
              <p className="text-sm text-muted-foreground">VaR increase</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
