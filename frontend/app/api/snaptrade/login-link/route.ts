/**
 * SnapTrade Connection Portal / Login Link Endpoint
 * Generates a short-lived login link (expires in ~5 minutes)
 * 
 * POST /api/snaptrade/login-link
 * Body: { riskrUserId: string, customRedirect?: string }
 * Returns: { redirectURI: string }
 */

import { NextResponse } from "next/server";
import { snaptrade } from "@/lib/snaptrade";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const querySchema = z.object({ 
  riskrUserId: z.string().uuid(),
  customRedirect: z.string().url().optional(),
  broker: z.string().optional(), // Pre-select broker (e.g., "SCHWAB")
  connectionType: z.enum(["read", "trade"]).optional(), // read-only or trade
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const { riskrUserId, customRedirect, broker, connectionType } = querySchema.parse(await req.json());
    
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

    // Generate login link with SnapTrade
    const response = await snaptrade.authentication.loginSnapTradeUser({
      userId: row.st_user_id,
      userSecret: row.st_user_secret,
      // Optional parameters
      ...(broker && { broker }),
      ...(connectionType && { connectionType }),
      ...(customRedirect && { customRedirect }),
    });

    // Returns a short-lived redirectURI (expires in ~5 minutes)
    return NextResponse.json({ 
      redirectURI: (response.data as any).redirectURI 
    });

  } catch (error: any) {
    console.error('Login link generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate login link',
      details: error.message 
    }, { status: 500 });
  }
}
