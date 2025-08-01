"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { z } from "zod"
import type { Database } from "@/lib/database.types"

const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  asset_type: z.enum(["stock", "option", "crypto", "futures", "forex"]),
  side: z.enum(["buy", "sell"]),
  quantity: z.coerce.number().min(0.000001, "Quantity must be positive"),
  entry_price: z.coerce.number().min(0, "Entry price must be non-negative"),
  exit_price: z.coerce.number().optional(),
  entry_date: z.string(),
  exit_date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  strike_price: z.coerce.number().optional(),
  expiry_date: z.string().optional(),
  option_type: z.enum(["call", "put"]).optional(),
})

export async function addTradeAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to add a trade." }
  }

  const rawFormData = Object.fromEntries(formData.entries())
  const parsed = tradeSchema.safeParse({
    ...rawFormData,
    tags: formData.getAll("tags"),
  })

  if (!parsed.success) {
    return { error: "Invalid form data.", details: parsed.error.format() }
  }

  const { data } = parsed

  try {
    const tradeData: Database["public"]["Tables"]["trades"]["Insert"] = {
      user_id: user.id,
      symbol: data.symbol,
      asset_type: data.asset_type,
      side: data.side,
      quantity: data.quantity,
      entry_price: data.entry_price,
      exit_price: data.exit_price,
      entry_date: new Date(data.entry_date).toISOString(),
      exit_date: data.exit_date ? new Date(data.exit_date).toISOString() : undefined,
      notes: data.notes,
      strike_price: data.strike_price,
      expiry_date: data.expiry_date,
      option_type: data.option_type,
      status: data.exit_price ? "closed" : "open",
    }

    const { data: newTrade, error: tradeError } = await supabase.from("trades").insert(tradeData).select().single()

    if (tradeError) throw tradeError

    // Handle tags
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        let { data: tag } = await supabase.from("tags").select("id").eq("name", tagName).eq("user_id", user.id).single()

        if (!tag) {
          const { data: newTag, error: newTagError } = await supabase
            .from("tags")
            .insert({ name: tagName, user_id: user.id })
            .select("id")
            .single()
          if (newTagError) throw newTagError
          tag = newTag
        }

        const { error: tradeTagError } = await supabase.from("trade_tags").insert({
          trade_id: newTrade.id,
          tag_id: tag.id,
        })
        if (tradeTagError) throw tradeTagError
      }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/trade-history")
    return { data: newTrade }
  } catch (error: any) {
    return { error: `Failed to add trade: ${error.message}` }
  }
}

export async function deleteTradeAction(tradeId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("trades").delete().eq("id", tradeId)

  if (error) {
    return { error: `Failed to delete trade: ${error.message}` }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/trade-history")
  return { success: true }
}
