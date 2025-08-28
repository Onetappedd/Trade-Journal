'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamically import TradingView widget with SSR disabled
const TradingViewWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then((mod) => mod.AdvancedRealTimeChart),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-muted rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading TradingView Screener...</p>
        </div>
      </div>
    )
  }
)

interface ScreenerPanelProps {
  symbol?: string
  onSymbolSelect?: (symbol: string) => void
  className?: string
  theme?: 'light' | 'dark'
}

export function ScreenerPanel({ symbol, onSymbolSelect, className, theme = 'dark' }: ScreenerPanelProps) {
  const [key, setKey] = useState(0) // For re-rendering when theme changes

  // Re-render widget when theme changes
  useEffect(() => {
    setKey(prev => prev + 1)
  }, [theme])

  console.log('ScreenerPanel mounting with symbol:', symbol, 'theme:', theme)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">TradingView Screener (Live)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[650px]">
          <TradingViewWidget
            key={key}
            symbol={symbol || 'NASDAQ:AAPL'}
            theme={theme}
            locale="en"
            autosize
            interval="D"
            timezone="America/New_York"
            style="1"
            toolbar_bg="#f1f3f6"
            enable_publishing={false}
            allow_symbol_change={true}
            container_id="tradingview-screener"
            studies={[
              'RSI@tv-basicstudies',
              'MASimple@tv-basicstudies'
            ]}
            show_popup_button={true}
            popup_width="1000"
            popup_height="650"
            disabled_features={[
              'use_localstorage_for_settings',
              'volume_force_overlay'
            ]}
            enabled_features={[
              'study_templates'
            ]}
          />
        </div>
      </CardContent>
    </Card>
  )
}
