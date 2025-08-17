"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/lib/supabase-server"
import type { Database } from "@/lib/database.types"

// Local form type from Supabase Insert, without server-assigned fields
type TradeFormValues = Omit<
  Database['public']['Tables']['trades']['Insert'],
  'id' | 'created_at' | 'user_id'
>;

const allowedAssetTypes = ['crypto','option','stock','forex','futures'] as const;
type DbAssetType = typeof allowedAssetTypes[number];

export async function createTrade(payload: TradeFormValues) {
  // Validate asset_type against the allowed list
  if (!allowedAssetTypes.includes(payload.asset_type as any)) {
    throw new Error(`Invalid asset_type: ${payload.asset_type}`);
  }
  const assetType: DbAssetType = payload.asset_type as DbAssetType;

  // Get authenticated user for server-side user_id
  const supabase = createSupabaseServer();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user) throw new Error('Not authenticated');

  // Build Insert payload:
  // - user_id MUST come from server auth
  // - spread the client payload
  // - override asset_type with the narrowed/validated value
  const tradeData: Database['public']['Tables']['trades']['Insert'] = {
    user_id: user.id,
    ...payload,
    asset_type: assetType,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('trades')
    .insert(tradeData)
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
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
