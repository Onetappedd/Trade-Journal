import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // Delete all trades for the user
    const { data: trades, error: deleteError } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', user.id)
      .select('id');

    if (deleteError) {
      console.error('Error deleting trades:', deleteError);
      return NextResponse.json({ error: 'Failed to delete trades', details: deleteError.message }, { status: 500 });
    }

    // Also delete all executions for the user
    const { error: deleteExecutionsError } = await supabase
      .from('executions_normalized')
      .delete()
      .eq('user_id', user.id);

    if (deleteExecutionsError) {
      console.error('Error deleting executions:', deleteExecutionsError);
      // Don't fail the request if executions deletion fails, just log it
    }

    const deletedCount = trades?.length || 0;

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} trades and associated executions`
    });

  } catch (error) {
    console.error('Error in delete all trades API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
