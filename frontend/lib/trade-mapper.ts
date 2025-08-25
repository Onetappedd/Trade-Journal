/**
 * Trade mapper utility for normalizing different database column names and types
 * Handles variations in column naming and type coercion for consistent P&L calculations
 */

export interface NormalizedTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  entry_date: string;
  exit_price: number | null;
  exit_date: string | null;
  fees: number;
  status: string;
  asset_type: string;
  multiplier: number | null;
  point_value: number | null;
  underlying: string | null;
  option_type: string | null;
  strike_price: number | null;
  expiration_date: string | null;
  last_price: number | null;
  mark_price: number | null;
  pnl: number | null;
  created_at: string;
  updated_at: string;
}

export interface TradeMapperOptions {
  // Column name mappings for different database schemas
  columnMappings?: {
    quantity?: string[];
    entry_price?: string[];
    exit_price?: string[];
    entry_date?: string[];
    exit_date?: string[];
    fees?: string[];
    status?: string[];
    asset_type?: string[];
    multiplier?: string[];
    point_value?: string[];
    underlying?: string[];
    option_type?: string[];
    strike_price?: string[];
    expiration_date?: string[];
    last_price?: string[];
    mark_price?: string[];
    pnl?: string[];
    created_at?: string[];
    updated_at?: string[];
  };
  // Default values for missing fields
  defaults?: {
    multiplier?: number;
    point_value?: number;
    fees?: number;
  };
}

/**
 * Find the first available column name from a list of possible names
 */
function findColumnValue(obj: any, possibleNames: string[]): any {
  for (const name of possibleNames) {
    if (obj.hasOwnProperty(name)) {
      return obj[name];
    }
  }
  return undefined;
}

/**
 * Coerce a value to a number, handling strings, nulls, and undefined
 */
function coerceToNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Coerce a value to a string, handling nulls and undefined
 */
function coerceToString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
}

/**
 * Normalize side to 'buy' or 'sell'
 */
function normalizeSide(side: any): 'buy' | 'sell' {
  if (!side) return 'buy';
  const normalized = String(side).toLowerCase().trim();
  return normalized === 'sell' ? 'sell' : 'buy';
}

/**
 * Normalize asset type
 */
function normalizeAssetType(assetType: any): string {
  if (!assetType) return 'stock';
  const normalized = String(assetType).toLowerCase().trim();
  return normalized;
}

/**
 * Normalize status
 */
function normalizeStatus(status: any): string {
  if (!status) return 'open';
  const normalized = String(status).toLowerCase().trim();
  return normalized;
}

/**
 * Map a raw trade object to a normalized trade object
 */
