/**
 * SnapTrade Equity Curve Endpoint
 * Returns total account value over time for equity curve chart
 * 
 * GET /api/snaptrade/analytics/equity-curve?userId=uuid&days=30
 * Returns: { dataPoints: Array<{ date, totalValue }>, currentValue, change, changePercent }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId parameter required' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get historical snapshots (you'll store these via a daily cron job)
    const { data: snapshots } = await supabase
      .from('account_value_snapshots')
      .select('snapshot_date, total_value')
      .eq('user_id', userId)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('snapshot_date', { ascending: true });

    // Get current total value from all accounts
    const { data: accounts } = await supabase
      .from('snaptrade_accounts')
      .select('total_value')
      .eq('user_id', userId);

    const currentValue = accounts?.reduce((sum, acc) => sum + (acc.total_value || 0), 0) || 0;

    // Build data points
    const dataPoints = snapshots?.map(s => ({
      date: s.snapshot_date,
      totalValue: s.total_value
    })) || [];

    // Add current value as latest point
    if (currentValue > 0) {
      dataPoints.push({
        date: new Date().toISOString(),
        totalValue: currentValue
      });
    }

    // Calculate change
    const startValue = dataPoints[0]?.totalValue || currentValue;
    const change = currentValue - startValue;
    const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

    return NextResponse.json({
      dataPoints,
      currentValue,
      startValue,
      change,
      changePercent,
      days
    });

  } catch (error: any) {
    console.error('Equity curve fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch equity curve',
      details: error.message 
    }, { status: 500 });
  }
}
