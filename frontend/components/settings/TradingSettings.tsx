"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

export function TradingSettings() {
  const [autoStopLoss, setAutoStopLoss] = useState(false)
  const [confirmTrades, setConfirmTrades] = useState(true)
  const [riskTolerance, setRiskTolerance] = useState([5])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Trading Preferences</CardTitle>
          <CardDescription>Set your default trading parameters and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Asset Type</Label>
              <Select defaultValue="stocks">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="etfs">ETFs</SelectItem>
                  <SelectItem value="options">Options</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Order Type</Label>
              <Select defaultValue="market">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                  <SelectItem value="stop">Stop Order</SelectItem>
                  <SelectItem value="stop-limit">Stop-Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Position Size (%)</Label>
            <Input type="number" defaultValue="2" min="0.1" max="100" step="0.1" />
            <p className="text-sm text-muted-foreground">Percentage of portfolio to allocate per trade</p>
          </div>

          <Button>Save Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Management</CardTitle>
          <CardDescription>Configure your risk management settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Risk Tolerance Level: {riskTolerance[0]}/10</Label>
              <Slider
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Stop-Loss</Label>
                <p className="text-sm text-muted-foreground">Automatically set stop-loss orders</p>
              </div>
              <Switch checked={autoStopLoss} onCheckedChange={setAutoStopLoss} />
            </div>

            {autoStopLoss && (
              <div className="space-y-2 ml-4">
                <Label>Default Stop-Loss (%)</Label>
                <Input type="number" defaultValue="5" min="1" max="50" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trade Confirmations</Label>
                <p className="text-sm text-muted-foreground">Require confirmation before executing trades</p>
              </div>
              <Switch checked={confirmTrades} onCheckedChange={setConfirmTrades} />
            </div>
          </div>

          <Button>Save Risk Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}
