import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { requireAdminAccess, createAccessDeniedResponse } from '@/lib/server-access-control';
import { captureException } from '@/lib/monitoring';

// Initialize Sentry monitoring for API routes
import '@/lib/monitoring';

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

    // Verify cron secret for automated runs
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.MAINTENANCE_CRON_SECRET;
    
    if (!expectedSecret) {
      console.error('MAINTENANCE_CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Maintenance secret not configured' },
        { status: 500 }
      );
    }

    // If cron secret is provided, this is an automated run
    if (cronSecret === expectedSecret) {
      console.log('Maintenance triggered via cron with valid secret');
    } else {
      // No cron secret or invalid secret - require admin authentication
      try {
        const { userId } = await requireAdminAccess(request);
        console.log(`Maintenance triggered manually by admin user: ${userId}`);
      } catch (accessError) {
        console.error('Admin access denied for maintenance:', accessError);
        return createAccessDeniedResponse('Admin access required for manual maintenance');
      }
    }

    const supabase = getServerSupabase();
    const summary = {
      timestamp: new Date().toISOString(),
      triggered_by: cronSecret === expectedSecret ? 'cron' : 'admin',
      admin_user_id: cronSecret !== expectedSecret ? (await requireAdminAccess(request)).userId : null,
      results: {
        stuckRunsMarked: 0,
        tempUploadsPurged: 0,
        importJobsCompacted: 0,
        total_items_processed: 0
      },
      errors: [] as string[],
      warnings: [] as string[],
      duration_ms: 0
    };

    const startTime = Date.now();

    // Step 1: Mark stuck runs (>24h processing) as failed
    try {
      const { data: stuckRuns, error: stuckError } = await supabase.rpc('mark_stuck_import_runs');
      
      if (stuckError) {
        console.error('Error marking stuck runs:', stuckError);
        summary.errors.push(`Failed to mark stuck runs: ${stuckError.message}`);
        // Report to Sentry for monitoring
        captureException(new Error(`Maintenance: Failed to mark stuck runs - ${stuckError.message}`), {
          tags: { maintenance_step: 'mark_stuck_runs', error_type: 'database_error' },
          extra: { error: stuckError }
        });
      } else {
        summary.results.stuckRunsMarked = stuckRuns || 0;
        summary.results.total_items_processed += summary.results.stuckRunsMarked;
        console.log(`Marked ${summary.results.stuckRunsMarked} stuck import runs as failed`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      summary.errors.push(`Exception marking stuck runs: ${errorMessage}`);
      // Report to Sentry for monitoring
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        tags: { maintenance_step: 'mark_stuck_runs', error_type: 'exception' },
        extra: { error }
      });
    }

    // Step 2: Purge temp_uploads older than 24h
    try {
      const { data: purgedUploads, error: purgeError } = await supabase.rpc('cleanup_temp_uploads');
      
      if (purgeError) {
        console.error('Error purging temp uploads:', purgeError);
        summary.errors.push(`Failed to purge temp uploads: ${purgeError.message}`);
        // Report to Sentry for monitoring
        captureException(new Error(`Maintenance: Failed to purge temp uploads - ${purgeError.message}`), {
          tags: { maintenance_step: 'cleanup_temp_uploads', error_type: 'database_error' },
          extra: { error: purgeError }
        });
      } else {
        summary.results.tempUploadsPurged = purgedUploads || 0;
        summary.results.total_items_processed += summary.results.tempUploadsPurged;
        console.log(`Purged ${summary.results.tempUploadsPurged} old temp uploads`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      summary.errors.push(`Exception purging temp uploads: ${errorMessage}`);
      // Report to Sentry for monitoring
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        tags: { maintenance_step: 'cleanup_temp_uploads', error_type: 'exception' },
        extra: { error }
      });
    }

    // Step 3: Compact import_jobs rows older than 7 days
    try {
      const { data: compactedJobs, error: compactError } = await supabase.rpc('compact_old_import_jobs');
      
      if (compactError) {
        console.error('Error compacting import jobs:', compactError);
        summary.errors.push(`Failed to compact import jobs: ${compactError.message}`);
        // Report to Sentry for monitoring
        captureException(new Error(`Maintenance: Failed to compact import jobs - ${compactError.message}`), {
          tags: { maintenance_step: 'compact_import_jobs', error_type: 'database_error' },
          extra: { error: compactError }
        });
      } else {
        summary.results.importJobsCompacted = compactedJobs || 0;
        summary.results.total_items_processed += summary.results.importJobsCompacted;
        console.log(`Compacted ${summary.results.importJobsCompacted} old import job records`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      summary.errors.push(`Exception compacting import jobs: ${errorMessage}`);
      // Report to Sentry for monitoring
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        tags: { maintenance_step: 'compact_import_jobs', error_type: 'exception' },
        extra: { error }
      });
    }

    // Calculate duration and finalize summary
    summary.duration_ms = Date.now() - startTime;
    
    // Add warnings if no items were processed
    if (summary.results.total_items_processed === 0) {
      summary.warnings.push('No maintenance items were processed - this may indicate the system is already clean');
    }
    
    // Add warnings if there were errors
    if (summary.errors.length > 0) {
      summary.warnings.push(`${summary.errors.length} maintenance step(s) encountered errors`);
    }

    // Log comprehensive summary
    console.log('Maintenance completed:', {
      triggered_by: summary.triggered_by,
      admin_user_id: summary.admin_user_id,
      duration_ms: summary.duration_ms,
      results: summary.results,
      errors_count: summary.errors.length,
      warnings_count: summary.warnings.length
    });

    // Report successful maintenance to Sentry for monitoring
    if (summary.errors.length === 0) {
      captureException(new Error('Maintenance completed successfully'), {
        tags: { 
          maintenance_status: 'success',
          triggered_by: summary.triggered_by,
          items_processed: summary.results.total_items_processed.toString()
        }
      });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Maintenance route error:', error);
    
    // Report critical errors to Sentry
    captureException(error instanceof Error ? error : new Error('Maintenance route error'), {
      tags: { 
        maintenance_status: 'critical_error',
        error_type: 'route_exception'
      },
      extra: { error }
    });
    
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

/**
 * POST method for manual maintenance triggering with additional security
 * Requires admin access and can include specific maintenance options
 */
export async function POST(request: NextRequest) {
  try {
    // Always require admin access for POST requests
    const { userId } = await requireAdminAccess(request);
    
    // Check if maintenance is enabled
    if (process.env.CRON_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Maintenance disabled - CRON_ENABLED not set to true' },
        { status: 503 }
      );
    }

    // Parse request body for specific maintenance options
    const body = await request.json().catch(() => ({}));
    const { force = false, steps = ['all'] } = body;

    console.log(`Manual maintenance triggered by admin user: ${userId}`, { force, steps });

    // For now, we'll just call the GET method logic
    // In the future, this could support selective maintenance steps
    const getRequest = new NextRequest(request.url, {
      method: 'GET',
      headers: request.headers
    });

    // Add a flag to indicate this was manually triggered
    getRequest.headers.set('x-manual-trigger', 'true');
    getRequest.headers.set('x-admin-user-id', userId);

    return GET(getRequest);

  } catch (error) {
    // Check if it's an access error
    if (error instanceof Error && error.message.includes('Admin access required')) {
      console.error('Admin access denied for manual maintenance:', error);
      return createAccessDeniedResponse('Admin access required for manual maintenance');
    }
    
    console.error('Manual maintenance error:', error);
    
    // Report critical errors to Sentry
    captureException(error instanceof Error ? error : new Error('Manual maintenance error'), {
      tags: { 
        maintenance_status: 'manual_trigger_error',
        error_type: 'route_exception'
      },
      extra: { error }
    });
    
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
