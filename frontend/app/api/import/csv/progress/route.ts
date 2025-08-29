import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { matchUserTrades } from '@/lib/matching/engine';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    // Get import job progress
    const { data: jobProgress, error: progressError } = await supabase
      .from('import_job_progress')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .single();

    if (progressError || !jobProgress) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    // Check if job is completed
    if (jobProgress.processed_rows >= jobProgress.total_rows && jobProgress.status === 'processing') {
      // Get final summary from import run
      const { data: importRun, error: runError } = await supabase
        .from('import_runs')
        .select('summary')
        .eq('id', jobProgress.import_run_id)
        .single();

      if (!runError && importRun) {
        const summary = importRun.summary || {};
        const errors = summary.errors || 0;
        const added = summary.added || 0;

        // Determine final status
        let finalStatus: 'success' | 'partial' | 'failed';
        if (errors > 0) {
          finalStatus = added > 0 ? 'partial' : 'failed';
        } else {
          finalStatus = 'success';
        }

        // Update job status
        await supabase
          .from('import_jobs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString()
          })
          .eq('id', jobId);

        // Update import run status
        await supabase
          .from('import_runs')
          .update({
            status: finalStatus,
            finished_at: new Date().toISOString()
          })
          .eq('id', jobProgress.import_run_id);

        // Run matching engine in background (fire-and-forget)
        try {
          await matchUserTrades({ 
            userId: user.id, 
            sinceImportRunId: jobProgress.import_run_id 
          });
        } catch (matchError) {
          console.error('Background matching error:', matchError);
          // Don't fail the request if matching fails
        }

        return NextResponse.json({
          processed: jobProgress.total_rows,
          total: jobProgress.total_rows,
          status: 'completed',
          finalStatus,
          summary: {
            added: summary.added || 0,
            duplicates: summary.duplicates || 0,
            errors: summary.errors || 0,
            total: jobProgress.total_rows
          },
          message: `Import ${finalStatus}`
        });
      }
    }

    // Return current progress
    return NextResponse.json({
      processed: jobProgress.processed_rows,
      total: jobProgress.total_rows,
      status: jobProgress.status,
      progressPercentage: jobProgress.progress_percentage,
      remainingRows: jobProgress.remaining_rows,
      message: `Processing... ${jobProgress.processed_rows}/${jobProgress.total_rows} rows`
    });

  } catch (error) {
    console.error('Progress check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
