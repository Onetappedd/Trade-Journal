"use client"

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import type { PolygonSnapshot, PolygonMarketMover, PolygonAggregateBar, PolygonNewsItem } from '@/lib/polygon-api'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }
  return response.json()
}

// Hook for market movers (gainers/losers)
export function useMarketMovers(refreshInterval: number = 30000) {
  const { data, error, isLoading, mutate } = useSWR<{
    gainers: PolygonMarketMover[]
    losers: PolygonMarketMover[]
    mostActive: PolygonSnapshot[]
    trending: any[]
  }>(
    '/api/polygon/trending',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 15000,
    }
  )

  return {
    gainers: data?.gainers || [],
    losers: data?.losers || [],
    mostActive: data?.mostActive || [],
    trending: data?.trending || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook for single ticker snapshot
export function useTickerSnapshot(ticker: string, refreshInterval: number = 15000) {
  const { data, error, isLoading, mutate } = useSWR<PolygonSnapshot>(
    ticker ? `/api/polygon/snapshot/${ticker}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  return {
    snapshot: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook for historical data with candlestick charts
export function useHistoricalData(
  ticker: string,
  timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day',
  multiplier: number = 1,
  from?: string,
  to?: string
) {
  // Default to last 30 days if no dates provided
  const defaultFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const defaultTo = to || new Date().toISOString().split('T')[0]
  
  const { data, error, isLoading, mutate } = useSWR<{
    ticker: string
    timespan: string
    multiplier: number
    from: string
    to: string
    results: PolygonAggregateBar[]
  }>(
    ticker ? `/api/polygon/historical/${ticker}?timespan=${timespan}&multiplier=${multiplier}&from=${defaultFrom}&to=${defaultTo}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  // Transform data for chart libraries
  const chartData = data?.results?.map(bar => ({
    date: new Date(bar.t).toISOString(),
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
    vwap: bar.vw,
    transactions: bar.n
  })) || []

  return {
    data: data?.results || [],
    chartData,
    ticker: data?.ticker,
    timespan: data?.timespan,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook for ticker search
export function useTickerSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{
    symbol: string
    name: string
    type: string
    exchange: string
    currency: string
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 1) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/polygon/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [query, search])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search,
  }
}

// Hook for ticker news
export function useTickerNews(ticker: string, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<PolygonNewsItem[]>(
    ticker ? `/api/polygon/news/${ticker}?limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  )

  return {
    news: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook for real-time price updates
export function useRealTimePrice(ticker: string, refreshInterval: number = 5000) {
  const { data, error, isLoading, mutate } = useSWR<PolygonSnapshot>(
    ticker ? `/api/polygon/snapshot/${ticker}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  )

  const price = data?.value || data?.day?.c || 0
  const change = data?.todaysChange || 0
  const changePercent = data?.todaysChangePerc || 0

  return {
    price,
    change,
    changePercent,
    volume: data?.day?.v || 0,
    high: data?.day?.h || 0,
    low: data?.day?.l || 0,
    open: data?.day?.o || 0,
    snapshot: data,
    isLoading,
    error,
    refresh: mutate,
  }
}