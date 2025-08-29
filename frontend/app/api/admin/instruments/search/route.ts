import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { withTelemetry } from '@/lib/observability/withTelemetry';

async function searchInstrumentsHandler(request: NextRequest) {
  const supabase = getServerSupabase();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin (you can implement your own admin check)
  // For now, we'll allow any authenticated user - implement proper admin check in production
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    // Search instruments with execution and alias counts
    const { data: instruments, error } = await supabase
      .from('instruments')
      .select(`
        *,
        execution_count:executions_normalized(count),
        alias_count:instrument_aliases(count)
      `)
      .or(`symbol.ilike.%${query}%,exchange.ilike.%${query}%`)
      .order('symbol')
      .limit(20);

    if (error) {
      console.error('Error searching instruments:', error);
      return NextResponse.json({ error: 'Failed to search instruments' }, { status: 500 });
    }

    // Also search instrument aliases
    const { data: aliases, error: aliasError } = await supabase
      .from('instrument_aliases')
      .select(`
        alias_symbol,
        instruments (
          *,
          execution_count:executions_normalized(count),
          alias_count:instrument_aliases(count)
        )
      `)
      .ilike('alias_symbol', `%${query}%`)
      .limit(10);

    if (aliasError) {
      console.error('Error searching aliases:', aliasError);
      // Continue without aliases
    }

    // Combine results and deduplicate
    const allInstruments = new Map();
    
    // Add direct instrument matches
    instruments?.forEach(instrument => {
      allInstruments.set(instrument.id, {
        ...instrument,
        execution_count: instrument.execution_count?.[0]?.count || 0,
        alias_count: instrument.alias_count?.[0]?.count || 0,
      });
    });

    // Add instruments found via aliases
    aliases?.forEach(alias => {
      const instrument = alias.instruments as any;
      if (instrument && !allInstruments.has(instrument.id)) {
        allInstruments.set(instrument.id, {
          ...instrument,
          execution_count: instrument.execution_count?.[0]?.count || 0,
          alias_count: instrument.alias_count?.[0]?.count || 0,
          matched_via: `alias: ${alias.alias_symbol}`,
        });
      }
    });

    const results = Array.from(allInstruments.values())
      .sort((a, b) => {
        // Sort by exact symbol match first, then alphabetically
        const aExact = a.symbol.toLowerCase() === query.toLowerCase();
        const bExact = b.symbol.toLowerCase() === query.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 20);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export with telemetry wrapper
export const GET = withTelemetry(searchInstrumentsHandler, {
  route: '/api/admin/instruments/search',
  redactFields: [],
});
