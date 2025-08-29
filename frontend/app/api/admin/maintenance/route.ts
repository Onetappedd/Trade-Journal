import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// Vercel Cron Configuration:
// Schedule: 0 3 * * * (daily at 3 AM UTC)
// URL: GET https://YOURDOMAIN/api/admin/maintenance
// Headers: x-cron-secret: <MAINTENANCE_CRON_SECRET>
//
// To set up in Vercel:
// 1. Add MAINTENANCE_CRON_SECRET to environment variables
// 2. Create vercel.json with cron configuration:
// {
//   "crons": [{
//     "path": "/api/admin/maintenance",
//     "schedule": "0 3 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Check if maintenance is enabled
    if (process.env.CRON_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Maintenance disabled - CRON_ENABLED not set to true' },
        { status: 503 }
      );
    }

    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.MAINTENANCE_CRON_SECRET;
    
    if (!expectedSecret) {
      console.error('MAINTENANCE_CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Maintenance secret not configured' },
        { status: 500 }
      );
    }

    if (cronSecret !== expectedSecret) {
      console.error('Invalid cron secret provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getServerSupabase();
    const summary = {
      timestamp: new Date().toISOString(),
      stuckRunsMarked: 0,
      tempUploadsPurged: 0,
      importJobsCompacted: 0,
      errors: [] as string[]
    };

    // Step 1: Mark stuck runs (>24h processing) as failed
    try {
      const { data: stuckRuns, error: stuckError } = await supabase.rpc('mark_stuck_import_runs');
      
      if (stuckError) {
        console.error('Error marking stuck runs:', stuckError);
        summary.errors.push(`Failed to mark stuck runs: ${stuckError.message}`);
      } else {
        summary.stuckRunsMarked = stuckRuns || 0;
        console.log(`Marked ${summary.stuckRunsMarked} stuck import runs as failed`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      summary.errors.push(`Exception marking stuck runs: ${errorMessage}`);
    }

    // Step 2: Purge temp_uploads older than 24h
    try {
      const { data: purgedUploads, error: purgeError } = await supabase.rpc('cleanup_temp_uploads');
      
      if (purgeError) {
        console.error('Error purging temp uploads:', purgeError);
        summary.errors.push(`Failed to purge temp uploads: ${purgeError.message}`);
      } else {
        summary.tempUploadsPurged = purgedUploads || 0;
        console.log(`Purged ${summary.tempUploadsPurged} old temp uploads`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      summary.errors.push(`Exception purging temp uploads: ${errorMessage}`);
    }

    // Step 3: Compact import_jobs rows older than 7 days
    try {
      const { data: compactedJobs, error: compactError } = await supabase.rpc('compact_old_import_jobs');
      
      if (compactError) {
        console.error('Error compacting import jobs:', compactError);
        summary.errors.push(`Failed to compact import jobs: ${compactError.message}`);
      } else {
        summary.importJobsCompacted = compactedJobs || 0;
        console.log(`Compacted ${summary.importJobsCompacted} old import job records`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      summary.errors.push(`Exception compacting import jobs: ${errorMessage}`);
    }

    // Log summary
    console.log('Maintenance completed:', {
      stuckRunsMarked: summary.stuckRunsMarked,
      tempUploadsPurged: summary.tempUploadsPurged,
      importJobsCompacted: summary.importJobsCompacted,
      errors: summary.errors.length
    });

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Maintenance route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
