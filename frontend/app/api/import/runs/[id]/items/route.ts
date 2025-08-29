import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'error' | 'duplicate' | 'parsed' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const supabase = getServerSupabase();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the import run belongs to the user
    const { data: run, error: runError } = await supabase
      .from('import_runs')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (runError || !run || run.user_id !== user.id) {
      return NextResponse.json({ error: 'Import run not found' }, { status: 404 });
    }

    // Build query for raw import items
    let query = supabase
      .from('raw_import_items')
      .select('id, source_line, status, error, raw_payload, created_at')
      .eq('import_run_id', params.id)
      .order('source_line', { ascending: true });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('raw_import_items')
      .select('*', { count: 'exact', head: true })
      .eq('import_run_id', params.id)
      .eq(status ? 'status' : 'id', status || 'id');

    if (countError) {
      console.error('Error getting count:', countError);
      return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
    }

    // Get paginated items
    const { data: items, error: itemsError } = await query
      .range(offset, offset + limit - 1);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json({
      items: items || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Import run items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
