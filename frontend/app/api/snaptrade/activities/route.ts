/**
 * SnapTrade Activities Endpoint
 * Gets daily historical activities (trades, dividends, etc.)
 * 
 * POST /api/snaptrade/activities
 * Body: { riskrUserId: string, accountId: string, startDate?: string, endDate?: string }
 * Returns: { activities: Activity[] }
 */

import { NextResponse } from "next/server";
import { snaptrade } from "@/lib/snaptrade";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({ 
  riskrUserId: z.string().uuid(),
  accountId: z.string().uuid(),
  startDate: z.string().optional(), // YYYY-MM-DD
  endDate: z.string().optional()    // YYYY-MM-DD
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const { riskrUserId, accountId, startDate, endDate } = bodySchema.parse(await req.json());
    
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

    // Get account activities from SnapTrade
    const response = await snaptrade.transactionsAndReporting.getActivities({
      userId: row.st_user_id,
      userSecret: row.st_user_secret,
      accounts: accountId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    } as any);

    return NextResponse.json({ 
      activities: response.data 
    });

  } catch (error: any) {
    console.error('Activities fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch activities',
      details: error.message 
    }, { status: 500 });
  }
}
