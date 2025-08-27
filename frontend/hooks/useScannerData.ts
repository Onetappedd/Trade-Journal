'use client'

import { useState, useEffect } from 'react'
import { ScannerFilters } from './useScannerState'

interface ScannerResult {
  symbol: string
  name: string
  sector: string
  price: number
  change: number
  volume: number
  rvol: number
  week52High: number
  week52Low: number
  atrPercent: number
  rsi: number
  winRate?: number
  avgPnl?: number
  tradesCount?: number
  lastTraded?: string
  isWatchlisted: boolean
}

// Fallback mock data in case API fails
const FALLBACK_SCANNER_DATA: ScannerResult[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    price: 175.43,
    change: 2.34,
    volume: 45000000,
    rvol: 1.2,
    week52High: 95.2,
    week52Low: 15.8,
    atrPercent: 2.1,
    rsi: 65,
    isWatchlisted: false
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Consumer Discretionary',
    price: 242.12,
    change: -1.87,
    volume: 38000000,
    rvol: 0.9,
    week52High: 88.5,
    week52Low: 22.3,
    atrPercent: 3.4,
    rsi: 45,
    isWatchlisted: false
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    price: 485.09,
    change: 4.56,
    volume: 52000000,
    rvol: 1.8,
    week52High: 92.1,
    week52Low: 8.9,
    atrPercent: 2.8,
    rsi: 72,
    isWatchlisted: false
  }
]

export function useScannerData(filters: ScannerFilters, preset: string | null) {
  const [data, setData] = useState<ScannerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingRealData, setUsingRealData] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Call the real API endpoint
        const response = await fetch('/api/scanner/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters,
            preset,
            symbols: filters.universe || undefined
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.error) {
          throw new Error(result.error)
        }

        setData(result.data || [])
        setUsingRealData(result.usingRealData || false)

      } catch (err) {
        console.error('Scanner data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch scanner data')
        
        // Fallback to mock data on error
        setData(FALLBACK_SCANNER_DATA)
        setUsingRealData(false)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters, preset])

  return { data, loading, error, usingRealData }
}
