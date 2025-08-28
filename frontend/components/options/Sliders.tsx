'use client'

import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Link, Link2Off } from 'lucide-react'
import { CalculatorState } from './OptionsCalculator'

interface SlidersProps {
  state: CalculatorState
  onChange: (updates: Partial<CalculatorState>) => void
  livePriceLinked: boolean
  onLivePriceToggle: (linked: boolean) => void
}

export function Sliders({ 
  state, 
  onChange, 
  livePriceLinked, 
  onLivePriceToggle 
}: SlidersProps) {
  const [localS, setLocalS] = useState(state.S)
  const [localDTE, setLocalDTE] = useState(state.DTE)
  const [localIV, setLocalIV] = useState(state.iv)

  // Update local state when props change
  useEffect(() => {
    setLocalS(state.S)
  }, [state.S])

  useEffect(() => {
    setLocalDTE(state.DTE)
  }, [state.DTE])

  useEffect(() => {
    setLocalIV(state.iv)
  }, [state.iv])

  // Handle stock price slider
  const handleStockPriceChange = (value: number[]) => {
    const newPrice = value[0]
    setLocalS(newPrice)
    onChange({ S: newPrice })
  }

  // Handle stock price input
  const handleStockPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setLocalS(value)
  }

  const handleStockPriceBlur = () => {
    onChange({ S: localS })
  }

  // Handle DTE slider
  const handleDTEChange = (value: number[]) => {
    const newDTE = value[0]
    setLocalDTE(newDTE)
    onChange({ DTE: newDTE })
  }

  // Handle DTE input
  const handleDTEInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setLocalDTE(value)
  }

  const handleDTEBlur = () => {
    onChange({ DTE: localDTE })
  }

  // Handle IV slider
  const handleIVChange = (value: number[]) => {
    const newIV = value[0] / 100 // Convert percentage to decimal
    setLocalIV(newIV)
    onChange({ iv: newIV })
  }

  // Handle IV input
  const handleIVInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setLocalIV(value / 100)
  }

  const handleIVBlur = () => {
    onChange({ iv: localIV })
  }

  // Live price streaming
  useEffect(() => {
    if (!livePriceLinked || !state.symbol) return

    let interval: NodeJS.Timeout

    const streamPrice = async () => {
      try {
        const response = await fetch(`/api/market/quote?symbol=${state.symbol}`)
        const data = await response.json()

        if (response.ok && data.data) {
          onChange({ S: data.data.price })
        }
      } catch (error) {
        console.error('Error streaming price:', error)
      }
    }

    // Initial fetch
    streamPrice()

    // Set up polling
    interval = setInterval(streamPrice, 2000)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [livePriceLinked, state.symbol, onChange])

  return (
    <div className="space-y-6">
      {/* Stock Price Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Underlying Price</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={livePriceLinked}
              onCheckedChange={onLivePriceToggle}
              disabled={!state.symbol}
            />
            <Label className="text-xs text-muted-foreground">
              {livePriceLinked ? 'Live' : 'Manual'}
            </Label>
            {livePriceLinked ? (
              <Link className="h-3 w-3 text-green-600" />
            ) : (
              <Link2Off className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            value={[localS]}
            onValueChange={handleStockPriceChange}
            min={Math.max(0, state.K * 0.5)}
            max={state.K * 2}
            step={0.01}
            disabled={livePriceLinked}
            className="w-full"
          />
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={localS.toFixed(2)}
              onChange={handleStockPriceInput}
              onBlur={handleStockPriceBlur}
              disabled={livePriceLinked}
              className="w-20"
              step="0.01"
            />
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
        </div>

        {livePriceLinked && !state.symbol && (
          <p className="text-xs text-amber-600">
            Enter a symbol in manual mode to enable live price streaming
          </p>
        )}
      </div>

      <Separator />

      {/* Days to Expiration Slider */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Days to Expiration</Label>
        
        <div className="space-y-2">
          <Slider
            value={[localDTE]}
            onValueChange={handleDTEChange}
            min={1}
            max={365}
            step={1}
            className="w-full"
          />
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={localDTE}
              onChange={handleDTEInput}
              onBlur={handleDTEBlur}
              className="w-20"
              min="1"
              max="365"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        {/* DTE Presets */}
        <div className="flex flex-wrap gap-2">
          {[1, 7, 30, 60, 90, 180, 365].map((days) => (
            <Button
              key={days}
              variant="outline"
              size="sm"
              onClick={() => onChange({ DTE: days })}
              className="text-xs"
            >
              {days === 1 ? '1d' : days === 7 ? '1w' : days === 30 ? '1m' : 
               days === 60 ? '2m' : days === 90 ? '3m' : days === 180 ? '6m' : '1y'}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Implied Volatility Slider */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Implied Volatility</Label>
        
        <div className="space-y-2">
          <Slider
            value={[localIV * 100]}
            onValueChange={handleIVChange}
            min={5}
            max={150}
            step={0.1}
            className="w-full"
          />
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={(localIV * 100).toFixed(1)}
              onChange={handleIVInput}
              onBlur={handleIVBlur}
              className="w-20"
              min="5"
              max="150"
              step="0.1"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* IV Presets */}
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30, 40, 50, 60, 80, 100].map((iv) => (
            <Button
              key={iv}
              variant="outline"
              size="sm"
              onClick={() => onChange({ iv: iv / 100 })}
              className="text-xs"
            >
              {iv}%
            </Button>
          ))}
        </div>

        {/* IV Warning */}
        {localIV > 1 && (
          <p className="text-xs text-amber-600">
            Very high IV detected. Consider market conditions.
          </p>
        )}
      </div>

      <Separator />

      {/* Moneyness Indicator */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Moneyness</span>
            <div className="flex items-center space-x-2">
              {state.type === 'call' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {state.S > state.K ? 'ITM' : state.S < state.K ? 'OTM' : 'ATM'}
              </span>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            {state.S > state.K 
              ? `${state.type === 'call' ? 'In-the-money' : 'Out-of-the-money'} by $${Math.abs(state.S - state.K).toFixed(2)}`
              : state.S < state.K
              ? `${state.type === 'call' ? 'Out-of-the-money' : 'In-the-money'} by $${Math.abs(state.S - state.K).toFixed(2)}`
              : 'At-the-money'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
