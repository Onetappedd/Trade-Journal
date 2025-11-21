import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { matchUserTrades } from '@/lib/matching/engine';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * Re-match Trades API
 * Deletes all existing trades and re-runs the matching engine on all executions
 * This is useful when the matching logic has been updated and existing trades need to be corrected
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const supabase = await createSupabaseWithToken(request);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 });
    }

    // Delete all existing trades for this user
    console.log(`Deleting all existing trades for user ${user.id}...`);
    const { error: deleteError, count } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', user.id)
      .select('*', { count: 'exact', head: true });
    
    if (deleteError) {
      console.error('Error deleting trades:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete existing trades', 
        details: deleteError.message 
      }, { status: 500 });
    }
    
    console.log(`Deleted ${count || 0} existing trades`);

    // Re-run matching on all executions
    console.log(`Re-running matching for user ${user.id}...`);
    const result = await matchUserTrades({ 
      userId: user.id,
      supabase
    });

    // Revalidate cache
    revalidateTag('trades');
    revalidateTag('kpi');

    return NextResponse.json({ 
      success: true, 
      deletedTrades: count || 0,
      result 
    });
  } catch (error: any) {
    console.error('Re-match error:', error);
    return NextResponse.json(
      { error: 'Failed to re-match trades', details: error.message },
      { status: 500 }
    );
  }
}

