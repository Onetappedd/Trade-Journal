import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { ImportRunsResponse, ImportFilters } from '../../../../lib/types/imports';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    let query = supabase
      .from('import_runs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (source) {
      query = query.eq('source', source);
    }
    if (dateFrom) {
      query = query.gte('started_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('started_at', dateTo);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: items, error, count } = await query;

    if (error) {
      console.error('Error fetching import runs:', error);
      return NextResponse.json({ error: 'Failed to fetch import runs' }, { status: 500 });
    }

    const response: ImportRunsResponse = {
      items: items || [],
      total: count || 0,
      page,
      limit
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in import runs API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
