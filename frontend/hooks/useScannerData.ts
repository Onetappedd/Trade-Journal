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

// Mock data for development
const MOCK_SCANNER_DATA: ScannerResult[] = [
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
    winRate: 0.75,
    avgPnl: 125.50,
    tradesCount: 8,
    lastTraded: '2024-01-15',
    isWatchlisted: true
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
    winRate: 0.60,
    avgPnl: -45.20,
    tradesCount: 12,
    lastTraded: '2024-01-10',
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
    winRate: 0.85,
    avgPnl: 234.75,
    tradesCount: 6,
    lastTraded: '2024-01-12',
    isWatchlisted: true
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    price: 378.85,
    change: 1.23,
    volume: 28000000,
    rvol: 0.7,
    week52High: 78.4,
    week52Low: 12.6,
    atrPercent: 1.9,
    rsi: 58,
    winRate: 0.70,
    avgPnl: 89.30,
    tradesCount: 10,
    lastTraded: '2024-01-08',
    isWatchlisted: false
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Communication Services',
    price: 142.56,
    change: -0.45,
    volume: 22000000,
    rvol: 0.6,
    week52High: 65.2,
    week52Low: 18.8,
    atrPercent: 1.6,
    rsi: 42,
    winRate: 0.55,
    avgPnl: -12.40,
    tradesCount: 15,
    lastTraded: '2024-01-05',
    isWatchlisted: false
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Discretionary',
    price: 155.23,
    change: 3.12,
    volume: 35000000,
    rvol: 1.1,
    week52High: 82.7,
    week52Low: 25.3,
    atrPercent: 2.3,
    rsi: 68,
    winRate: 0.80,
    avgPnl: 156.80,
    tradesCount: 7,
    lastTraded: '2024-01-14',
    isWatchlisted: true
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Communication Services',
    price: 378.99,
    change: 5.67,
    volume: 42000000,
    rvol: 1.5,
    week52High: 89.3,
    week52Low: 11.7,
    atrPercent: 3.1,
    rsi: 75,
    winRate: 0.90,
    avgPnl: 298.45,
    tradesCount: 5,
    lastTraded: '2024-01-16',
    isWatchlisted: true
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    sector: 'Communication Services',
    price: 492.42,
    change: -2.34,
    volume: 18000000,
    rvol: 0.8,
    week52High: 76.8,
    week52Low: 23.2,
    atrPercent: 2.7,
    rsi: 38,
    winRate: 0.65,
    avgPnl: 67.20,
    tradesCount: 9,
    lastTraded: '2024-01-09',
    isWatchlisted: false
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices Inc.',
    sector: 'Technology',
    price: 145.67,
    change: 6.78,
    volume: 55000000,
    rvol: 2.1,
    week52High: 94.5,
    week52Low: 5.5,
    atrPercent: 4.2,
    rsi: 82,
    winRate: 0.75,
    avgPnl: 189.30,
    tradesCount: 11,
    lastTraded: '2024-01-13',
    isWatchlisted: true
  },
  {
    symbol: 'CRM',
    name: 'Salesforce Inc.',
    sector: 'Technology',
    price: 267.54,
    change: 1.89,
    volume: 15000000,
    rvol: 0.5,
    week52High: 68.9,
    week52Low: 31.1,
    atrPercent: 1.8,
    rsi: 52,
    winRate: 0.70,
    avgPnl: 78.90,
    tradesCount: 8,
    lastTraded: '2024-01-07',
    isWatchlisted: false
  }
]

export function useScannerData(filters: ScannerFilters, preset: string | null) {
  const [data, setData] = useState<ScannerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // For now, return mock data
        // In production, this would call your actual API
        let results = [...MOCK_SCANNER_DATA]

        // Apply preset filters
        if (preset) {
          switch (preset) {
            case 'top-gainers':
              results = results.filter(r => r.change >= 3 && r.volume >= 1000000)
              break
            case 'gap-ups':
              results = results.filter(r => r.change >= 2 && r.volume >= 500000)
              break
            case 'high-rvol':
              results = results.filter(r => r.rvol >= 2 && r.volume >= 100000)
              break
            case 'week52-breakouts':
              results = results.filter(r => r.week52High <= 1 && r.volume >= 500000)
              break
            case 'pullback-20ema':
              results = results.filter(r => r.rsi >= 40 && r.rsi <= 60 && r.volume >= 300000)
              break
            case 'oversold-reversal':
              results = results.filter(r => r.rsi <= 30 && r.change >= 0.5 && r.volume >= 200000)
              break
            default:
              break
          }
        }

        // Apply custom filters
        if (filters.priceMin) {
          results = results.filter(r => r.price >= filters.priceMin!)
        }
        if (filters.priceMax) {
          results = results.filter(r => r.price <= filters.priceMax!)
        }
        if (filters.volumeMin) {
          results = results.filter(r => r.volume >= filters.volumeMin!)
        }
        if (filters.rvolMin) {
          results = results.filter(r => r.rvol >= filters.rvolMin!)
        }
        if (filters.changeMin) {
          results = results.filter(r => r.change >= filters.changeMin!)
        }
        if (filters.changeMax) {
          results = results.filter(r => r.change <= filters.changeMax!)
        }
        if (filters.rsiMin) {
          results = results.filter(r => r.rsi >= filters.rsiMin!)
        }
        if (filters.rsiMax) {
          results = results.filter(r => r.rsi <= filters.rsiMax!)
        }
        if (filters.atrPercentMin) {
          results = results.filter(r => r.atrPercent >= filters.atrPercentMin!)
        }
        if (filters.sectors && filters.sectors.length > 0) {
          results = results.filter(r => filters.sectors!.includes(r.sector))
        }
        if (filters.watchlistOnly) {
          results = results.filter(r => r.isWatchlisted)
        }

        setData(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch scanner data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters, preset])

  return { data, loading, error }
}
