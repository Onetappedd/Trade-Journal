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

    // Get import run details directly (jobId is now always the import run ID)
    const { data: importRun, error: runError } = await supabase
      .from('import_runs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (runError || !importRun) {
      return NextResponse.json({ error: 'Invalid import run ID' }, { status: 400 });
    }

    // Create a progress object from the import run
    const jobProgress = {
      processed_rows: (importRun.summary?.added || 0) + (importRun.summary?.duplicates || 0) + (importRun.summary?.errors || 0),
      total_rows: importRun.summary?.total || 0,
      status: importRun.status,
      import_run_id: importRun.id
    };

    // Check if job is completed - consider all processed rows (added + duplicates + errors)
    if (jobProgress.processed_rows >= jobProgress.total_rows && importRun.status === 'processing') {
      // Get final summary from import run (already have it)
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

      // Update import run status
      await supabase
        .from('import_runs')
        .update({
          status: finalStatus,
          finished_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Run matching engine in background (fire-and-forget)
      try {
        await matchUserTrades({ 
          userId: user.id, 
          sinceImportRunId: jobId 
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

    // Return current progress
    const progressPercentage = jobProgress.total_rows > 0 
      ? Math.round((jobProgress.processed_rows / jobProgress.total_rows) * 100) 
      : 0;
    const remainingRows = Math.max(0, jobProgress.total_rows - jobProgress.processed_rows);
    
    return NextResponse.json({
      processed: jobProgress.processed_rows,
      total: jobProgress.total_rows,
      status: jobProgress.status,
      progressPercentage: progressPercentage,
      remainingRows: remainingRows,
      message: `Processing... ${jobProgress.processed_rows}/${jobProgress.total_rows} rows`
    });

  } catch (error) {
    console.error('Progress check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
