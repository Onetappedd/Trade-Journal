"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, TrendingUp, TrendingDown } from "lucide-react"

const alerts = [
  {
    id: "1",
    symbol: "AAPL",
    type: "above",
    price: 160.0,
    currentPrice: 155.3,
    status: "active",
  },
  {
    id: "2",
    symbol: "TSLA",
    type: "below",
    price: 200.0,
    currentPrice: 215.75,
    status: "active",
  },
  {
    id: "3",
    symbol: "MSFT",
    type: "above",
    price: 320.0,
    currentPrice: 318.9,
    status: "triggered",
  },
]

export function AlertsPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Price Alerts</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Alert
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter((alert) => alert.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Currently monitoring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter((alert) => alert.status === "triggered").length}</div>
            <p className="text-xs text-muted-foreground">Alerts triggered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Alerts</CardTitle>
          <CardDescription>Manage your price alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2">
                    {alert.type === "above" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-semibold">{alert.symbol}</h3>
                      <p className="text-sm text-muted-foreground">
                        Alert when {alert.type} ${alert.price}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${alert.currentPrice}</div>
                  <p className="text-sm text-muted-foreground">Current price</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.status === "active" ? "default" : "secondary"}>{alert.status}</Badge>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
