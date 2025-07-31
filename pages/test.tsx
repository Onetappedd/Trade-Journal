import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function TestPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('trades').select('*').then(({ data, error }) => {
      setData(data)
      setError(error)
    })
  }, [])

  return (
    <div>
      <h1>Trades Table</h1>
      {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
