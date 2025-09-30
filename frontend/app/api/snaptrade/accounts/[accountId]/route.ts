/**
 * SnapTrade Account Data Endpoint
 * Gets account data with holdings and sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAccountBalance } from '@/lib/snaptrade';

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = params;

    // Get user's SnapTrade data (server-only access)
    const { data: snaptradeUser, error: userError } = await supabase
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', user.id)
      .single();

    if (userError || !snaptradeUser) {
      return NextResponse.json({ error: 'User not registered with SnapTrade' }, { status: 400 });
    }

    // Get account data from SnapTrade
    const { account, balance } = await getAccountBalance(
      snaptradeUser.st_user_id,
      snaptradeUser.st_user_secret,
      accountId
    );

    // Get cached account data
    const { data: cachedAccount } = await supabase
      .from('snaptrade_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .single();

    // Check if data needs syncing (older than 1 hour)
    const needsSync = !cachedAccount || 
      new Date(cachedAccount.last_successful_holdings_sync || 0) < new Date(Date.now() - 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: {
        account,
        balance,
        cached: cachedAccount,
        needsSync,
        lastSync: cachedAccount?.last_successful_holdings_sync || account.syncDate
      }
    });

  } catch (error: any) {
    console.error('Account data fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch account data',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = params;

    // Get user's SnapTrade data (server-only access)
    const { data: snaptradeUser, error: userError } = await supabase
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', user.id)
      .single();

    if (userError || !snaptradeUser) {
      return NextResponse.json({ error: 'User not registered with SnapTrade' }, { status: 400 });
    }

    // Get updated account data (fetching from SnapTrade triggers sync)
    const { account, balance } = await getAccountBalance(
      snaptradeUser.st_user_id,
      snaptradeUser.st_user_secret,
      accountId
    );

    // Update cached data
    const { error: updateError } = await supabase
      .from('snaptrade_accounts')
      .upsert({
        user_id: user.id,
        account_id: accountId,
        authorization_id: account.brokerageAuthorization,
        name: account.name,
        number: account.number,
        total_value: balance.total,
        currency: balance.currency,
        last_successful_holdings_sync: new Date().toISOString()
      });

    if (updateError) {
      console.error('Cache update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        account,
        balance,
        synced: true,
        lastSync: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Account sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync account',
      details: error.message 
    }, { status: 500 });
  }
}
