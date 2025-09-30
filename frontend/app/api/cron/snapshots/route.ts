/**
 * Daily Snapshots Cron Job
 * Takes account value snapshots for all users
 * 
 * Runs at midnight (0 0 * * *) via Vercel Cron
 * Requires CRON_SECRET environment variable for authentication
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/snapshots",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ 
        error: 'Cron secret not configured' 
      }, { status: 500 });
    }

    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron attempt');
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const startTime = Date.now();

    // Take snapshots for all users
    const { data, error } = await supabase.rpc('take_all_account_snapshots');

    const duration = Date.now() - startTime;

    if (error) {
      console.error('Snapshot cron failed:', error);
      return NextResponse.json({ 
        error: error.message,
        duration 
      }, { status: 500 });
    }

    // Count successful snapshots
    const successCount = data?.filter((r: any) => r.snapshot_taken).length || 0;
    const errorCount = data?.filter((r: any) => !r.snapshot_taken).length || 0;

    console.log(`Snapshots completed: ${successCount} successful, ${errorCount} errors in ${duration}ms`);

    return NextResponse.json({
      success: true,
      snapshots: {
        successful: successCount,
        errors: errorCount,
        total: data?.length || 0
      },
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Snapshot cron error:', error);
    return NextResponse.json({ 
      error: 'Failed to take snapshots',
      details: error.message 
    }, { status: 500 });
  }
}

// Optional: Support POST for manual trigger (authenticated)
export async function POST(req: NextRequest) {
  return GET(req);
}
