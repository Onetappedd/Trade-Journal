/**
 * SnapTrade User Registration Endpoint
 * Registers a user with SnapTrade and returns userSecret
 * 
 * POST /api/snaptrade/register
 * Body: { riskrUserId: string }
 * Returns: { ok: true }
 */

import { NextResponse } from "next/server";
import { snaptrade } from "@/lib/snaptrade";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({ 
  riskrUserId: z.string().uuid() 
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const { riskrUserId } = bodySchema.parse(await req.json());
    
    // Create immutable SnapTrade user ID
    const stUserId = `riskr_${riskrUserId}`;
    
    // Call SnapTrade: register user -> returns { userId, userSecret }
    const res = await snaptrade.authentication.registerSnapTradeUser({
      userId: stUserId,
    });

    // Store in database using service role (server-only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from("snaptrade_users").upsert({
      user_id: riskrUserId,
      st_user_id: res.data.userId,
      st_user_secret: res.data.userSecret,
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('SnapTrade registration error:', error);
    return NextResponse.json({ 
      error: 'Failed to register with SnapTrade',
      details: error.message 
    }, { status: 500 });
  }
}
