"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Volume2,
  Target,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

// Mock alerts data
const activeAlerts = [
  {
    id: 1,
    symbol: "AAPL",
    type: "price",
    condition: "above",
    targetValue: 185.0,
    currentValue: 182.25,
    isActive: true,
    createdAt: "2023-12-01",
    triggeredAt: null,
    message: "AAPL price alert",
  },
  {
    id: 2,
    symbol: "NVDA",
    type: "price",
    condition: "below",
    targetValue: 440.0,
    currentValue: 445.8,
    isActive: true,
    createdAt: "2023-11-28",
    triggeredAt: null,
    message: "NVDA support level",
  },
  {
    id: 3,
    symbol: "TSLA",
    type: "volume",
    condition: "above",
    targetValue: 50000000,
    currentValue: 35000000,
    isActive: true,
    createdAt: "2023-11-25",
    triggeredAt: null,
    message: "TSLA unusual volume",
  },
  {
    id: 4,
    symbol: "SPY",
    type: "price",
    condition: "below",
    targetValue: 430.0,
    currentValue: 432.15,
    isActive: false,
    createdAt: "2023-11-20",
    triggeredAt: "2023-11-22",
    message: "SPY breakdown alert",
  },
]

const recentTriggers = [
  {
    id: 5,
    symbol: "QQQ",
    type: "price",
    condition: "above",
    targetValue: 380.0,
    triggeredValue: 380.25,
    triggeredAt: "2023-12-01 10:30 AM",
    message: "QQQ breakout confirmed",
  },
  {
    id: 6,
    symbol: "MSFT",
    type: "price",
    condition: "below",
    targetValue: 360.0,
    triggeredValue: 359.75,
    triggeredAt: "2023-11-30 2:15 PM",
    message: "MSFT support broken",
  },
]

export default function PriceAlerts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    symbol: "",
    type: "price",
    condition: "above",
    targetValue: "",
    message: "",
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price":
        return <Target className="h-4 w-4" />
      case "volume":
        return <Volume2 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getConditionIcon = (condition: string) => {
    return condition === "above" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  const getAlertStatus = (alert: any) => {
    if (!alert.isActive && alert.triggeredAt) {
      return { status: "triggered", color: "text-green-600", icon: CheckCircle }
    }
    if (alert.isActive) {
      const isClose =
        alert.type === "price"
          ? Math.abs(alert.currentValue - alert.targetValue) / alert.targetValue < 0.02
          : Math.abs(alert.currentValue - alert.targetValue) / alert.targetValue < 0.1

      if (isClose) {
        return { status: "close", color: "text-yellow-600", icon: AlertTriangle }
      }
      return { status: "active", color: "text-blue-600", icon: Bell }
    }
    return { status: "inactive", color: "text-gray-600", icon: Bell }
  }

  const createAlert = () => {
    // Mock create alert functionality
    console.log("Creating alert:", newAlert)
    setIsCreateDialogOpen(false)
    setNewAlert({
      symbol: "",
      type: "price",
      condition: "above",
      targetValue: "",
      message: "",
    })
  }

  const deleteAlert = (id: number) => {
    console.log("Deleting alert:", id)
  }

  const toggleAlert = (id: number) => {
    console.log("Toggling alert:", id)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price Alerts</h1>
          <p className="text-muted-foreground">Set up custom alerts for price and volume changes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
              <DialogDescription>Set up a custom alert for price or volume changes</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., AAPL"
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select value={newAlert.type} onValueChange={(value) => setNewAlert({ ...newAlert, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price Alert</SelectItem>
                    <SelectItem value="volume">Volume Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    step={newAlert.type === "price" ? "0.01" : "1000"}
                    placeholder={newAlert.type === "price" ? "0.00" : "1000000"}
                    value={newAlert.targetValue}
                    onChange={(e) => setNewAlert({ ...newAlert, targetValue: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  placeholder="Custom alert message"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createAlert}>Create Alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.filter((alert) => alert.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Currently monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Alerts triggered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Close to Target</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Within 2% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">All time created</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="triggered">Recent Triggers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Price Alerts</CardTitle>
              <CardDescription>Your currently active alerts and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAlerts.map((alert) => {
                    const status = getAlertStatus(alert)
                    const StatusIcon = status.icon

                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge variant="outline">{alert.symbol}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAlertIcon(alert.type)}
                            <span className="capitalize">{alert.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getConditionIcon(alert.condition)}
                            <span className="capitalize">{alert.condition}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.type === "price" ? formatCurrency(alert.targetValue) : formatVolume(alert.targetValue)}
                        </TableCell>
                        <TableCell>
                          {alert.type === "price"
                            ? formatCurrency(alert.currentValue)
                            : formatVolume(alert.currentValue)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            <span className={`capitalize ${status.color}`}>{status.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={alert.isActive} onCheckedChange={() => toggleAlert(alert.id)} />
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggered" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Triggered Alerts</CardTitle>
              <CardDescription>Alerts that have been triggered in the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTriggers.map((trigger) => (
                  <div key={trigger.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{trigger.symbol}</Badge>
                        <div className="flex items-center gap-2">
                          {getAlertIcon(trigger.type)}
                          <span className="text-sm capitalize">{trigger.type} Alert</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getConditionIcon(trigger.condition)}
                          <span className="text-sm capitalize">{trigger.condition}</span>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Triggered
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Target</div>
                        <div className="font-medium">
                          {trigger.type === "price"
                            ? formatCurrency(trigger.targetValue)
                            : formatVolume(trigger.targetValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Triggered At</div>
                        <div className="font-medium">
                          {trigger.type === "price"
                            ? formatCurrency(trigger.triggeredValue)
                            : formatVolume(trigger.triggeredValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time</div>
                        <div className="font-medium">{trigger.triggeredAt}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Message</div>
                        <div className="font-medium">{trigger.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
              <CardDescription>Configure how you receive alert notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive alert notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive SMS alerts for critical price movements</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Default Alert Settings</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-type">Default Alert Type</Label>
                    <Select defaultValue="price">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price Alert</SelectItem>
                        <SelectItem value="volume">Volume Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default-condition">Default Condition</Label>
                    <Select defaultValue="above">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-alerts">Maximum Active Alerts</Label>
                <Select defaultValue="50">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 alerts</SelectItem>
                    <SelectItem value="50">50 alerts</SelectItem>
                    <SelectItem value="100">100 alerts</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
