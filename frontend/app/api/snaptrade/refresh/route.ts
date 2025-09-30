/**
 * SnapTrade Manual Refresh Endpoint
 * Triggers on-demand refresh of broker connection data
 * 
 * ⚠️ WARNING: May incur per-refresh cost on pay-as-you-go pricing
 * 
 * POST /api/snaptrade/refresh
 * Body: { riskrUserId: string, authorizationId: string }
 * Returns: { ok: true, status: string }
 */

import { NextResponse } from "next/server";
import { snaptrade } from "@/lib/snaptrade";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({ 
  riskrUserId: z.string().uuid(),
  authorizationId: z.string().uuid()
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const { riskrUserId, authorizationId } = bodySchema.parse(await req.json());
    
    // Get user credentials from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: row } = await supabase
      .from("snaptrade_users")
      .select("st_user_id, st_user_secret")
      .eq("user_id", riskrUserId)
      .single();

    if (!row) {
      return NextResponse.json({ 
        error: 'User not registered with SnapTrade' 
      }, { status: 404 });
    }

    // Trigger manual refresh via SnapTrade API
    // This forces SnapTrade to pull fresh data from the broker
    const response = await snaptrade.connections.refreshBrokerageAuthorization({
      userId: row.st_user_id,
      userSecret: row.st_user_secret,
      authorizationId
    });

    // Update last manual refresh timestamp
    await supabase
      .from('snaptrade_connections')
      .update({
        // Store last manual refresh time in meta or separate column
        // For now, this will be updated by the webhook when refresh completes
      })
      .eq('user_id', riskrUserId)
      .eq('authorization_id', authorizationId);

    return NextResponse.json({ 
      ok: true,
      status: response.data?.status || 'pending',
      message: 'Refresh initiated. Data will update shortly via webhook.'
    });

  } catch (error: any) {
    console.error('Manual refresh error:', error);
    
    // Handle rate limiting or API errors
    if (error.response?.status === 429) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        details: 'Please wait before refreshing again'
      }, { status: 429 });
    }

    return NextResponse.json({ 
      error: 'Failed to refresh connection',
      details: error.message 
    }, { status: 500 });
  }
}
