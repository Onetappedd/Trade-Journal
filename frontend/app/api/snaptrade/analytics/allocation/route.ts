/**
 * SnapTrade Allocation Endpoint
 * Returns portfolio allocation breakdown (by asset type, positions)
 * 
 * GET /api/snaptrade/analytics/allocation?userId=uuid
 * Returns: { byAssetType, byPosition, totalValue }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { snaptrade } from "@/lib/snaptrade";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId parameter required' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's SnapTrade credentials
    const { data: snaptradeUser } = await supabase
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', userId)
      .single();

    if (!snaptradeUser) {
      return NextResponse.json({ 
        error: 'User not registered with SnapTrade' 
      }, { status: 404 });
    }

    // Get all accounts
    const { data: accounts } = await supabase
      .from('snaptrade_accounts')
      .select('account_id, total_value')
      .eq('user_id', userId);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        byAssetType: [],
        byPosition: [],
        totalValue: 0
      });
    }

    // Fetch positions for each account
    const allPositions: any[] = [];
    let totalValue = 0;

    for (const account of accounts) {
      try {
        const response = await snaptrade.accountInformation.getUserAccountPositions({
          userId: snaptradeUser.st_user_id,
          userSecret: snaptradeUser.st_user_secret,
          accountId: account.account_id
        });

        allPositions.push(...response.data);
        totalValue += account.total_value || 0;
      } catch (error) {
        console.error(`Failed to fetch positions for account ${account.account_id}:`, error);
      }
    }

    // Group by asset type
    const byAssetTypeMap = new Map<string, number>();
    
    for (const position of allPositions) {
      const assetType = position.symbol?.asset_type || 'Unknown';
      const value = position.market_value || 0;
      byAssetTypeMap.set(assetType, (byAssetTypeMap.get(assetType) || 0) + value);
    }

    const byAssetType = Array.from(byAssetTypeMap.entries()).map(([type, value]) => ({
      name: type,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    }));

    // Top positions
    const byPosition = allPositions
      .map(pos => ({
        symbol: pos.symbol?.symbol || 'Unknown',
        name: pos.symbol?.name || pos.symbol?.symbol || 'Unknown',
        assetType: pos.symbol?.asset_type || 'Unknown',
        value: pos.market_value || 0,
        quantity: pos.quantity || 0,
        percentage: totalValue > 0 ? ((pos.market_value || 0) / totalValue) * 100 : 0,
        costBasis: pos.average_price ? (pos.average_price * (pos.quantity || 0)) : 0,
        unrealizedPnL: (pos.market_value || 0) - (pos.average_price ? (pos.average_price * (pos.quantity || 0)) : 0)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 positions

    return NextResponse.json({
      byAssetType,
      byPosition,
      totalValue,
      positionCount: allPositions.length
    });

  } catch (error: any) {
    console.error('Allocation fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch allocation',
      details: error.message 
    }, { status: 500 });
  }
}
