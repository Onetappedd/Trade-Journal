/**
 * SnapTrade Connections Endpoint
 * Lists user connections and accounts with sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { listBrokerageAuthorizations } from '@/lib/snaptrade';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for accessing SnapTrade data
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's SnapTrade data (server-only access)
    const { data: snaptradeUser, error: userError } = await supabaseAdmin
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', user.id)
      .single();

    if (userError || !snaptradeUser) {
      console.log('User not registered with SnapTrade, returning empty connections');
      // Return empty connections if user hasn't registered yet
      return NextResponse.json({
        success: true,
        data: {
          connections: [],
          brokerVerified: false,
          lastVerifiedAt: null,
          totalConnections: 0,
          activeConnections: 0
        }
      });
    }

    // Get connections from SnapTrade API
    const authorizations = await listBrokerageAuthorizations(
      snaptradeUser.st_user_id,
      snaptradeUser.st_user_secret
    );

    // Get cached connections from database
    const { data: cachedConnections } = await supabaseAdmin
      .from('snaptrade_connections')
      .select('*')
      .eq('user_id', user.id);

    // Get accounts for these connections
    const { data: accounts } = await supabaseAdmin
      .from('snaptrade_accounts')
      .select('*')
      .eq('user_id', user.id);

    // Merge live data with cached data
    const enrichedConnections = authorizations.map(auth => {
      const cached = cachedConnections?.find(
        c => c.authorization_id === auth.id
      );
      
      const connectionAccounts = accounts?.filter(
        a => a.authorization_id === auth.id
      ) || [];
      
      return {
        id: auth.id,
        brokerId: auth.brokerage.id,
        brokerName: auth.brokerage.name,
        brokerSlug: auth.brokerage.slug,
        logoUrl: auth.brokerage.logoUrl,
        disabled: auth.disabled,
        createdDate: auth.createdDate,
        updatedDate: auth.updatedDate,
        cachedData: cached,
        accounts: connectionAccounts
      };
    });

    // Check Broker-Verified status from view
    const { data: verificationData } = await supabaseAdmin
      .from('user_broker_verification')
      .select('is_broker_verified, last_verified_at')
      .eq('user_id', user.id)
      .single();

    const brokerVerified = verificationData?.is_broker_verified || false;

    return NextResponse.json({
      success: true,
      data: {
        connections: enrichedConnections,
        brokerVerified,
        lastVerifiedAt: verificationData?.last_verified_at,
        totalConnections: authorizations.length,
        activeConnections: authorizations.filter(a => !a.disabled).length
      }
    });

  } catch (error: any) {
    console.error('Connections fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch connections',
      details: error.message 
    }, { status: 500 });
  }
}
