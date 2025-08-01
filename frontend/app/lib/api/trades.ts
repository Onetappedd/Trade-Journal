import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

type Trade = Database["public"]["Tables"]["trades"]["Row"]
type TradeInsert = Database["public"]["Tables"]["trades"]["Insert"]
type TradeUpdate = Database["public"]["Tables"]["trades"]["Update"]

export async function createTrade(trade: TradeInsert) {
  const { data, error } = await supabase.from("trades").insert([trade]).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return { data, error: null }
}

export async function getTrades(userId: string) {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("trade_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return { data, error: null }
}

export async function updateTrade(id: string, updates: TradeUpdate) {
  const { data, error } = await supabase.from("trades").update(updates).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return { data, error: null }
}

export async function deleteTrade(id: string) {
  const { error } = await supabase.from("trades").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  return { error: null }
}

export async function getDashboardStats(userId: string) {
  const { data: trades, error } = await supabase.from("trades").select("*").eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  const totalTrades = trades.length
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  const winningTrades = trades.filter((trade) => (trade.pnl || 0) > 0).length
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
