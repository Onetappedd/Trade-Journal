/**
 * SnapTrade Orders Endpoint
 * Gets intraday orders for a specific account
 * 
 * POST /api/snaptrade/orders
 * Body: { riskrUserId: string, accountId: string }
 * Returns: { orders: Order[] }
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

    // Get account orders from SnapTrade
    const response = await snaptrade.trading.getUserAccountOrders({
      userId: row.st_user_id,
      userSecret: row.st_user_secret,
      accountId
    });

    return NextResponse.json({ 
      orders: response.data 
    });

  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch orders',
      details: error.message 
    }, { status: 500 });
  }
}
