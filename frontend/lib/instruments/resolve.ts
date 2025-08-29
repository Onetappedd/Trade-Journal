import { getServerSupabase } from '@/lib/supabase/server';

export interface ExecutionLike {
  symbol?: string;
  occ_symbol?: string;
  futures_symbol?: string;
  expiry?: string;
  strike?: number;
  option_type?: 'call' | 'put';
  underlying?: string;
  multiplier?: number;
  instrument_type?: 'equity' | 'option' | 'future';
  venue?: string;
}

export interface ResolvedInstrument {
  instrument_id: string;
  normalized: {
    unique_symbol: string;
    instrument_type: 'equity' | 'option' | 'future';
    multiplier: number;
    meta: Record<string, any>;
  };
}

// Futures contract specifications
const FUTURES_SPECS: Record<string, { multiplier: number; tick_value: number; description?: string }> = {
  ES: { multiplier: 50, tick_value: 12.5, description: 'E-mini S&P 500' },
  NQ: { multiplier: 20, tick_value: 5, description: 'E-mini NASDAQ-100' },
  YM: { multiplier: 5, tick_value: 5, description: 'E-mini Dow' },
  RTY: { multiplier: 50, tick_value: 5, description: 'E-mini Russell 2000' },
  CL: { multiplier: 1000, tick_value: 10, description: 'Crude Oil' },
  GC: { multiplier: 100, tick_value: 10, description: 'Gold' },
  SI: { multiplier: 5000, tick_value: 25, description: 'Silver' },
  ZB: { multiplier: 1000, tick_value: 31.25, description: 'US Treasury Bond' },
  ZN: { multiplier: 1000, tick_value: 15.625, description: 'US Treasury Note' },
  EUR: { multiplier: 125000, tick_value: 12.5, description: 'Euro FX' },
  GBP: { multiplier: 62500, tick_value: 6.25, description: 'British Pound' },
  JPY: { multiplier: 12500000, tick_value: 12.5, description: 'Japanese Yen' },
};

// Month codes for futures
const MONTH_CODES: Record<string, string> = {
  F: '01', G: '02', H: '03', J: '04', K: '05', M: '06',
  N: '07', Q: '08', U: '09', V: '10', X: '11', Z: '12'
};

/**
 * Normalize equity symbol
 */
function normalizeEquitySymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/\.(US|N|O|A)$/, '');
}

/**
 * Parse OCC symbol (e.g., SPY240216C00450000)
 */
function parseOccSymbol(occSymbol: string): {
  underlying: string;
  expiry: string;
  type: 'call' | 'put';
  strike: number;
} | null {
  // OCC format: ROOT + YYMMDD + C/P + STRIKE*1000
  const match = occSymbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) return null;

  const [, root, yymmdd, type, strikeStr] = match;
  const year = '20' + yymmdd.substring(0, 2);
  const month = yymmdd.substring(2, 4);
  const day = yymmdd.substring(4, 6);
  const expiry = `${year}-${month}-${day}`;
  const strike = parseInt(strikeStr) / 1000;

  return {
    underlying: root,
    expiry,
    type: type === 'C' ? 'call' : 'put',
    strike
  };
}

/**
 * Build OCC symbol from components
 */
function buildOccSymbol(underlying: string, expiry: string, type: 'call' | 'put', strike: number): string {
  const date = new Date(expiry);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const yymmdd = yy + mm + dd;
  const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0');
  
  return `${underlying}${yymmdd}${type.toUpperCase()}${strikeStr}`;
}

/**
 * Parse futures symbol (e.g., ESZ5, NQH24)
 */
