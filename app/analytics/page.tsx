import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-provider'
import { supabase } from '@/lib/supabaseClient'

export default function AnalyticsPage() {
  const { user } = useAuth()
  if (!user) return <p>Please log in to continue.</p>

  const [trades, setTrades] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchTrades() {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
      if (error) setError(error)
      else setTrades(data)
    }
    fetchTrades()
  }, [user])

  return (
    <div>
      <h1>Your Trades</h1>
      {error && <p>Error fetching trades: {error.message}</p>}
      <ul>
        {trades.map(trade => (
          <li key={trade.id}>{JSON.stringify(trade)}</li>
        ))}
      </ul>
    </div>
  )
}