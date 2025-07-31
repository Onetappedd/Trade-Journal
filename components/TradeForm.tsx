import { useState } from 'react'
import { useSupabaseTrades } from '../hooks/useSupabaseTrades'

export default function TradeForm() {
  const { addTrade, loading, error } = useSupabaseTrades()
  const [form, setForm] = useState({
    // ...fields...
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await addTrade(form)
    // ...reset form if needed...
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ...existing code... */}
      <button type="submit" disabled={loading}>Add Trade</button>
      {error && <div>{error}</div>}
      {/* ...existing code... */}
    </form>
  )
}