function parseFuturesSymbol(futuresSymbol: string): {
  root: string;
  month: string;
  year: string;
  expiry: string;
} | null {
  // Format: ROOT + MONTH_CODE + YEAR (e.g., ESZ5, NQH24)
  const match = futuresSymbol.match(/^([A-Z]+)([A-Z])(\d{1,2})$/);
  if (!match) return null;

  const [, root, monthCode, yearStr] = match;
  const month = MONTH_CODES[monthCode];
  if (!month) return null;

  // Handle 2-digit years (5 = 2025, 24 = 2024)
  const year = yearStr.length === 1 ? `202${yearStr}` : `20${yearStr}`;
  const expiry = `${year}-${month}-01`; // First day of contract month

  return {
    root,
    month: monthCode,
    year: yearStr,
    expiry
  };
}

/**
 * Resolve instrument and create/update in database
 */
export async function resolveInstrument(exec: Partial<ExecutionLike>): Promise<ResolvedInstrument> {
  const supabase = getServerSupabase();
  
  // Determine instrument type
  const instrumentType = exec.instrument_type || 
    (exec.occ_symbol ? 'option' : 
     exec.futures_symbol ? 'future' : 'equity');

  if (instrumentType === 'equity') {
    return await resolveEquity(exec, supabase);
  } else if (instrumentType === 'option') {
    return await resolveOption(exec, supabase);
  } else if (instrumentType === 'future') {
    return await resolveFuture(exec, supabase);
  }

  throw new Error(`Unknown instrument type: ${instrumentType}`);
}

/**
 * Resolve equity instrument
 */
