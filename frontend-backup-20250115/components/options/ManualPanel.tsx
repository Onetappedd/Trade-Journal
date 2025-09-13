'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { CalculatorState } from './OptionsCalculator'

interface ManualPanelProps {
  state: CalculatorState
  onChange: (updates: Partial<CalculatorState>) => void
}

export function ManualPanel({ state, onChange }: ManualPanelProps) {
  const [snapLoading, setSnapLoading] = useState(false)

  // Snap to live price
  const handleSnapToLive = async () => {
    if (!state.symbol) return

    setSnapLoading(true)
    try {
      const response = await fetch(`/api/market/quote?symbol=${state.symbol}`)
      const data = await response.json()

      if (response.ok && data.data) {
        onChange({ S: data.data.price })
      }
    } catch (error) {
      console.error('Error fetching live price:', error)
    } finally {
      setSnapLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Symbol */}
      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol (optional)</Label>
        <div className="flex space-x-2">
          <Input
            id="symbol"
            placeholder="e.g., AAPL"
            value={state.symbol || ''}
            onChange={(e) => onChange({ symbol: e.target.value.toUpperCase() })}
          />
          {state.symbol && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSnapToLive}
              disabled={snapLoading}
            >
              <Zap className={`h-4 w-4 ${snapLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Option Type */}
      <div className="space-y-2">
        <Label>Option Type</Label>
        <Select value={state.type} onValueChange={(value: 'call' | 'put') => onChange({ type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="call">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Call</span>
              </div>
            </SelectItem>
            <SelectItem value="put">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span>Put</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Strike Price */}
      <div className="space-y-2">
        <Label htmlFor="strike">Strike Price ($)</Label>
        <Input
          id="strike"
          type="number"
          step="0.01"
          min="0"
          value={state.K}
          onChange={(e) => onChange({ K: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {/* Expiration Date */}
      <div className="space-y-2">
        <Label htmlFor="expiry">Expiration Date</Label>
        <Input
          id="expiry"
          type="date"
          value={state.expiry || ''}
          onChange={(e) => onChange({ expiry: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <Separator />

      {/* Market Parameters */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-3">Market Parameters</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Current Stock Price */}
            <div className="space-y-2">
              <Label htmlFor="stock-price">Stock Price ($)</Label>
              <Input
                id="stock-price"
                type="number"
                step="0.01"
                min="0"
                value={state.S}
                onChange={(e) => onChange({ S: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Implied Volatility */}
            <div className="space-y-2">
              <Label htmlFor="iv">Implied Volatility (%)</Label>
              <Input
                id="iv"
                type="number"
                step="0.1"
                min="0"
                max="500"
                value={(state.iv * 100).toFixed(1)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  onChange({ iv: value / 100 })
                }}
              />
            </div>

            {/* Risk-Free Rate */}
            <div className="space-y-2">
              <Label htmlFor="risk-free">Risk-Free Rate (%)</Label>
              <Input
                id="risk-free"
                type="number"
                step="0.01"
                min="0"
                max="20"
                value={(state.r * 100).toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  onChange({ r: value / 100 })
                }}
              />
            </div>

            {/* Dividend Yield */}
            <div className="space-y-2">
              <Label htmlFor="dividend">Dividend Yield (%)</Label>
              <Input
                id="dividend"
                type="number"
                step="0.01"
                min="0"
                max="20"
                value={(state.q * 100).toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  onChange({ q: value / 100 })
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-3">Contract Details</h4>
          
          <div className="space-y-2">
            <Label htmlFor="multiplier">Contract Multiplier</Label>
            <Input
              id="multiplier"
              type="number"
              step="1"
              min="1"
              value={state.multiplier}
              onChange={(e) => onChange({ multiplier: parseInt(e.target.value) || 100 })}
            />
            <p className="text-xs text-muted-foreground">
              Standard equity options have a multiplier of 100 shares per contract
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-3">Quick Presets</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({
                S: 100,
                K: 100,
                DTE: 30,
                iv: 0.25,
                r: 0.05,
                q: 0.02
              })}
            >
              ATM 30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({
                S: 100,
                K: 110,
                DTE: 30,
                iv: 0.20,
                r: 0.05,
                q: 0.02
              })}
            >
              OTM 30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({
                S: 100,
                K: 90,
                DTE: 30,
                iv: 0.30,
                r: 0.05,
                q: 0.02
              })}
            >
              ITM 30d
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({
                S: 100,
                K: 100,
                DTE: 7,
                iv: 0.35,
                r: 0.05,
                q: 0.02
              })}
            >
              Weekly
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
