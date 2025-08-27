'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase'

export function useWatchlist() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Load watchlist
  useEffect(() => {
    if (user) {
      loadWatchlist()
    }
  }, [user])

  const loadWatchlist = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('watchlist_items')
        .select('symbol')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading watchlist:', error)
        return
      }

      const symbols = data?.map(item => item.symbol) || []
      setWatchlist(symbols)
    } catch (error) {
      console.error('Error loading watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToWatchlist = async (symbol: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('watchlist_items')
        .insert({
          user_id: user.id,
          symbol,
          source: 'scanner'
        })

      if (error) {
        console.error('Error adding to watchlist:', error)
        return false
      }

      setWatchlist(prev => [...prev, symbol])
      return true
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return false
    }
  }

  const removeFromWatchlist = async (symbol: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol)

      if (error) {
        console.error('Error removing from watchlist:', error)
        return false
      }

      setWatchlist(prev => prev.filter(s => s !== symbol))
      return true
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return false
    }
  }

  const isWatchlisted = (symbol: string): boolean => {
    return watchlist.includes(symbol)
  }

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isWatchlisted,
    refresh: loadWatchlist
  }
}
