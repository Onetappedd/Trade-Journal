/**
 * SnapTrade Connection Portal Endpoint
 * Generates connection portal URL that expires in 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getConnectionPortalUrl } from '@/lib/snaptrade';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's SnapTrade data (server-only access)
    const { data: snaptradeUser, error: userError } = await supabase
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', user.id)
      .single();

    if (userError || !snaptradeUser) {
      return NextResponse.json({ error: 'User not registered with SnapTrade' }, { status: 400 });
    }

    // Generate connection portal URL
    const portalUrl = await getConnectionPortalUrl(
      snaptradeUser.st_user_id,
      snaptradeUser.st_user_secret
    );

    return NextResponse.json({
      success: true,
      data: {
        portalUrl,
        expiresIn: 300 // 5 minutes in seconds
      }
    });

  } catch (error: any) {
    console.error('Connection portal error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate connection portal',
      details: error.message 
    }, { status: 500 });
  }
}
