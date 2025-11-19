/**
 * SnapTrade Verification Status Endpoint
 * Returns broker verification status for displaying badge
 * 
 * GET /api/snaptrade/verification?userId=uuid
 * Returns: { verified: boolean, lastSync?: string, brokers: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Map of broker slugs to display names
const BROKER_DISPLAY_NAMES: Record<string, string> = {
  'ROBINHOOD': 'Robinhood',
  'SCHWAB': 'Charles Schwab',
  'TD_AMERITRADE': 'TD Ameritrade',
  'E_TRADE': 'E*TRADE',
  'FIDELITY': 'Fidelity',
  'INTERACTIVE_BROKERS': 'Interactive Brokers',
  'WEBULL': 'Webull',
  'ALPACA': 'Alpaca',
  'TRADIER': 'Tradier',
  'TASTYTRADE': 'tastytrade',
  'MERRILL_EDGE': 'Merrill Edge',
  'VANGUARD': 'Vanguard',
};

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId parameter required' 
      }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get verification status from view
    const { data: verificationData } = await supabase
      .from('user_broker_verification')
      .select('is_broker_verified, last_verified_at')
      .eq('user_id', userId)
      .single();

    // Get active connections for broker list
    const { data: connections } = await supabase
      .from('snaptrade_connections')
      .select('broker_slug')
      .eq('user_id', userId)
      .eq('disabled', false);

    // Map broker slugs to display names
    const brokers = connections?.map(c => 
      BROKER_DISPLAY_NAMES[c.broker_slug] || c.broker_slug
    ) || [];

    return NextResponse.json({
      verified: verificationData?.is_broker_verified || false,
      lastSync: verificationData?.last_verified_at,
      brokers: [...new Set(brokers)] // Remove duplicates
    });

  } catch (error: any) {
    console.error('Verification fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch verification status',
      details: error.message 
    }, { status: 500 });
  }
}