export function mapTrade(rawTrade: any, options: TradeMapperOptions = {}): NormalizedTrade {
  const {
    columnMappings = {
      quantity: ['quantity', 'qty', 'size', 'contracts', 'shares'],
      entry_price: ['entry_price', 'open_price', 'buy_price', 'price'],
      exit_price: ['exit_price', 'close_price', 'sell_price'],
      entry_date: ['entry_date', 'open_date', 'created_at', 'date'],
      exit_date: ['exit_date', 'close_date', 'updated_at'],
      fees: ['fees', 'commission', 'cost'],
      status: ['status', 'state'],
      asset_type: ['asset_type', 'type', 'instrument_type'],
      multiplier: ['multiplier', 'contract_size', 'lot_size'],
      point_value: ['point_value', 'tick_value', 'tick_size'],
      underlying: ['underlying', 'underlying_symbol', 'base_symbol'],
      option_type: ['option_type', 'option_style', 'put_call'],
      strike_price: ['strike_price', 'strike', 'exercise_price'],
      expiration_date: ['expiration_date', 'expiry', 'expiration'],
      last_price: ['last_price', 'current_price', 'market_price'],
      mark_price: ['mark_price', 'fair_value', 'theoretical_price'],
      pnl: ['pnl', 'profit_loss', 'realized_pnl'],
      created_at: ['created_at', 'created', 'timestamp'],
      updated_at: ['updated_at', 'modified', 'last_updated']
    },
    defaults = {
      multiplier: null,
      point_value: null,
      fees: 0
    }
  } = options;

  // Extract values using column mappings
  const quantity = coerceToNumber(findColumnValue(rawTrade, columnMappings.quantity || []));
  const entry_price = coerceToNumber(findColumnValue(rawTrade, columnMappings.entry_price || []));
  const exit_price_raw = findColumnValue(rawTrade, columnMappings.exit_price || []);
  const exit_price = exit_price_raw !== null && exit_price_raw !== undefined ? coerceToNumber(exit_price_raw) : null;
  
  const entry_date = coerceToString(findColumnValue(rawTrade, columnMappings.entry_date || []));
  const exit_date_raw = findColumnValue(rawTrade, columnMappings.exit_date || []);
  const exit_date = exit_date_raw !== null && exit_date_raw !== undefined ? coerceToString(exit_date_raw) : null;
  
  const fees = coerceToNumber(findColumnValue(rawTrade, columnMappings.fees || []), defaults.fees);
  const status = normalizeStatus(findColumnValue(rawTrade, columnMappings.status || []));
  const asset_type = normalizeAssetType(findColumnValue(rawTrade, columnMappings.asset_type || []));
  
  const multiplier_raw = findColumnValue(rawTrade, columnMappings.multiplier || []);
  const multiplier = multiplier_raw !== null && multiplier_raw !== undefined ? coerceToNumber(multiplier_raw) : (defaults.multiplier ?? null);
  
  const point_value_raw = findColumnValue(rawTrade, columnMappings.point_value || []);
  const point_value = point_value_raw !== null && point_value_raw !== undefined ? coerceToNumber(point_value_raw) : (defaults.point_value ?? null);
  
  const underlying_raw = findColumnValue(rawTrade, columnMappings.underlying || []);
  const underlying = underlying_raw !== null && underlying_raw !== undefined ? coerceToString(underlying_raw) : null;
  
  const option_type_raw = findColumnValue(rawTrade, columnMappings.option_type || []);
  const option_type = option_type_raw !== null && option_type_raw !== undefined ? coerceToString(option_type_raw) : null;
  
  const strike_price_raw = findColumnValue(rawTrade, columnMappings.strike_price || []);
  const strike_price = strike_price_raw !== null && strike_price_raw !== undefined ? coerceToNumber(strike_price_raw) : null;
  
  const expiration_date_raw = findColumnValue(rawTrade, columnMappings.expiration_date || []);
  const expiration_date = expiration_date_raw !== null && expiration_date_raw !== undefined ? coerceToString(expiration_date_raw) : null;
  
  const last_price_raw = findColumnValue(rawTrade, columnMappings.last_price || []);
  const last_price = last_price_raw !== null && last_price_raw !== undefined ? coerceToNumber(last_price_raw) : null;
  
  const mark_price_raw = findColumnValue(rawTrade, columnMappings.mark_price || []);
  const mark_price = mark_price_raw !== null && mark_price_raw !== undefined ? coerceToNumber(mark_price_raw) : null;
  
  const pnl_raw = findColumnValue(rawTrade, columnMappings.pnl || []);
  const pnl = pnl_raw !== null && pnl_raw !== undefined ? coerceToNumber(pnl_raw) : null;
  
  const created_at = coerceToString(findColumnValue(rawTrade, columnMappings.created_at || []));
  const updated_at = coerceToString(findColumnValue(rawTrade, columnMappings.updated_at || []));

  return {
    id: coerceToString(rawTrade.id || rawTrade.trade_id || ''),
    symbol: coerceToString(rawTrade.symbol || rawTrade.ticker || ''),
    side: normalizeSide(rawTrade.side || rawTrade.direction || rawTrade.action),
    quantity,
    entry_price,
    entry_date,
    exit_price,
    exit_date,
    fees,
    status,
    asset_type,
    multiplier,
    point_value,
    underlying,
    option_type,
    strike_price,
    expiration_date,
    last_price,
    mark_price,
    pnl,
    created_at,
    updated_at
  };
}

/**
 * Map an array of raw trade objects to normalized trade objects
 */
