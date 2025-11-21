import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { createApiError, createApiSuccess, ERROR_CODES } from '@/src/types/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'No authorization token provided'),
        { status: 401 }
      );
    }

    const supabase = await createSupabaseWithToken(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', authError?.message),
        { status: 401 }
      );
    }

    const importRunId = params.id;

    // Get import run status
    const { data: importRun, error: importError } = await supabase
      .from('import_runs')
      .select('*')
      .eq('id', importRunId)
      .eq('user_id', user.id)
      .single();

    if (importError || !importRun) {
      return NextResponse.json(
        createApiError(ERROR_CODES.NOT_FOUND, 'Import run not found'),
        { status: 404 }
      );
    }

    // Get matching jobs status
    const { data: matchingJobs, error: jobsError } = await supabase
      .from('matching_jobs')
      .select('status, processed_count, total_count')
      .eq('import_run_id', importRunId);

    if (jobsError) {
      console.error('Error fetching matching jobs:', jobsError);
    }

    const totalProcessed = matchingJobs?.reduce((sum, job) => sum + (job.processed_count || 0), 0) || 0;
    const totalCount = matchingJobs?.reduce((sum, job) => sum + (job.total_count || 0), 0) || 0;
    const hasFailedJobs = matchingJobs?.some(job => job.status === 'failed') || false;
    const allJobsComplete = matchingJobs?.every(job => job.status === 'completed' || job.status === 'failed') || false;

    let status = 'processing';
    let message = 'Processing trades...';
    let progress = 0;

    if (importRun.status === 'completed') {
      status = 'completed';
      message = `Import completed! ${totalProcessed} trades imported successfully.`;
      progress = 100;
    } else if (importRun.status === 'failed' || hasFailedJobs) {
      status = 'failed';
      message = importRun.error_message || 'Import failed';
      progress = 0;
    } else if (importRun.status === 'processing') {
      if (totalCount > 0) {
        progress = Math.min(90, (totalProcessed / totalCount) * 100);
        message = `Processing trades... ${totalProcessed}/${totalCount}`;
      } else {
        progress = 30;
        message = 'Parsing CSV file...';
      }
    }

    return NextResponse.json(createApiSuccess({
      status,
      message,
      progress,
      importedCount: totalProcessed,
      totalCount,
      error: importRun.error_message,
    }));

  } catch (error: any) {
    console.error('Import status API error:', error);
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to get import status', error.message),
      { status: 500 }
    );
  }
}
