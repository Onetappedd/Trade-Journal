import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { createApiError, createApiSuccess, ERROR_CODES } from '@/src/types/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Test database connection
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol, side, quantity, entry_price, exit_price, entry_date, exit_date, status')
      .eq('user_id', user.id)
      .limit(5);

    if (tradesError) {
      console.error('Database error:', tradesError);
      return NextResponse.json(
        createApiError(ERROR_CODES.DATABASE_ERROR, 'Database connection failed', tradesError.message),
        { status: 500 }
      );
    }

    return NextResponse.json(createApiSuccess({
      user: {
        id: user.id,
        email: user.email
      },
      trades: trades || [],
      tradeCount: trades?.length || 0,
      message: 'Dashboard test successful'
    }));

  } catch (error: any) {
    console.error('Dashboard test error:', error);
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Test failed', error.message),
      { status: 500 }
    );
  }
}
