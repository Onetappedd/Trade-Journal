"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { z } from "zod"
import type { Database } from "@/lib/database.types"

// Local form type from Supabase types (no external import)
type TradeFormValues = Omit<
  Database['public']['Tables']['trades']['Insert'],
  'id' | 'created_at' | 'user_id'
>;

// Single, top-level declaration (keep futures)
const allowedAssetTypes = ['crypto','option','stock','forex','futures'] as const;
type DbAssetType = typeof allowedAssetTypes[number];

// Explicitly use Node.js runtime to avoid Edge Runtime warnings
export const runtime = "nodejs"

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

  export async function createTrade(payload: TradeFormValues) {
  if (!allowedAssetTypes.includes(payload.asset_type as any)) {
    throw new Error(`Invalid asset_type: ${payload.asset_type}`);
  }
  const assetType: DbAssetType = payload.asset_type as DbAssetType;
  const parsed = tradeSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: "Invalid form data.", details: parsed.error.format() }
  }

  const { data: validated } = parsed;

  try {
    const tradeData: Database["public"]["Tables"]["trades"]["Insert"] = {
      user_id: validated.user_id,
      symbol: validated.symbol,
      asset_type: assetType,
      side: validated.side,
      quantity: validated.quantity,
      entry_price: validated.entry_price,
      exit_price: validated.exit_price,
      entry_date: new Date(validated.entry_date).toISOString(),
      exit_date: validated.exit_date ? new Date(validated.exit_date).toISOString() : undefined,
      notes: validated.notes,
      strike_price: validated.strike_price,
      expiry_date: validated.expiry_date,
      option_type: validated.option_type,
      status: validated.exit_price ? "closed" : "open",
    }

    const { data: insertData, error: insertError } = await supabase.from("trades").insert(tradeData).select().single()

    if (insertError) throw insertError

    // Handle tags
    if (validated.tags && validated.tags.length > 0) {
      for (const tagName of validated.tags) {
        let { data: tag } = await supabase.from("tags").select("id").eq("name", tagName).eq("user_id", validated.user_id).single()

        if (!tag) {
          const { data: newTag, error: newTagError } = await supabase
            .from("tags")
            .insert({ name: tagName, user_id: validated.user_id })
            .select("id")
            .single()
          if (newTagError) throw newTagError
          tag = newTag
        }

        const { error: tradeTagError } = await supabase.from("trade_tags").insert({
          trade_id: insertData.id,
          tag_id: tag.id,
        })
        if (tradeTagError) throw tradeTagError
      }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/trade-history")
    return { data: insertData }
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