async function resolveEquity(exec: Partial<ExecutionLike>, supabase: any): Promise<ResolvedInstrument> {
  if (!exec.symbol) {
    throw new Error('Symbol required for equity instrument');
  }

  const normalizedSymbol = normalizeEquitySymbol(exec.symbol);
  const uniqueSymbol = `EQ:${normalizedSymbol}`;

  // Check if instrument exists
  const { data: existing } = await supabase
    .from('instruments')
    .select('id, multiplier, meta')
    .eq('unique_symbol', uniqueSymbol)
    .single();

  if (existing) {
    return {
      instrument_id: existing.id,
      normalized: {
        unique_symbol: uniqueSymbol,
        instrument_type: 'equity',
        multiplier: existing.multiplier,
        meta: existing.meta || {}
      }
    };
  }

  // Create new instrument
  const { data: instrument, error } = await supabase
    .from('instruments')
    .insert({
      unique_symbol: uniqueSymbol,
      instrument_type: 'equity',
      multiplier: 1,
      meta: {
        exchange: exec.venue || 'UNKNOWN',
        description: `${normalizedSymbol} Stock`
      }
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create equity instrument: ${error.message}`);

  // Add alias for the raw symbol
  await supabase
    .from('instrument_aliases')
    .insert({
      instrument_id: instrument.id,
      source: 'csv',
      alias_symbol: exec.symbol
    });

  return {
    instrument_id: instrument.id,
    normalized: {
      unique_symbol: uniqueSymbol,
      instrument_type: 'equity',
      multiplier: 1,
      meta: {
        exchange: exec.venue || 'UNKNOWN',
        description: `${normalizedSymbol} Stock`
      }
    }
  };
}

/**
 * Resolve option instrument
 */
async function resolveOption(exec: Partial<ExecutionLike>, supabase: any): Promise<ResolvedInstrument> {
  let occSymbol: string;
  let underlying: string;
  let expiry: string;
  let strike: number;
  let type: 'call' | 'put';

  if (exec.occ_symbol) {
    // Parse existing OCC symbol
    const parsed = parseOccSymbol(exec.occ_symbol);
    if (!parsed) {
      throw new Error(`Invalid OCC symbol format: ${exec.occ_symbol}`);
    }
    occSymbol = exec.occ_symbol;
    ({ underlying, expiry, strike, type } = parsed);
  } else {
    // Build OCC symbol from components
    if (!exec.underlying || !exec.expiry || !exec.strike || !exec.option_type) {
      throw new Error('Option requires underlying, expiry, strike, and option_type');
    }
    underlying = exec.underlying.toUpperCase();
    expiry = exec.expiry;
    strike = exec.strike;
    type = exec.option_type;
    occSymbol = buildOccSymbol(underlying, expiry, type, strike);
  }

  const uniqueSymbol = `OPT:${occSymbol}`;
  const multiplier = exec.multiplier || 100;

  // Check if instrument exists
  const { data: existing } = await supabase
    .from('instruments')
    .select('id, multiplier, meta')
    .eq('unique_symbol', uniqueSymbol)
    .single();

  if (existing) {
    // Check if multiplier needs updating
    if (multiplier !== existing.multiplier) {
      await supabase
        .from('instruments')
        .update({
          multiplier,
          meta: { ...existing.meta, adjusted: true }
        })
        .eq('id', existing.id);
    }

    return {
      instrument_id: existing.id,
      normalized: {
        unique_symbol: uniqueSymbol,
        instrument_type: 'option',
        multiplier,
        meta: { ...existing.meta, adjusted: multiplier !== 100 }
      }
    };
  }

  // Create new instrument
  const { data: instrument, error } = await supabase
    .from('instruments')
    .insert({
      unique_symbol: uniqueSymbol,
      instrument_type: 'option',
      multiplier,
      meta: {
        underlying,
        expiry,
        strike,
        type,
        adjusted: multiplier !== 100
      }
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create option instrument: ${error.message}`);

  // Add alias for the raw symbol if different
  if (exec.symbol && exec.symbol !== occSymbol) {
    await supabase
      .from('instrument_aliases')
      .insert({
        instrument_id: instrument.id,
        source: 'csv',
        alias_symbol: exec.symbol
      });
  }

  return {
    instrument_id: instrument.id,
    normalized: {
      unique_symbol: uniqueSymbol,
      instrument_type: 'option',
      multiplier,
      meta: {
        underlying,
        expiry,
        strike,
        type,
        adjusted: multiplier !== 100
      }
    }
  };
}

/**
 * Resolve futures instrument
 */
async function resolveFuture(exec: Partial<ExecutionLike>, supabase: any): Promise<ResolvedInstrument> {
  if (!exec.futures_symbol) {
    throw new Error('Futures symbol required for futures instrument');
  }

  const parsed = parseFuturesSymbol(exec.futures_symbol);
  if (!parsed) {
    throw new Error(`Invalid futures symbol format: ${exec.futures_symbol}`);
  }

  const { root, month, year, expiry } = parsed;
  const uniqueSymbol = `FUT:${root}${month}${year}`;

  // Get futures specs
  const specs = FUTURES_SPECS[root];
  if (!specs) {
    throw new Error(`Unknown futures root: ${root}`);
  }

  // Check if instrument exists
  const { data: existing } = await supabase
    .from('instruments')
    .select('id, multiplier, meta')
    .eq('unique_symbol', uniqueSymbol)
    .single();

  if (existing) {
    return {
      instrument_id: existing.id,
      normalized: {
        unique_symbol: uniqueSymbol,
        instrument_type: 'future',
        multiplier: existing.multiplier,
        meta: existing.meta || {}
      }
    };
  }

  // Create new instrument
  const { data: instrument, error } = await supabase
    .from('instruments')
    .insert({
      unique_symbol: uniqueSymbol,
      instrument_type: 'future',
      multiplier: specs.multiplier,
      meta: {
        root,
        month,
        year,
        expiry,
        tick_value: specs.tick_value,
        description: specs.description,
        exchange: 'CME' // Default to CME for now
      }
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create futures instrument: ${error.message}`);

  // Add alias for the raw symbol
  await supabase
    .from('instrument_aliases')
    .insert({
      instrument_id: instrument.id,
      source: 'csv',
      alias_symbol: exec.futures_symbol
    });

  return {
    instrument_id: instrument.id,
    normalized: {
      unique_symbol: uniqueSymbol,
      instrument_type: 'future',
      multiplier: specs.multiplier,
      meta: {
        root,
        month,
        year,
        expiry,
        tick_value: specs.tick_value,
        description: specs.description,
        exchange: 'CME'
      }
    }
  };
}
