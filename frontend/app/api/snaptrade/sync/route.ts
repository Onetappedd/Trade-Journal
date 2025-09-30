/**
 * SnapTrade Sync Endpoint
 * Syncs connections and accounts from SnapTrade API to our database
 * Updates broker verification status based on holdings sync
 * 
 * POST /api/snaptrade/sync
 * Body: { riskrUserId: string }
 * Returns: { ok: true, connections: number, accounts: number }
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

    // 1) Sync Connections (Brokerage Authorizations)
    const connectionsResponse = await snaptrade.connections.listBrokerageAuthorizations({
      userId: row.st_user_id,
      userSecret: row.st_user_secret,
    });

    const connections = connectionsResponse.data;

    for (const c of connections) {
      await supabase.from("snaptrade_connections").upsert({
        user_id: riskrUserId,
        authorization_id: c.id,
        broker_slug: c.brokerage?.slug ?? "",
        disabled: !!c.disabled,
        last_holdings_sync_at: null, // Will be updated from accounts below
      }, { 
        onConflict: "user_id,authorization_id" 
      });
    }

    // 2) Sync Accounts (with holdings sync status + total value)
    const accountsResponse = await snaptrade.accountInformation.listUserAccounts({
      userId: row.st_user_id,
      userSecret: row.st_user_secret,
    });

    const accounts = accountsResponse.data;

    for (const a of accounts) {
      // Upsert account data
      await supabase.from("snaptrade_accounts").upsert({
        account_id: a.id,
        user_id: riskrUserId,
        authorization_id: a.brokerage_authorization,
        name: a.name,
        number: a.number,
        institution_name: a.institution_name,
        total_value: a.balance?.total?.amount ?? null,
        currency: a.balance?.total?.currency ?? null,
        last_successful_holdings_sync: a.sync_status?.holdings?.last_successful_sync ?? null,
      });

      // Bubble "last holdings sync" up to connection
      // This updates the connection's last_holdings_sync_at to the latest account sync time
      if (a.sync_status?.holdings?.last_successful_sync) {
        await supabase.rpc("set_connection_last_sync", {
          p_user_id: riskrUserId,
          p_auth_id: a.brokerage_authorization,
          p_sync_time: a.sync_status.holdings.last_successful_sync
        });
      }
    }

    return NextResponse.json({ 
      ok: true, 
      connections: connections.length, 
      accounts: accounts.length 
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync connections and accounts',
      details: error.message 
    }, { status: 500 });
  }
}