export function mapTrades(rawTrades: any[], options: TradeMapperOptions = {}): NormalizedTrade[] {
  return rawTrades.map(trade => mapTrade(trade, options));
}

/**
 * Get the most appropriate price for P&L calculations
 * Prioritizes: exit_price > mark_price > last_price > entry_price
 */
export function getTradePrice(trade: NormalizedTrade): number {
  if (trade.exit_price !== null) return trade.exit_price;
  if (trade.mark_price !== null) return trade.mark_price;
  if (trade.last_price !== null) return trade.last_price;
  return trade.entry_price;
}

/**
 * Get the realized P&L for a trade, preferring the pnl field when status indicates closed
 */
export function getTradeRealizedPnl(trade: NormalizedTrade): number | null {
  console.log('🔍 REALIZED PNL - Calculating for trade:', {
    id: trade.id,
    symbol: trade.symbol,
    status: trade.status,
    isClosed: isTradeClosed(trade),
    pnl: trade.pnl,
    entry_price: trade.entry_price,
    exit_price: trade.exit_price,
    side: trade.side,
    quantity: trade.quantity,
    multiplier: trade.multiplier,
    fees: trade.fees
  });

  // If status indicates closed and we have a pnl value, use it
  if (isTradeClosed(trade) && trade.pnl !== null && trade.pnl !== undefined) {
    console.log('🔍 REALIZED PNL - Using existing pnl value:', trade.pnl);
    return trade.pnl;
  }
  
  // Otherwise, calculate from entry/exit prices if available
  if (trade.exit_price !== null && trade.entry_price !== null) {
    const quantity = trade.quantity;
    const entryPrice = trade.entry_price;
    const exitPrice = trade.exit_price;
    const fees = trade.fees;
    const multiplier = getTradeMultiplier(trade);

    let pnl = 0;
    if (trade.side === 'buy') {
      pnl = (exitPrice - entryPrice) * quantity * multiplier - fees;
    } else {
      pnl = (entryPrice - exitPrice) * quantity * multiplier - fees;
    }
    
    console.log('🔍 REALIZED PNL - Calculated from prices:', {
      side: trade.side,
      quantity,
      entryPrice,
      exitPrice,
      multiplier,
      fees,
      pnl
    });
    
    return pnl;
  }
  
  console.log('🔍 REALIZED PNL - No P&L data available');
  return null;
}

/**
 * Check if a trade is closed based on status and exit data
 * Treats various status values as closed even when exit_price is null
 */
export function isTradeClosed(trade: NormalizedTrade): boolean {
  // First check if we have explicit exit data
  if (trade.exit_price !== null && trade.exit_date !== null) {
    return true;
  }
  
  // Check status-based closure indicators
  const closedStatuses = [
    'closed', 'sold', 'completed', 'exit', 'exited', 
    'expired', 'exercised', 'assigned', 'settled', 'terminated'
  ];
  
  const normalizedStatus = trade.status.toLowerCase().trim();
  return closedStatuses.includes(normalizedStatus);
}

/**
 * Get the trade date for sorting (exit date for closed trades, entry date for open trades)
 */
export function getTradeDate(trade: NormalizedTrade): string {
  return trade.exit_date || trade.entry_date;
}

/**
 * Get the appropriate multiplier for the asset type
 */
export function getTradeMultiplier(trade: NormalizedTrade): number {
  // Use explicit multiplier if provided
  if (trade.multiplier !== null) return trade.multiplier;
  
  // Use point value for futures
  if (trade.point_value !== null) return trade.point_value;
  
  // Default multipliers by asset type
  switch (trade.asset_type) {
    case 'option':
      return 100; // Standard option contract size
    case 'futures':
      // Infer from symbol if no point value provided
      const futuresPointValues: Record<string, number> = {
        ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5, RTY: 50, M2K: 5,
        CL: 1000, MCL: 100, GC: 100, MGC: 10, SI: 5000, SIL: 1000,
      };
      const key = Object.keys(futuresPointValues).find(k => 
        trade.symbol.toUpperCase().startsWith(k)
      );
      return key ? futuresPointValues[key] : 1;
    case 'stock':
    case 'crypto':
    default:
      return 1;
  }
}
