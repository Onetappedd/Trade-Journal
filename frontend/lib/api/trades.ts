import { supabase } from "@/lib/supabase"
import { tradeSchema, type TradeFormData } from "@/lib/validations"
import type { Database } from "@/lib/database.types"

type Trade = Database["public"]["Tables"]["trades"]["Row"]
type TradeInsert = Database["public"]["Tables"]["trades"]["Insert"]
type TradeUpdate = Database["public"]["Tables"]["trades"]["Update"]

export class TradeService {
  static async createTrade(data: TradeFormData): Promise<{ data: Trade | null; error: string | null }> {
    try {
      // Validate input
      const validatedData = tradeSchema.parse(data)

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return { data: null, error: "Authentication required" }
      }

      // Prepare trade data
      const tradeData: TradeInsert = {
        user_id: user.id,
        symbol: validatedData.symbol,
        asset_type: validatedData.asset_type,
        broker: validatedData.broker,
        side: validatedData.side,
        quantity: validatedData.quantity,
        entry_price: validatedData.entry_price,
        exit_price: validatedData.exit_price || null,
        entry_date: validatedData.entry_date,
        exit_date: validatedData.exit_date || null,
        status: validatedData.status,
        notes: validatedData.notes || null,
        fees: validatedData.fees,
        strike_price: validatedData.strike_price || null,
        expiration_date: validatedData.expiration_date || null,
        option_type: validatedData.option_type || null,
      }

      // Insert trade
      const { data: trade, error } = await supabase.from("trades").insert(tradeData).select().single()

      if (error) {
        console.error("Trade creation error:", error)
        return { data: null, error: error.message }
      }

      // Handle tags if provided
      if (validatedData.tag_ids && validatedData.tag_ids.length > 0) {
        const tagInserts = validatedData.tag_ids.map((tagId) => ({
          trade_id: trade.id,
          tag_id: tagId,
        }))

        const { error: tagError } = await supabase.from("trade_tags").insert(tagInserts)

        if (tagError) {
          console.error("Tag association error:", tagError)
          // Don't fail the trade creation for tag errors
        }
      }

      return { data: trade, error: null }
    } catch (error) {
      console.error("Trade service error:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to create trade",
      }
    }
  }

  static async getTrades(filters?: {
    symbol?: string
    asset_type?: string
    broker?: string
    status?: string
    date_from?: string
    date_to?: string
    pnl_min?: number
    pnl_max?: number
    tag_ids?: string[]
  }): Promise<{ data: Trade[] | null; error: string | null }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return { data: null, error: "Authentication required" }
      }

      let query = supabase
        .from("trades")
        .select(`
          *,
          trade_tags (
            tag_id,
            tags (
              id,
              name,
              color
            )
          )
        `)
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })

      // Apply filters
      if (filters?.symbol) {
        query = query.ilike("symbol", `%${filters.symbol}%`)
      }
      if (filters?.asset_type && filters.asset_type !== "all") {
        query = query.eq("asset_type", filters.asset_type)
      }
      if (filters?.broker && filters.broker !== "all") {
        query = query.eq("broker", filters.broker)
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }
      if (filters?.date_from) {
        query = query.gte("entry_date", filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte("entry_date", filters.date_to)
      }
      if (filters?.pnl_min !== undefined) {
        query = query.gte("pnl", filters.pnl_min)
      }
      if (filters?.pnl_max !== undefined) {
        query = query.lte("pnl", filters.pnl_max)
      }

      const { data, error } = await query

      if (error) {
        console.error("Get trades error:", error)
        return { data: null, error: error.message }
      }

      // Filter by tags if provided
      let filteredData = data
      if (filters?.tag_ids && filters.tag_ids.length > 0) {
        filteredData = data.filter((trade) => trade.trade_tags.some((tt: any) => filters.tag_ids!.includes(tt.tag_id)))
      }

      return { data: filteredData, error: null }
    } catch (error) {
      console.error("Trade service error:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to get trades",
      }
    }
  }

  static async updateTrade(
    id: string,
    data: Partial<TradeFormData>,
  ): Promise<{ data: Trade | null; error: string | null }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return { data: null, error: "Authentication required" }
      }

      // Validate partial data
      const validatedData = tradeSchema.partial().parse(data)

      const updateData: TradeUpdate = {
        ...(validatedData.symbol && { symbol: validatedData.symbol }),
        ...(validatedData.asset_type && { asset_type: validatedData.asset_type }),
        ...(validatedData.broker && { broker: validatedData.broker }),
        ...(validatedData.side && { side: validatedData.side }),
        ...(validatedData.quantity && { quantity: validatedData.quantity }),
        ...(validatedData.entry_price && { entry_price: validatedData.entry_price }),
        ...(validatedData.exit_price !== undefined && { exit_price: validatedData.exit_price }),
        ...(validatedData.entry_date && { entry_date: validatedData.entry_date }),
        ...(validatedData.exit_date !== undefined && { exit_date: validatedData.exit_date }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.fees !== undefined && { fees: validatedData.fees }),
        ...(validatedData.strike_price !== undefined && { strike_price: validatedData.strike_price }),
        ...(validatedData.expiration_date !== undefined && { expiration_date: validatedData.expiration_date }),
        ...(validatedData.option_type !== undefined && { option_type: validatedData.option_type }),
      }

      const { data: trade, error } = await supabase
        .from("trades")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Trade update error:", error)
        return { data: null, error: error.message }
      }

      // Handle tag updates if provided
      if (validatedData.tag_ids !== undefined) {
        // Remove existing tags
        await supabase.from("trade_tags").delete().eq("trade_id", id)

        // Add new tags
        if (validatedData.tag_ids.length > 0) {
          const tagInserts = validatedData.tag_ids.map((tagId) => ({
            trade_id: id,
            tag_id: tagId,
          }))

          await supabase.from("trade_tags").insert(tagInserts)
        }
      }

      return { data: trade, error: null }
    } catch (error) {
      console.error("Trade service error:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to update trade",
      }
    }
  }

  static async deleteTrade(id: string): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return { error: "Authentication required" }
      }

      const { error } = await supabase.from("trades").delete().eq("id", id).eq("user_id", user.id)

      if (error) {
        console.error("Trade deletion error:", error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error("Trade service error:", error)
      return {
        error: error instanceof Error ? error.message : "Failed to delete trade",
      }
    }
  }

  static async getTradeSummary(): Promise<{ data: any | null; error: string | null }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return { data: null, error: "Authentication required" }
      }

      const { data, error } = await supabase.from("trade_summary").select("*").eq("user_id", user.id).single()

      if (error) {
        console.error("Trade summary error:", error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error("Trade service error:", error)
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to get trade summary",
      }
    }
  }
}
