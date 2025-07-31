import { useSupabaseTrades } from '../hooks/useSupabaseTrades'

export default function TradeList() {
  const { trades, loading, error, deleteTrade } = useSupabaseTrades()

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>
  return (
    <div>
      {trades.map(trade => (
        <div key={trade.id}>
          {/* ...existing code for displaying trade details... */}
          <button onClick={() => deleteTrade(trade.id)}>Delete</button>
        </div>
      ))}
      {/* ...any additional code... */}
    </div>
  )
}