/**
 * SnapTrade Webhook Handler
 * Keeps connection and account state fresh via real-time events
 * 
 * POST /api/snaptrade/webhook
 * Headers: x-snaptrade-signature (for verification)
 * Body: { eventType, userId, brokerageAuthorizationId, ... }
 * 
 * Events:
 * - CONNECTION_ADDED: New broker connection established
 * - ACCOUNT_HOLDINGS_UPDATED: Holdings synced, updates last_holdings_sync_at
 * - CONNECTION_BROKEN: Connection lost, needs re-authentication
 * - CONNECTION_DELETED: User disconnected broker
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper function to map SnapTrade userId to Riskr userId
async function mapSnapTradeToRiskrUserId(stUserId: string, supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from("snaptrade_users")
    .select("user_id")
    .eq("st_user_id", stUserId)
    .single();
  
  return data?.user_id || null;
}

// Helper function to lookup broker slug from brokerage ID
async function lookupBrokerSlug(brokerageId: string): Promise<string> {
  // In production, you might want to cache this or use the slug from the webhook payload
  // For now, return a default or fetch from SnapTrade API if needed
  return brokerageId; // Webhook should provide slug directly
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Verify authenticity using webhookSecret
    if (payload.webhookSecret !== process.env.SNAPTRADE_WEBHOOK_SECRET) {
      console.error('Webhook authentication failed: Invalid webhook secret');
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle different event types
    switch (payload.eventType) {
      case "CONNECTION_ADDED": {
        // New broker connection established
        const riskrUserId = await mapSnapTradeToRiskrUserId(payload.userId, supabase);
        
        if (!riskrUserId) {
          console.error(`User mapping not found for SnapTrade userId: ${payload.userId}`);
          break;
        }

        // Upsert connection
        await supabase.from("snaptrade_connections").upsert({
          user_id: riskrUserId,
          authorization_id: payload.brokerageAuthorizationId,
          broker_slug: await lookupBrokerSlug(payload.brokerageId),
          disabled: false,
          last_holdings_sync_at: payload.eventTimestamp || null
        });

        console.log(`CONNECTION_ADDED: ${payload.brokerageAuthorizationId} for user ${riskrUserId}`);
        break;
      }

      case "ACCOUNT_HOLDINGS_UPDATED": {
        // Holdings synced - update last_holdings_sync_at for broker verification
        const riskrUserId = await mapSnapTradeToRiskrUserId(payload.userId, supabase);
        
        if (!riskrUserId) {
          console.error(`User mapping not found for SnapTrade userId: ${payload.userId}`);
          break;
        }

        // Update connection's last holdings sync time
        await supabase.from("snaptrade_connections").update({
          last_holdings_sync_at: payload.eventTimestamp
        }).match({ 
          user_id: riskrUserId, 
          authorization_id: payload.brokerageAuthorizationId 
        });

        console.log(`ACCOUNT_HOLDINGS_UPDATED: ${payload.brokerageAuthorizationId} at ${payload.eventTimestamp}`);
        break;
      }

      case "CONNECTION_BROKEN":
      case "CONNECTION_DELETED": {
        // Connection lost or user disconnected - mark as disabled
        const riskrUserId = await mapSnapTradeToRiskrUserId(payload.userId, supabase);
        
        if (!riskrUserId) {
          console.error(`User mapping not found for SnapTrade userId: ${payload.userId}`);
          break;
        }

        // Mark connection as disabled (loses broker verification)
        await supabase.from("snaptrade_connections").update({
          disabled: true
        }).match({ 
          user_id: riskrUserId, 
          authorization_id: payload.brokerageAuthorizationId 
        });

        console.log(`${payload.eventType}: ${payload.brokerageAuthorizationId} disabled for user ${riskrUserId}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${payload.eventType}`);
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
}

