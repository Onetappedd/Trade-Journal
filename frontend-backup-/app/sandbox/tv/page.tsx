'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScreenerPanel } from '@/components/tv/ScreenerPanel'
import { SymbolOverviewCard } from '@/components/tv/SymbolOverviewCard'

export default function TradingViewSandbox() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')

  const testSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL']

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">TradingView Widget Sandbox</h1>
          <Button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="outline"
          >
            Toggle Theme ({theme})
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Symbol Overview Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Symbol Overview Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testSymbols.map((symbol) => (
                <div key={symbol} className="flex items-center space-x-4">
                  <Button
                    variant={selectedSymbol === symbol ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSymbol(symbol)}
                  >
                    {symbol}
                  </Button>
                  <div className="flex-1">
                    <SymbolOverviewCard 
                      symbol={symbol} 
                      theme={theme}
                      className="h-20"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Selected Symbol Details */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Symbol: {selectedSymbol}</CardTitle>
            </CardHeader>
            <CardContent>
              <SymbolOverviewCard 
                symbol={selectedSymbol} 
                theme={theme}
                className="h-32"
              />
            </CardContent>
          </Card>
        </div>

        {/* TradingView Screener */}
        <Card>
          <CardHeader>
            <CardTitle>TradingView Screener (Full Size)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenerPanel 
              symbol={selectedSymbol}
              onSymbolSelect={setSelectedSymbol}
              theme={theme}
            />
          </CardContent>
        </Card>

        {/* Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Current Theme:</strong> {theme}</p>
              <p><strong>Selected Symbol:</strong> {selectedSymbol}</p>
              <p><strong>Test Symbols:</strong> {testSymbols.join(', ')}</p>
              <p><strong>Page URL:</strong> /sandbox/tv</p>
              <p className="text-muted-foreground">
                Check browser console for widget mounting logs and Network tab for TradingView script loading.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
