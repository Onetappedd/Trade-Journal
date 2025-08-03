import { createClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

type Trade = Database["public"]["Tables"]["trades"]["Row"]
type TradeInsert = Database["public"]["Tables"]["trades"]["Insert"]
type TradeUpdate = Database["public"]["Tables"]["trades"]["Update"]

export async function createTrade(trade: TradeInsert) {
  const supabase = createClient()
  const { data, error } = await supabase.from("trades").insert([trade]).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return { data, error: null }
}

export async function getTrades(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return { data, error: null }
}

export async function updateTrade(id: string, updates: TradeUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase.from("trades").update(updates).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return { data, error: null }
}

export async function deleteTrade(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("trades").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  return { error: null }
}

export async function getDashboardStats(userId: string) {
  const supabase = createClient()
  const { data: trades, error } = await supabase.from("trades").select("*").eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  const totalTrades = trades.length
  const totalPnL = trades.reduce((sum, trade) => {
    // Calculate P&L if not stored
    if (trade.exit_price && trade.entry_price) {
      const pnl = (trade.exit_price - trade.entry_price) * trade.quantity * (trade.side === 'buy' ? 1 : -1)
      return sum + pnl
    }
    return sum
  }, 0)
  const winningTrades = trades.filter((trade) => {
    if (trade.exit_price && trade.entry_price) {
      const pnl = (trade.exit_price - trade.entry_price) * trade.quantity * (trade.side === 'buy' ? 1 : -1)
      return pnl > 0
    }
    return false
  }).length
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
  const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0

  return {
    data: {
      totalTrades,
      totalPnL,
      winRate,
      avgPnL,
      recentTrades: trades.slice(0, 5),
    },
    error: null,
  }
}

// Export TradeService for backward compatibility
export const TradeService = {
  createTrade,
  getTrades,
  updateTrade,
  deleteTrade,
  getDashboardStats,
}
