import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/auth-provider'

export function useSupabaseTrades() {
  const { user } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTrades = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setError(error)
    else setTrades(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const addTrade = async (payload) => {
    setLoading(true)
    const { error } = await supabase.from('trades').insert([{ ...payload, user_id: user.id }])
    if (error) setError(error)
    await fetchTrades()
    setLoading(false)
  }

  const updateTrade = async (id, updates) => {
    setLoading(true)
    const { error } = await supabase.from('trades').update(updates).eq('id', id)
    if (error) setError(error)
    await fetchTrades()
    setLoading(false)
  }

  const deleteTrade = async (id) => {
    setLoading(true)
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) setError(error)
    await fetchTrades()
    setLoading(false)
  }

  return { trades, loading, error, addTrade, updateTrade, deleteTrade }
}
