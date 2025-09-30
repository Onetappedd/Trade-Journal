/**
 * SnapTrade Positions Endpoint
 * Gets positions (holdings) for a specific account
 * Includes options positions
 * 
 * POST /api/snaptrade/positions
 * Body: { riskrUserId: string, accountId: string }
 * Returns: { positions: Position[] }
 */

import { NextResponse } from "next/server";
import { snaptrade } from "@/lib/snaptrade";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({ 
  riskrUserId: z.string().uuid(),
  accountId: z.string().uuid()
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const { riskrUserId, accountId } = bodySchema.parse(await req.json());
    
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

    // Get account positions from SnapTrade
    const response = await snaptrade.accountInformation.getUserAccountPositions({
      userId: row.st_user_id,
      userSecret: row.st_user_secret,
      accountId
    });

    return NextResponse.json({ 
      positions: response.data 
    });

  } catch (error: any) {
    console.error('Positions fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch positions',
      details: error.message 
    }, { status: 500 });
  }
}
