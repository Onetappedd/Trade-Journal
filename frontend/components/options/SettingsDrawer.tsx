'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalculatorState } from './OptionsCalculator'

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: CalculatorState
  onChange: (updates: Partial<CalculatorState>) => void
}

interface UserPrefs {
  defaultRiskFree: number
  defaultDividendYield: number
  defaultMultiplier: number
  sliderRanges: {
    priceRange: number
    dteRange: number
    ivRange: number
  }
}

export function SettingsDrawer({
  open,
  onOpenChange,
  state,
  onChange
}: SettingsDrawerProps) {
  const [prefs, setPrefs] = useState<UserPrefs>({
    defaultRiskFree: 0.05,
    defaultDividendYield: 0.02,
    defaultMultiplier: 100,
    sliderRanges: {
      priceRange: 0.4,
      dteRange: 365,
      ivRange: 150
    }
  })

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('options-calculator-prefs')
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs)
        setPrefs(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const savePrefs = (newPrefs: Partial<UserPrefs>) => {
    const updatedPrefs = { ...prefs, ...newPrefs }
    setPrefs(updatedPrefs)
    localStorage.setItem('options-calculator-prefs', JSON.stringify(updatedPrefs))
  }

  // Apply defaults
  const applyDefaults = () => {
    onChange({
      r: prefs.defaultRiskFree,
      q: prefs.defaultDividendYield,
      multiplier: prefs.defaultMultiplier
    })
  }

  // Reset to defaults
  const resetToDefaults = () => {
    const defaultPrefs: UserPrefs = {
      defaultRiskFree: 0.05,
      defaultDividendYield: 0.02,
      defaultMultiplier: 100,
      sliderRanges: {
        priceRange: 0.4,
        dteRange: 365,
        ivRange: 150
      }
    }
    savePrefs(defaultPrefs)
    applyDefaults()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Calculator Settings</DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 space-y-6">
            {/* Default Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Default Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-risk-free">Default Risk-Free Rate (%)</Label>
                  <Input
                    id="default-risk-free"
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={(prefs.defaultRiskFree * 100).toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      savePrefs({ defaultRiskFree: value / 100 })
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-dividend">Default Dividend Yield (%)</Label>
                  <Input
                    id="default-dividend"
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={(prefs.defaultDividendYield * 100).toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      savePrefs({ defaultDividendYield: value / 100 })
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-multiplier">Default Contract Multiplier</Label>
                  <Input
                    id="default-multiplier"
                    type="number"
                    step="1"
                    min="1"
                    value={prefs.defaultMultiplier}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 100
                      savePrefs({ defaultMultiplier: value })
                    }}
                  />
                </div>
                
                <Button onClick={applyDefaults} className="w-full">
                  Apply to Current Calculation
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Slider Ranges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Slider Ranges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price-range">Price Range (±%)</Label>
                  <Input
                    id="price-range"
                    type="number"
                    step="5"
                    min="10"
                    max="100"
                    value={(prefs.sliderRanges.priceRange * 100).toFixed(0)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 40
                      savePrefs({
                        sliderRanges: {
                          ...prefs.sliderRanges,
                          priceRange: value / 100
                        }
                      })
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dte-range">DTE Range (days)</Label>
                  <Input
                    id="dte-range"
                    type="number"
                    step="30"
                    min="30"
                    max="730"
                    value={prefs.sliderRanges.dteRange}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 365
                      savePrefs({
                        sliderRanges: {
                          ...prefs.sliderRanges,
                          dteRange: value
                        }
                      })
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="iv-range">IV Range (%)</Label>
                  <Input
                    id="iv-range"
                    type="number"
                    step="10"
                    min="50"
                    max="500"
                    value={prefs.sliderRanges.ivRange}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 150
                      savePrefs({
                        sliderRanges: {
                          ...prefs.sliderRanges,
                          ivRange: value
                        }
                      })
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Current Values */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk-Free Rate:</span>
                  <span className="font-mono">{(state.r * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividend Yield:</span>
                  <span className="font-mono">{(state.q * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Multiplier:</span>
                  <span className="font-mono">{state.multiplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pricing Method:</span>
                  <span className="font-mono">
                    {state.method === 'bs' ? 'Black-Scholes' : 'American'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={resetToDefaults}
                className="flex-1"
              >
                Reset to Defaults
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
