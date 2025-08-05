"use client"

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import type { HybridTicker, HybridMarketMovers } from '@/lib/hybrid-market-data'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }
  return response.json()
}

// Hook for market movers using hybrid approach
export function useHybridMarketMovers(refreshInterval: number = 30000) {
  const { data, error, isLoading, mutate } = useSWR<HybridMarketMovers>(
    '/api/market/trending-hybrid',
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
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook for single ticker snapshot using hybrid approach
export function useHybridTickerSnapshot(ticker: string, refreshInterval: number = 15000) {
  const { data, error, isLoading, mutate } = useSWR<HybridTicker>(
    ticker ? `/api/market/snapshot-hybrid/${ticker}` : null,
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

// Hook for historical data (still uses Polygon.io since it works with free tier)
export function useHybridHistoricalData(
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
    results: any[]
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

// Hook for ticker search (uses Polygon.io since it works with free tier)
export function useHybridTickerSearch() {
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

// Hook for real-time price updates using hybrid approach
export function useHybridRealTimePrice(ticker: string, refreshInterval: number = 15000) {
  const { data, error, isLoading, mutate } = useSWR<HybridTicker>(
    ticker ? `/api/market/snapshot-hybrid/${ticker}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  return {
    price: data?.price || 0,
    change: data?.change || 0,
    changePercent: data?.changePercent || 0,
    volume: data?.volume || 0,
    high: data?.high || 0,
    low: data?.low || 0,
    open: data?.open || 0,
    snapshot: data,
    isLoading,
    error,
    refresh: mutate,
  }
}