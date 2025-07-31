import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-provider'
import { supabase } from '@/lib/supabaseClient'

export function useUserTrades() {
  const { user } = useAuth()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) setError(error)
        else setTrades(data)
        setLoading(false)
      })
  }, [user])

  return { trades, loading, error }
}