'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ScreenerPanelProps {
  symbol?: string
  onSymbolSelect?: (symbol: string) => void
  className?: string
}

declare global {
  interface Window {
    TradingView: any
  }
}

export function ScreenerPanel({ symbol, onSymbolSelect, className }: ScreenerPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = initWidget
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
      if (widgetRef.current) {
        widgetRef.current.remove()
      }
    }
  }, [])

  const initWidget = () => {
    if (!containerRef.current || !window.TradingView) return

    widgetRef.current = new window.TradingView.widget({
      container: containerRef.current,
      symbol: symbol || 'NASDAQ:AAPL',
      interval: 'D',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: containerRef.current.id,
      width: '100%',
      height: '100%',
      studies: [
        'RSI@tv-basicstudies',
        'MASimple@tv-basicstudies'
      ],
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      disabled_features: [
        'use_localstorage_for_settings',
        'volume_force_overlay'
      ],
      enabled_features: [
        'study_templates'
      ],
      overrides: {
        'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350'
      }
    })

    // Listen for symbol changes
    if (onSymbolSelect) {
      widgetRef.current.onChartReady(() => {
        widgetRef.current.chart().onSymbolChanged().subscribe(
          null,
          (symbolInfo: any) => {
            if (symbolInfo && symbolInfo.symbol) {
              onSymbolSelect(symbolInfo.symbol)
            }
          }
        )
      })
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Market Screener</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          id="tradingview-screener"
          className="w-full h-96"
        />
      </CardContent>
    </Card>
  )
}
