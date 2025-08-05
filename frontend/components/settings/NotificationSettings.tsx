"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState({
    tradeExecutions: true,
    priceAlerts: true,
    marketNews: false,
    weeklyReports: true,
    accountUpdates: true,
  })

  const [pushNotifications, setPushNotifications] = useState({
    tradeExecutions: true,
    priceAlerts: true,
    riskAlerts: true,
    marketOpen: false,
  })

  const updateEmailNotification = (key: keyof typeof emailNotifications, value: boolean) => {
    setEmailNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const updatePushNotification = (key: keyof typeof pushNotifications, value: boolean) => {
    setPushNotifications((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose what email notifications you'd like to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Trade Executions</Label>
              <p className="text-sm text-muted-foreground">Get notified when your trades are executed</p>
            </div>
            <Switch
              checked={emailNotifications.tradeExecutions}
              onCheckedChange={(value) => updateEmailNotification("tradeExecutions", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Price Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive alerts when price targets are hit</p>
            </div>
            <Switch
              checked={emailNotifications.priceAlerts}
              onCheckedChange={(value) => updateEmailNotification("priceAlerts", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Market News</Label>
              <p className="text-sm text-muted-foreground">Daily market news and analysis</p>
            </div>
            <Switch
              checked={emailNotifications.marketNews}
              onCheckedChange={(value) => updateEmailNotification("marketNews", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Weekly performance and portfolio summaries</p>
            </div>
            <Switch
              checked={emailNotifications.weeklyReports}
              onCheckedChange={(value) => updateEmailNotification("weeklyReports", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Account Updates</Label>
              <p className="text-sm text-muted-foreground">Important account and security updates</p>
            </div>
            <Switch
              checked={emailNotifications.accountUpdates}
              onCheckedChange={(value) => updateEmailNotification("accountUpdates", value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Manage your mobile and browser push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Trade Executions</Label>
              <p className="text-sm text-muted-foreground">Instant notifications for trade executions</p>
            </div>
            <Switch
              checked={pushNotifications.tradeExecutions}
              onCheckedChange={(value) => updatePushNotification("tradeExecutions", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Price Alerts</Label>
              <p className="text-sm text-muted-foreground">Real-time price movement alerts</p>
            </div>
            <Switch
              checked={pushNotifications.priceAlerts}
              onCheckedChange={(value) => updatePushNotification("priceAlerts", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Risk Alerts</Label>
              <p className="text-sm text-muted-foreground">Notifications for risk threshold breaches</p>
            </div>
            <Switch
              checked={pushNotifications.riskAlerts}
              onCheckedChange={(value) => updatePushNotification("riskAlerts", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Market Open</Label>
              <p className="text-sm text-muted-foreground">Daily market open notifications</p>
            </div>
            <Switch
              checked={pushNotifications.marketOpen}
              onCheckedChange={(value) => updatePushNotification("marketOpen", value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save Notification Settings</Button>
      </div>
    </div>
  )
}
