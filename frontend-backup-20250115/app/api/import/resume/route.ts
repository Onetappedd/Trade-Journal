import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// Force Node.js runtime
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
    const importRunId = searchParams.get('importRunId');

    if (!importRunId) {
      return NextResponse.json({ error: 'Import run ID is required' }, { status: 400 });
    }

    // Get resume information for this import run
    const { data: resumeInfo, error } = await supabase.rpc('get_import_resume_info', {
      p_import_run_id: importRunId
    });

    if (error) {
      console.error('Error getting resume info:', error);
      return NextResponse.json({ error: 'Failed to get resume information' }, { status: 500 });
    }

    if (!resumeInfo || resumeInfo.length === 0) {
      return NextResponse.json({ error: 'Import run not found' }, { status: 404 });
    }

    const info = resumeInfo[0];
    
    return NextResponse.json({
      canResume: info.can_resume,
      resumeToken: info.resume_token,
      lastRowIndex: info.last_row_index,
      processedBytes: info.processed_bytes,
      totalBytes: info.total_bytes,
      totalRows: info.total_rows,
      progressPercentage: info.total_bytes > 0 ? Math.round((info.processed_bytes / info.total_bytes) * 100) : 0
    });

  } catch (error) {
    console.error('Resume check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
    }

    const body = await request.json();
    const { importRunId, resumeToken } = body;

    if (!importRunId || !resumeToken) {
      return NextResponse.json({ error: 'Import run ID and resume token are required' }, { status: 400 });
    }

    // Verify the resume token matches the import run
    const { data: importRun, error: runError } = await supabase
      .from('import_runs')
      .select('id, resume_token, status, user_id')
      .eq('id', importRunId)
      .eq('resume_token', resumeToken)
      .eq('user_id', user.id)
      .single();

    if (runError || !importRun) {
      return NextResponse.json({ error: 'Invalid resume token or import run not found' }, { status: 400 });
    }

    if (importRun.status !== 'processing') {
      return NextResponse.json({ error: 'Import run is not in processing state' }, { status: 400 });
    }

    // Return success - the client can now proceed with resume
    return NextResponse.json({
      message: 'Resume token verified successfully',
      importRunId: importRun.id,
      resumeToken: importRun.resume_token
    });

  } catch (error) {
    console.error('Resume verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
