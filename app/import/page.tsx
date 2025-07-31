import { useState } from 'react'
import { useAuth } from '@/context/auth-provider'
import { supabase } from '@/lib/supabaseClient'

export default function ImportPage() {
  const { user } = useAuth()
  if (!user) return <p>Please log in to continue.</p>

  const [trades, setTrades] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const parsedTrades = parseTrades(text)
      setTrades(parsedTrades)
    }
    reader.readAsText(file)
  }

  const parseTrades = (text) => {
    // Implement your parsing logic here
    return []
  }

  const handleImport = async () => {
    if (trades.length === 0) {
      setError('No trades to import')
      return
    }

    const tradesWithUser = trades.map(trade => ({
      ...trade,
      user_id: user.id,
    }))

    const { error } = await supabase.from('trades').insert(tradesWithUser)
    if (error) {
      setError('Error importing trades')
      setSuccess(false)
    } else {
      setError(null)
      setSuccess(true)
    }
  }

  return (
    <div>
      <h1>Import Trades</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleImport}>Import</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Trades imported successfully!</p>}
    </div>
  )
}