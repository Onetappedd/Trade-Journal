'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase'

interface SymbolStats {
  totalPnl: number
  winRate: number
  avgPnl: number
  tradesCount: number
  lastTraded: string
  topTags: string[]
}

export function useSymbolStats(symbol: string) {
  const { user } = useAuth()
  const [stats, setStats] = useState<SymbolStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (user && symbol) {
      fetchStats()
    } else {
      setStats(null)
    }
  }, [user, symbol])

  const fetchStats = async () => {
    if (!user || !symbol) return

    setLoading(true)
    setError(null)

    try {
      // Fetch trades for this symbol
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .order('entry_date', { ascending: false })

      if (tradesError) {
        console.error('Error fetching trades:', tradesError)
        setError('Failed to fetch trade data')
        return
      }

      if (!trades || trades.length === 0) {
        setStats(null)
        return
      }

      // Calculate stats
      const realizedTrades = (trades as any).filter((trade: any) => trade.status === 'closed')
      const totalPnl = realizedTrades.reduce((sum: number, trade: any) => sum + (trade.realized_pnl || 0), 0)
      const winningTrades = realizedTrades.filter((trade: any) => (trade.realized_pnl || 0) > 0)
      const winRate = realizedTrades.length > 0 ? winningTrades.length / realizedTrades.length : 0
      const avgPnl = realizedTrades.length > 0 ? totalPnl / realizedTrades.length : 0
      const tradesCount = realizedTrades.length
      const lastTraded = (trades as any)[0]?.entry_date || ''

      // Get top tags
      const tagCounts: Record<string, number> = {}
      ;(trades as any).forEach((trade: any) => {
        if (trade.tags) {
          const tags = Array.isArray(trade.tags) ? trade.tags : [trade.tags]
          tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag)

      setStats({
        totalPnl,
        winRate,
        avgPnl,
        tradesCount,
        lastTraded,
        topTags
      })

    } catch (err) {
      console.error('Error calculating symbol stats:', err)
      setError('Failed to calculate statistics')
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, error, refetch: fetchStats }
}
