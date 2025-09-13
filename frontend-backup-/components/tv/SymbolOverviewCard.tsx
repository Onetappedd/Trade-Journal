'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import TradingView widget with SSR disabled
const TradingViewWidget = dynamic(
  () => import('react-ts-tradingview-widgets').then((mod) => mod.SymbolOverview),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    )
  }
)

interface SymbolOverviewCardProps {
  symbol: string
  className?: string
  theme?: 'light' | 'dark'
}

export function SymbolOverviewCard({ symbol, className, theme = 'dark' }: SymbolOverviewCardProps) {
  const [key, setKey] = useState(0) // For re-rendering when theme or symbol changes

  // Re-render widget when theme or symbol changes
  useEffect(() => {
    setKey(prev => prev + 1)
  }, [theme, symbol])

  console.log('SymbolOverviewCard mounting with symbol:', symbol, 'theme:', theme)

  return (
    <div className={`w-full h-32 ${className || ''}`}>
      <TradingViewWidget
        key={key}
        symbols={[[symbol]]}
        dateFormat="MMM dd, yyyy"
        locale="en"
        autosize
        container_id={`tradingview-overview-${symbol}`}
        colorTheme={theme}
        isTransparent={false}

        chartType="area"
        scalePosition="right"
        scaleMode="Normal"
        fontFamily="Trebuchet MS, sans-serif"
        fontSize="10"
        noTimeScale={false}
        valuesTracking="0"

        width="100%"
        height="100%"
      />
    </div>
  )
}
