import { useState } from 'react'
import { useAuth } from '@/context/auth-provider'
import { supabase } from '@/lib/supabaseClient'

export default function AddTradePage() {
  const { user } = useAuth()
  if (!user) return <p>Please log in to continue.</p>

  const [tradeData, setTradeData] = useState({
    // ...initialize other trade fields...
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setTradeData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      // ...other trade fields...
      user_id: user.id,
      // ...existing code...
    }
    const { error } = await supabase.from('trades').insert([payload])
    if (error) {
      console.error('Error inserting trade:', error)
    } else {
      console.log('Trade added successfully')
      // ...handle success, e.g., redirect or show a message...
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ...existing form fields... */}
      <button type="submit">Add Trade</button>
    </form>
  )
}