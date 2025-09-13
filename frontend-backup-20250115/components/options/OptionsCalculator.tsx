'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Calculator, 
  Info, 
  ExternalLink,
  Save,
  Plus,
  Settings
} from 'lucide-react'
import { ChainPanel } from './ChainPanel'
import { ManualPanel } from './ManualPanel'
import { Sliders } from './Sliders'
import { GreeksPanel } from './GreeksPanel'
import { PayoffChart } from './PayoffChart'
import { MethodToggle } from './MethodToggle'
import { SettingsDrawer } from './SettingsDrawer'
import { BSInputs, greeksBS, daysToYears, impliedVol } from '@/lib/options/blackscholes'
import { greeksAmerican } from '@/lib/options/american'
import { formatCurrency, formatPercent } from '@/lib/options/format'

export interface CalculatorState {
  S: number // Current stock price
  K: number // Strike price
  DTE: number // Days to expiration
  iv: number // Implied volatility (decimal)
  r: number // Risk-free rate (decimal)
  q: number // Dividend yield (decimal)
  type: 'call' | 'put'
  method: 'bs' | 'american'
  multiplier: number
  symbol?: string
  expiry?: string
}

export interface CalculatorResults {
  price: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  intrinsic: number
  timeValue: number
  breakeven: number
}

export function OptionsCalculator() {
  const [state, setState] = useState<CalculatorState>({
    S: 100,
    K: 100,
    DTE: 30,
    iv: 0.25,
    r: 0.05,
    q: 0.02,
    type: 'call',
    method: 'bs',
    multiplier: 100
  })

  const [mode, setMode] = useState<'contract' | 'manual'>('contract')
  const [perContract, setPerContract] = useState(true)
  const [showPnl, setShowPnl] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [livePriceLinked, setLivePriceLinked] = useState(false)

  // Calculate results
  const results = useMemo((): CalculatorResults => {
    const T = daysToYears(state.DTE)
    
    const inputs: BSInputs = {
      S: state.S,
      K: state.K,
      T,
      iv: state.iv,
      r: state.r,
      q: state.q,
      type: state.type
    }

    const greeks = state.method === 'bs' 
      ? greeksBS(inputs)
      : greeksAmerican(inputs)

    const intrinsic = state.type === 'call' 
      ? Math.max(state.S - state.K, 0)
      : Math.max(state.K - state.S, 0)

    const timeValue = greeks.price - intrinsic

    // Calculate breakeven
    let breakeven: number
    if (state.type === 'call') {
      breakeven = state.K + greeks.price
    } else {
      breakeven = state.K - greeks.price
    }

    return {
      price: greeks.price,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      vega: greeks.vega,
      rho: greeks.rho,
      intrinsic,
      timeValue,
      breakeven
    }
  }, [state])

  // Handle state updates
  const updateState = (updates: Partial<CalculatorState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Handle contract selection from chain
  const handleContractSelect = (contract: any) => {
    setState(prev => ({
      ...prev,
      symbol: contract.symbol,
      type: contract.type,
      strike: contract.strike,
      expiry: contract.expiry,
      iv: contract.impliedVolatility || prev.iv,
      S: contract.underlyingPrice || prev.S
    }))
    setMode('contract')
  }

  // Handle manual input changes
  const handleManualChange = (updates: Partial<CalculatorState>) => {
    updateState(updates)
    setMode('manual')
  }

  // Save scenario
  const handleSaveScenario = async () => {
    try {
      const response = await fetch('/api/options/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state,
          name: `${state.symbol || 'Manual'} ${state.type.toUpperCase()} ${state.K} ${state.expiry || formatDTE(state.DTE)}`
        })
      })

      if (response.ok) {
        // Show success toast
        console.log('Scenario saved successfully')
      }
    } catch (error) {
      console.error('Error saving scenario:', error)
    }
  }

  // Create new trade
  const handleNewTrade = () => {
    const params = new URLSearchParams({
      symbol: state.symbol || '',
      type: state.type,
      strike: state.K.toString(),
      expiry: state.expiry || new Date(Date.now() + state.DTE * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    
    window.open(`/dashboard/add-trade?${params.toString()}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Options Calculator</h1>
            <p className="text-muted-foreground mt-1">
              Real-time pricing and Greeks for equity options
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveScenario}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewTrade}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Trade
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Pricing is theoretical; U.S. equity options are American-style—see{' '}
            <MethodToggle 
              method={state.method} 
              onChange={(method) => updateState({ method })}
            />
            {' '}toggle for method selection.
          </AlertDescription>
        </Alert>

        {/* Main Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Inputs */}
          <div className="space-y-6">
            {/* Mode Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Input Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={mode} onValueChange={(value) => setMode(value as 'contract' | 'manual')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contract">Contract</TabsTrigger>
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="contract" className="mt-4">
                    <ChainPanel
                      onContractSelect={handleContractSelect}
                      selectedSymbol={state.symbol}
                      selectedExpiry={state.expiry}
                      selectedStrike={state.K}
                      selectedType={state.type}
                    />
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-4">
                    <ManualPanel
                      state={state}
                      onChange={handleManualChange}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Sliders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <Sliders
                  state={state}
                  onChange={updateState}
                  livePriceLinked={livePriceLinked}
                  onLivePriceToggle={setLivePriceLinked}
                />
              </CardContent>
            </Card>

            {/* Method Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing Method</CardTitle>
              </CardHeader>
              <CardContent>
                <MethodToggle 
                  method={state.method} 
                  onChange={(method) => updateState({ method })}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Results */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Option Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Theoretical Price</span>
                    <span className="text-2xl font-bold tabular-nums">
                      {formatCurrency(results.price * (perContract ? state.multiplier : 1))}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Intrinsic Value</span>
                      <span className="tabular-nums">
                        {formatCurrency(results.intrinsic * (perContract ? state.multiplier : 1))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time Value</span>
                      <span className="tabular-nums">
                        {formatCurrency(results.timeValue * (perContract ? state.multiplier : 1))}
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Breakeven</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(results.breakeven)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Greeks Panel */}
            <GreeksPanel
              greeks={results}
              perContract={perContract}
              multiplier={state.multiplier}
              onTogglePerContract={setPerContract}
            />
          </div>

          {/* Right Panel - Chart */}
          <div className="space-y-6">
            {/* Payoff Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payoff Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <PayoffChart
                  state={state}
                  results={results}
                  showPnl={showPnl}
                  onTogglePnl={setShowPnl}
                />
              </CardContent>
            </Card>

            {/* Meta Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time to Expiry</span>
                    <span className="tabular-nums">{state.DTE} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Implied Volatility</span>
                    <span className="tabular-nums">{formatPercent(state.iv)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Risk-Free Rate</span>
                    <span className="tabular-nums">{formatPercent(state.r)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dividend Yield</span>
                    <span className="tabular-nums">{formatPercent(state.q)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <Badge variant="outline" className="text-xs">
                      {state.method === 'bs' ? 'Black-Scholes' : 'American'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        state={state}
        onChange={updateState}
      />
    </div>
  )
}

// Helper function for formatting DTE
function formatDTE(days: number): string {
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.round(days / 7)}w`
  return `${Math.round(days / 30)}m`
}
