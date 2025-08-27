'use client'

import { useEffect, useRef } from 'react'

interface SymbolOverviewCardProps {
  symbol: string
  className?: string
}

declare global {
  interface Window {
    TradingView: any
  }
}

export function SymbolOverviewCard({ symbol, className }: SymbolOverviewCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    // Load TradingView widget script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = initWidget
      document.head.appendChild(script)
    } else {
      initWidget()
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove()
      }
    }
  }, [symbol])

  const initWidget = () => {
    if (!containerRef.current || !window.TradingView) return

    widgetRef.current = new window.TradingView.widget({
      container: containerRef.current,
      symbol: symbol,
      interval: 'D',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_top_toolbar: true,
      hide_legend: true,
      save_image: false,
      container_id: containerRef.current.id,
      width: '100%',
      height: '100%',
      studies: [],
      disabled_features: [
        'use_localstorage_for_settings',
        'volume_force_overlay',
        'header_symbol_search',
        'header_compare',
        'header_settings',
        'header_fullscreen_button',
        'header_screenshot',
        'header_chart_type',
        'header_indicators',
        'header_undo_redo',
        'header_saveload',
        'left_toolbar',
        'control_bar',
        'timeframes_toolbar',
        'edit_buttons_in_legend',
        'context_menus',
        'border_around_the_chart',
        'header_resolutions',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'header_indicators_dialog_button',
        'show_indicators_dialog_on_key_press',
        'symbol_info',
        'volume',
        'trading_notifications',
        'header_chart_type',
        'header_compare',
        'header_settings',
        'header_fullscreen_button',
        'header_screenshot',
        'header_indicators',
        'header_undo_redo',
        'header_saveload',
        'left_toolbar',
        'control_bar',
        'timeframes_toolbar',
        'edit_buttons_in_legend',
        'context_menus',
        'border_around_the_chart',
        'header_resolutions',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'header_indicators_dialog_button',
        'show_indicators_dialog_on_key_press',
        'symbol_info',
        'volume',
        'trading_notifications'
      ],
      enabled_features: [
        'hide_left_toolbar_by_default'
      ],
      overrides: {
        'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
        'mainSeriesProperties.candleStyle.upColor': '#26a69a',
        'mainSeriesProperties.candleStyle.downColor': '#ef5350',
        'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350'
      }
    })
  }

  return (
    <div 
      ref={containerRef}
      id={`tradingview-overview-${symbol}`}
      className={`w-full h-32 ${className || ''}`}
    />
  )
}
