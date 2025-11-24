import { getServerSupabase } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import Decimal from 'decimal.js';
import { 
  toDec, 
  sumDec, 
  mulDec, 
  subDec, 
  divDec, 
  weightedAveragePrice,
  calculateEquityPnL,
  calculateOptionPnL,
  calculateFuturesPnL
} from '@/lib/math/money';

// Types for matching engine
interface Execution {
  id: string;
  user_id: string;
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell' | 'short';
  quantity: number;
  price: number;
  fees: number;
  currency: string;
  venue: string;
  order_id: string;
  exec_id: string;
  instrument_type: string;
  expiry?: string;
  strike?: number;
  option_type?: 'C' | 'P';
  multiplier: number;
  underlying?: string;
  broker_account_id?: string;
  source_import_run_id?: string;
}

interface Trade {
  id?: string;
  user_id: string;
  group_key: string;
  symbol: string;
  instrument_type: 'equity' | 'option' | 'futures';
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  qty_opened: number;
  qty_closed?: number;
  avg_open_price: number;
  avg_close_price?: number;
  realized_pnl: number;
  fees: number;
  legs?: any[]; // For options
  ingestion_run_id?: string; // Changed from import_run_id
  row_hash?: string;
  created_at?: string;
  updated_at?: string;
  // Option-specific fields
  underlying_symbol?: string;
  option_expiration?: string;
  option_strike?: number;
  option_type?: string;
  // Metadata
  meta?: Record<string, any>; // JSONB field for additional metadata (e.g., close_reason)
}

interface Position {
  symbol: string;
  qty: number;
  avg_price: number;
  total_cost: number;
  total_fees: number;
  first_exec_id: string;
  last_exec_id: string;
}

interface OptionsLeg {
  side: 'buy' | 'sell';
  type: 'call' | 'put';
  strike: number;
  expiry: string;
  qty: number;
  avg_price: number;
}

interface OptionsPosition {
  underlying: string;
  expiry: string;
  legs: Map<string, Position>; // key: `${strike}-${type}-${side}`
  total_fees: number;
  first_exec_id: string;
  last_exec_id: string;
}

// Helper function to delete existing trades for specific symbols
async function deleteTradesForSymbols(userId: string, symbols: string[], supabase: SupabaseClient): Promise<number> {
  
  const { data, error } = await supabase
    .from('trades')
    .delete()
    .eq('user_id', userId)
    .in('symbol', symbols)
    .select('id');
    
  if (error) {
    console.error('Error deleting trades for symbols:', error);
    throw error;
  }
  
  return data?.length || 0;
}

// Main matching function
export async function matchUserTrades({ 
  userId, 
  sinceImportRunId,
  symbols,
  supabase
}: { 
  userId: string; 
  sinceImportRunId?: string;
  symbols?: string[];
  supabase?: SupabaseClient;
}): Promise<{ updatedTrades: number; createdTrades: number }> {
  const client = supabase || getServerSupabase();
  
  let updatedTrades = 0;
  let createdTrades = 0;

  try {
    // Get executions to process
    // Note: We can't reliably filter by quantity > 0 at DB level if quantity is stored as NUMERIC (string)
    // So we'll fetch all and filter in code
    let query = client
      .from('executions_normalized')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (sinceImportRunId) {
      query = query.eq('source_import_run_id', sinceImportRunId);
    }

    if (symbols && symbols.length > 0) {
      query = query.in('symbol', symbols);
    }

    const { data: allExecutions, error } = await query;
    if (error) throw error;

    console.log(`Found ${allExecutions?.length || 0} total executions for user ${userId}`);
    
    // Filter out invalid executions in code (handle PostgreSQL NUMERIC strings)
    const executions = (allExecutions || []).filter((e: any) => {
      const qty = typeof e.quantity === 'string' ? parseFloat(e.quantity) : (e.quantity || 0);
      const price = typeof e.price === 'string' ? parseFloat(e.price) : (e.price || 0);
      
      // For options, allow price >= 0 (OEXP can have price 0)
      // For equities/futures, price must be > 0
      const isValidPrice = e.instrument_type === 'option' ? (price >= 0 && !isNaN(price)) : (price > 0 && !isNaN(price));
      
      if (!qty || qty <= 0 || isNaN(qty)) {
        console.warn(`[Matching] Filtering out execution ${e.id}: invalid quantity ${e.quantity} (parsed: ${qty})`);
        return false;
      }
      if (!isValidPrice) {
        console.warn(`[Matching] Filtering out execution ${e.id}: invalid price ${e.price} (parsed: ${price}) for ${e.instrument_type}`);
        return false;
      }
      return true;
    });
    
    console.log(`Filtered to ${executions.length} valid executions (removed ${(allExecutions?.length || 0) - executions.length} invalid)`);
    
    // Debug: Check multiplier values for options
    const optionExecsForDebug = executions?.filter((e: any) => e.instrument_type === 'option') || [];
    if (optionExecsForDebug.length > 0) {
      const multipliers = optionExecsForDebug.map((e: any) => e.multiplier).filter((m: any) => m !== null && m !== undefined);
      const uniqueMultipliers = [...new Set(multipliers)];
      console.log(`[Matching] Option executions found: ${optionExecsForDebug.length}, multipliers: ${uniqueMultipliers.join(', ') || 'none set'}`);
      if (uniqueMultipliers.length > 0 && !uniqueMultipliers.includes(100)) {
        console.warn(`[Matching] Warning: Option multiplier is not 100! Found: ${uniqueMultipliers.join(', ')}`);
      }
    }

    // If rebuilding for specific symbols, delete existing trades first
    if (symbols && symbols.length > 0) {
      await deleteTradesForSymbols(userId, symbols, client);
    }

    if (!executions || executions.length === 0) {
      console.log('No executions found, returning 0 trades');
      return { updatedTrades: 0, createdTrades: 0 };
    }

    // Split executions by instrument type
    // Note: Database schema only allows 'equity', 'option', 'futures' (not 'stock' or 'future')
    const equityExecutions = executions.filter(e => e.instrument_type === 'equity');
    const optionExecutions = executions.filter(e => e.instrument_type === 'option');
    const futureExecutions = executions.filter(e => e.instrument_type === 'futures');

    console.log(`Split executions: ${equityExecutions.length} equity, ${optionExecutions.length} options, ${futureExecutions.length} futures`);

    // Match each asset class
    const equityResult = await matchEquities(equityExecutions, client);
    const optionsResult = await matchOptions(optionExecutions, client);
    const futuresResult = await matchFutures(futureExecutions, client);

    updatedTrades = equityResult.updated + optionsResult.updated + futuresResult.updated;
    createdTrades = equityResult.created + optionsResult.created + futuresResult.created;

    return { updatedTrades, createdTrades };

  } catch (error) {
    console.error('Error in matchUserTrades:', error);
    throw error;
  }
}

// Equities matching (FIFO)
async function matchEquities(executions: Execution[], supabase: SupabaseClient): Promise<{ updated: number; created: number }> {
  let updated = 0;
  let created = 0;

  // Filter out invalid executions (0 quantity, 0 price, missing required fields)
  const validExecutions = executions.filter(exec => {
    // Convert to number if it's a string (PostgreSQL NUMERIC returns strings)
    const qty = typeof exec.quantity === 'string' ? parseFloat(exec.quantity) : (exec.quantity || 0);
    const price = typeof exec.price === 'string' ? parseFloat(exec.price) : (exec.price || 0);
    
    if (!qty || qty <= 0 || isNaN(qty)) {
      console.warn(`[Equity Matching] Skipping execution ${exec.id}: invalid quantity ${exec.quantity} (parsed: ${qty})`);
      return false;
    }
    if (!price || price <= 0 || isNaN(price)) {
      console.warn(`[Equity Matching] Skipping execution ${exec.id}: invalid price ${exec.price} (parsed: ${price})`);
      return false;
    }
    if (!exec.symbol || exec.symbol.trim() === '') {
      console.warn(`[Equity Matching] Skipping execution ${exec.id}: missing symbol`);
      return false;
    }
    return true;
  });

  console.log(`[Equity Matching] Filtered ${executions.length} executions to ${validExecutions.length} valid executions`);

  // Group by symbol and broker account
  const symbolGroups = new Map<string, Execution[]>();
  
  for (const exec of validExecutions) {
    const key = `${exec.symbol}-${exec.broker_account_id || 'default'}`;
    if (!symbolGroups.has(key)) {
      symbolGroups.set(key, []);
    }
    symbolGroups.get(key)!.push(exec);
  }

  for (const [symbolKey, symbolExecs] of symbolGroups) {
    const [symbol, brokerAccountId] = symbolKey.split('-');
    
    // Sort by timestamp
    symbolExecs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let position = 0;
    let avgPrice = 0;
    let totalCost = 0;
    let totalFees = 0;
    let firstExecId = '';
    let lastExecId = '';
    let openTrade: Trade | null = null;
    let trades: Trade[] = [];

    for (const exec of symbolExecs) {
      // Parse quantity and price (handle PostgreSQL NUMERIC strings)
      const execQty = typeof exec.quantity === 'string' ? parseFloat(exec.quantity) : (exec.quantity || 0);
      const execPrice = typeof exec.price === 'string' ? parseFloat(exec.price) : (exec.price || 0);
      
      // Double-check validation (shouldn't happen but safety check)
      if (!execQty || execQty <= 0 || !execPrice || execPrice <= 0) {
        console.warn(`[Equity Matching] Skipping execution ${exec.id} in processing: qty=${execQty}, price=${execPrice}`);
        continue;
      }
      
      // Use Math.abs to ensure we start with a positive magnitude, then apply sign based on side
      const qty = (exec.side === 'sell' || exec.side === 'short') ? -Math.abs(execQty) : Math.abs(execQty);
      const cost = qty * execPrice;
      
      if (position === 0) {
        // Starting a new position
        position = qty;
        avgPrice = execPrice;
        totalCost = cost;
        totalFees = exec.fees || 0;
        firstExecId = exec.id;
        lastExecId = exec.id;
        
        // Validate before creating trade
        const absQty = Math.abs(qty);
        if (absQty <= 0 || avgPrice <= 0) {
          console.warn(`[Equity Matching] Skipping trade creation: invalid qty=${absQty}, price=${avgPrice}`);
          continue;
        }
        
        // Create open trade
        openTrade = {
          user_id: exec.user_id,
          group_key: generateGroupKey(symbol, exec.id),
          symbol,
          instrument_type: 'equity',
          status: 'open',
          opened_at: exec.timestamp,
          qty_opened: absQty, // Use absolute quantity for qty_opened
          qty_closed: 0,
          avg_open_price: avgPrice, // Use actual price, not forced minimum
          realized_pnl: 0,
          fees: totalFees,
          ingestion_run_id: exec.source_import_run_id,
          row_hash: undefined, // Set to undefined to avoid unique constraint violation
        };
        
      } else {
        // Updating existing position
        const newPosition = position + qty;
        const newCost = totalCost + cost;
        const newFees = totalFees + exec.fees;
        
        if (Math.sign(position) === Math.sign(newPosition)) {
          // Same direction - update position
          position = newPosition;
          // Calculate weighted average price using Decimal
          if (openTrade) {
            const prices = [openTrade.avg_open_price, exec.price];
            const quantities = [Math.abs(position - qty), Math.abs(qty)];
            avgPrice = weightedAveragePrice(prices, quantities).toNumber();
          } else {
            avgPrice = exec.price;
          }
          totalCost = newCost;
          totalFees = newFees;
          lastExecId = exec.id;
          
          // Update open trade
          if (openTrade) {
            openTrade.qty_opened = Math.abs(position); // Use absolute quantity
            openTrade.avg_open_price = avgPrice; // Use actual calculated price
            openTrade.fees = totalFees;
          }
          
        } else {
          // Direction change - close current trade and potentially start new one
          if (openTrade) {
            // Close current trade
            const closeQty = Math.abs(position);
            const realizedPnl = calculateEquityPnL(
              openTrade.avg_open_price,
              execPrice,
              closeQty,
              totalFees
            ).toNumber();
            
            openTrade.status = 'closed';
            openTrade.closed_at = exec.timestamp;
            openTrade.qty_closed = closeQty;
            openTrade.avg_close_price = execPrice;
            openTrade.realized_pnl = realizedPnl;
            openTrade.fees = totalFees;
            
            trades.push(openTrade);
            created++;
          }
          
          // Start new position if remaining qty
          if (newPosition !== 0) {
            position = newPosition;
            avgPrice = newCost / Math.abs(position);
            totalCost = newCost;
            totalFees = newFees;
            firstExecId = exec.id;
            lastExecId = exec.id;
            
            const absPosition = Math.abs(position);
            // Validate before creating new trade
            if (absPosition <= 0 || avgPrice <= 0) {
              console.warn(`[Equity Matching] Skipping new trade creation after close: invalid qty=${absPosition}, price=${avgPrice}`);
              openTrade = null;
            } else {
              openTrade = {
                user_id: exec.user_id,
                group_key: generateGroupKey(symbol, exec.id),
                symbol,
                instrument_type: 'equity',
                status: 'open',
                opened_at: exec.timestamp,
                qty_opened: absPosition, // Use absolute quantity
                qty_closed: 0,
                avg_open_price: avgPrice, // Use actual calculated price
                realized_pnl: 0,
                fees: totalFees,
                ingestion_run_id: exec.source_import_run_id,
                row_hash: undefined, // Set to undefined to avoid unique constraint violation
              };
            }
          } else {
            openTrade = null;
          }
        }
      }
    }
    
    // Save trades to database (only valid trades with qty > 0)
    for (const trade of trades) {
      if (trade.qty_opened > 0 && trade.avg_open_price > 0) {
        await upsertTrade(trade, supabase);
      } else {
        console.warn(`Skipping invalid trade: qty_opened=${trade.qty_opened}, avg_open_price=${trade.avg_open_price}`);
      }
    }
    
    // Update open trade if exists (only if valid)
    if (openTrade && openTrade.qty_opened > 0 && openTrade.avg_open_price > 0) {
      await upsertTrade(openTrade, supabase);
      updated++;
    } else if (openTrade) {
      console.warn(`Skipping invalid open trade: qty_opened=${openTrade.qty_opened}, avg_open_price=${openTrade.avg_open_price}`);
    }
  }

  return { updated, created };
}

// Options matching - routes to broker-specific matchers
async function matchOptions(executions: Execution[], supabase: SupabaseClient): Promise<{ updated: number; created: number }> {
  console.log(`Starting options matching with ${executions.length} executions`);
  
  // Split executions by broker
  const robinhoodExecs = executions.filter(e => e.venue === 'robinhood');
  const otherExecs = executions.filter(e => e.venue !== 'robinhood');
  
  console.log(`Split options: ${robinhoodExecs.length} Robinhood, ${otherExecs.length} other brokers`);
  
  // Route to appropriate matcher
  const robinhoodResult = await matchRobinhoodOptionsContractLevel(robinhoodExecs, supabase);
  const otherResult = await matchOptionsMultiLeg(otherExecs, supabase);
  
  return {
    updated: robinhoodResult.updated + otherResult.updated,
    created: robinhoodResult.created + otherResult.created,
  };
}

// Options matching (multi-leg within window) - for non-Robinhood brokers
async function matchOptionsMultiLeg(executions: Execution[], supabase: SupabaseClient): Promise<{ updated: number; created: number }> {
  if (executions.length === 0) {
    return { updated: 0, created: 0 };
  }
  
  console.log(`Starting multi-leg options matching with ${executions.length} executions`);
  let updated = 0;
  let created = 0;

  // Group by underlying and expiry
  // Use a separator that won't conflict with date formats
  const optionGroups = new Map<string, Execution[]>();
  
  for (const exec of executions) {
    if (!exec.underlying || !exec.expiry) continue;
    // Use a separator that won't appear in dates (e.g., "::" or "|")
    const key = `${exec.underlying}::${exec.expiry}`;
    if (!optionGroups.has(key)) {
      optionGroups.set(key, []);
    }
    optionGroups.get(key)!.push(exec);
  }

  console.log(`Grouped into ${optionGroups.size} option groups`);

  for (const [key, optionExecs] of optionGroups) {
    // Split by the separator we used (::)
    const [underlying, expiry] = key.split('::');
    
    // Sort by timestamp
    optionExecs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Group into windows (same order_id or within ±60s)
    const windows = groupIntoWindows(optionExecs);
    
    for (const window of windows) {
      const legs = new Map<string, Position>();
      let totalFees = 0;
      let firstExecId = '';
      let lastExecId = '';
      let totalOpenedQty = 0; // Track total quantity that was opened (for closed trades)
      
      for (const exec of window) {
        const legKey = `${exec.strike}-${exec.option_type === 'C' ? 'call' : 'put'}-${exec.side}`;
        // Use Math.abs to ensure we start with a positive magnitude, then apply sign based on side
        const qty = exec.side === 'sell' ? -Math.abs(exec.quantity) : Math.abs(exec.quantity);
        const cost = qty * exec.price * exec.multiplier;
        
        // Track opened quantity (positive quantities from buys)
        if (exec.side === 'buy') {
          totalOpenedQty += exec.quantity;
        }
        
        if (!legs.has(legKey)) {
          legs.set(legKey, {
            symbol: `${underlying}${exec.expiry}${exec.strike}${exec.option_type?.toUpperCase()}`,
            qty: 0,
            avg_price: 0,
            total_cost: 0,
            total_fees: 0,
            first_exec_id: exec.id,
            last_exec_id: exec.id,
          });
        }
        
        const leg = legs.get(legKey)!;
        const newQty = leg.qty + qty;
        const newCost = leg.total_cost + cost;
        const newFees = leg.total_fees + exec.fees;
        
        leg.qty = newQty;
        // Calculate weighted average price using Decimal
        if (newQty !== 0) {
          const prices = [leg.avg_price, exec.price];
          const quantities = [Math.abs(leg.qty - qty), Math.abs(qty)];
          leg.avg_price = weightedAveragePrice(prices, quantities).toNumber();
        } else {
          leg.avg_price = exec.price || 0.01; // Use execution price or minimum value
        }
        leg.total_cost = newCost;
        leg.total_fees = newFees;
        leg.last_exec_id = exec.id;
        
        totalFees += exec.fees;
        if (!firstExecId) firstExecId = exec.id;
        lastExecId = exec.id;
      }
      
      // Create or update trade
      const legsArray = Array.from(legs.entries()).map(([legKey, leg]) => {
        const [strike, type, side] = legKey.split('-');
        return {
          side: side as 'buy' | 'sell',
          type: type as 'call' | 'put',
          strike: parseFloat(strike),
          expiry,
          qty: Math.abs(leg.qty),
          avg_price: leg.avg_price,
        };
      });
      
      const netPosition = Array.from(legs.values()).reduce((sum, leg) => sum + leg.qty, 0);
      const status = netPosition === 0 ? 'closed' : 'open';
      
      // Calculate P&L for options using proper open/close matching
      let realizedPnl = 0;
      if (status === 'closed') {
        // For options, we need to calculate P&L based on actual buy/sell executions
        // Group executions by leg and calculate P&L for each leg
        const legExecutions = new Map<string, { buys: Execution[], sells: Execution[] }>();
        
        for (const exec of window) {
          const legKey = `${exec.strike}-${exec.option_type === 'C' ? 'call' : 'put'}`;
          if (!legExecutions.has(legKey)) {
            legExecutions.set(legKey, { buys: [], sells: [] });
          }
          
          if (exec.side === 'buy') {
            legExecutions.get(legKey)!.buys.push(exec);
          } else {
            legExecutions.get(legKey)!.sells.push(exec);
          }
        }
        
        // Calculate P&L for each leg by matching buys and sells
        let totalPnL = 0;
        for (const [legKey, executions] of legExecutions) {
          const buys = executions.buys;
          const sells = executions.sells;
          
          // Sort by timestamp to match chronologically
          buys.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          sells.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          // Match buys with sells and calculate P&L
          let buyIndex = 0;
          let sellIndex = 0;
          
          while (buyIndex < buys.length && sellIndex < sells.length) {
            const buy = buys[buyIndex];
            const sell = sells[sellIndex];
            
            // Calculate P&L: (sell_price - buy_price) * quantity * multiplier
            // For options, the price is per contract, so we multiply by quantity and multiplier
            // The multiplier is ALWAYS 100 for standard options (regardless of what's stored in DB)
            // This ensures correct P&L calculation even if old data has multiplier=1
            const multiplier = 100; // Always use 100 for options
            const matchedQty = Math.min(buy.quantity, sell.quantity);
            const priceDiff = sell.price - buy.price;
            const legPnL = priceDiff * matchedQty * multiplier;
            
            totalPnL += legPnL;
            
            // Reduce quantities
            buy.quantity -= matchedQty;
            sell.quantity -= matchedQty;
            
            // Move to next execution if current one is fully matched
            if (buy.quantity === 0) buyIndex++;
            if (sell.quantity === 0) sellIndex++;
          }
        }
        
        realizedPnl = totalPnL - totalFees;
      }
      
      // Calculate average open price from legs (weighted by quantity)
      const totalQuantity = legsArray.reduce((sum, leg) => sum + Math.abs(leg.qty), 0);
      const totalOpenValue = legsArray.reduce((sum, leg) => sum + (leg.avg_price * Math.abs(leg.qty)), 0);
      const avgOpenPrice = totalQuantity > 0 ? totalOpenValue / totalQuantity : 0;
      
      // For qty_opened: use totalOpenedQty (sum of buy quantities) for closed trades,
      // or netPosition for open trades
      // For closed trades, netPosition is 0, so we need to use the tracked totalOpenedQty
      const qtyOpened = status === 'closed' 
        ? (totalOpenedQty > 0 ? totalOpenedQty : totalQuantity) // Use tracked opened quantity or fallback to totalQuantity
        : Math.abs(netPosition); // For open trades, use net position
      
      // Extract option details from first leg for database columns
      const firstLeg = legsArray.length > 0 ? legsArray[0] : null;
      const optionStrike = firstLeg?.strike || undefined;
      
      // Validate and format expiry date (must be YYYY-MM-DD format for PostgreSQL DATE type)
      let optionExpiry: string | undefined = undefined;
      const expiryValue = firstLeg?.expiry || expiry || window[0]?.expiry;
      if (expiryValue) {
        // Try to parse and validate the date
        try {
          const date = new Date(expiryValue);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            optionExpiry = `${year}-${month}-${day}`;
          } else {
            // If it's already in YYYY-MM-DD format, validate it
            const dateMatch = expiryValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateMatch) {
              optionExpiry = expiryValue;
            } else {
              console.warn(`Invalid expiry format: ${expiryValue}, skipping option_expiration`);
            }
          }
        } catch (e) {
          console.warn(`Error parsing expiry date: ${expiryValue}`, e);
        }
      }
      
      const optionType = firstLeg?.type === 'call' ? 'CALL' : firstLeg?.type === 'put' ? 'PUT' : undefined;
      
      const trade: Trade = {
        user_id: window[0].user_id,
        group_key: generateGroupKey(underlying, firstExecId),
        symbol: underlying,
        instrument_type: 'option',
        status,
        opened_at: window[0].timestamp,
        closed_at: status === 'closed' ? window[window.length - 1].timestamp : undefined,
        qty_opened: qtyOpened > 0 ? qtyOpened : totalQuantity, // Ensure qty_opened > 0
        qty_closed: status === 'closed' ? qtyOpened : 0, // For closed trades, qty_closed should equal qty_opened
        avg_open_price: avgOpenPrice, // Use calculated average price
        avg_close_price: status === 'closed' ? avgOpenPrice : undefined,
        realized_pnl: realizedPnl,
        fees: totalFees,
        legs: legsArray,
        ingestion_run_id: window[0].source_import_run_id,
        row_hash: undefined, // Set to undefined for now
        // Add option-specific fields for database columns
        underlying_symbol: underlying,
        option_expiration: optionExpiry,
        option_strike: optionStrike,
        option_type: optionType,
      };
      
      await upsertTrade(trade, supabase);
      if (status === 'closed') {
        created++;
      } else {
        updated++;
      }
    }
  }

  return { updated, created };
}

// Robinhood options matching (contract-level FIFO)
async function matchRobinhoodOptionsContractLevel(executions: Execution[], supabase: SupabaseClient): Promise<{ updated: number; created: number }> {
  if (executions.length === 0) {
    return { updated: 0, created: 0 };
  }
  
  console.log(`Starting Robinhood contract-level FIFO matching with ${executions.length} executions`);
  let updated = 0;
  let created = 0;
  
  // Filter out invalid executions
  const validExecutions = executions.filter(exec => {
    if (!exec.quantity || exec.quantity <= 0) {
      console.warn(`Skipping execution ${exec.id}: invalid quantity ${exec.quantity}`);
      return false;
    }
    if (!exec.price || exec.price < 0) { // Allow 0 for OEXP
      console.warn(`Skipping execution ${exec.id}: invalid price ${exec.price}`);
      return false;
    }
    if (!exec.underlying || !exec.expiry || !exec.strike || !exec.option_type) {
      console.warn(`Skipping execution ${exec.id}: missing required option fields (underlying, expiry, strike, option_type)`);
      return false;
    }
    return true;
  });
  
  // Group by contract key: broker_account_id + underlying + expiry + strike + option_type
  const contractGroups = new Map<string, Execution[]>();
  
  for (const exec of validExecutions) {
    
    const key = [
      exec.broker_account_id ?? 'default',
      exec.underlying,
      exec.expiry,
      exec.strike,
      exec.option_type,
    ].join('::');
    
    if (!contractGroups.has(key)) {
      contractGroups.set(key, []);
    }
    contractGroups.get(key)!.push(exec);
  }
  
  console.log(`Grouped into ${contractGroups.size} contract groups`);
  
  // Process each contract group
  for (const [key, execs] of contractGroups) {
    // Sort chronologically
    execs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // FIFO open lots queue
    type OpenLot = {
      qtyRemaining: number;
      openPrice: number;
      openAmount: Decimal; // Total cost (negative for cash outflow)
      openedAt: Date;
      fees: Decimal;
    };
    
    const openLots: OpenLot[] = [];
    
    // Process each execution
    for (const exec of execs) {
      const signedQty = exec.side === 'buy' ? exec.quantity : -exec.quantity;
      const price = toDec(exec.price);
      const multiplier = toDec(exec.multiplier || 100); // Always 100 for options
      const gross = price.mul(exec.quantity).mul(multiplier); // Full contract value
      const fees = toDec(exec.fees ?? 0);
      
      if (exec.side === 'buy') {
        // Opening long position
        openLots.push({
          qtyRemaining: exec.quantity,
          openPrice: exec.price,
          openAmount: gross.neg(), // Negative (cash outflow)
          openedAt: new Date(exec.timestamp),
          fees,
        });
        continue;
      }
      
      // SELL or OEXP → close long positions (FIFO)
      let remainingToClose = exec.quantity;
      const isOEXP = exec.notes?.toUpperCase().includes('OPTION EXPIRATION') || 
                     exec.notes?.toUpperCase().includes('OEXP');
      
      while (remainingToClose > 0 && openLots.length > 0) {
        const lot = openLots[0];
        const takeQty = Math.min(lot.qtyRemaining, remainingToClose);
        
        // Calculate P&L
        const entryPerUnit = lot.openAmount.div(lot.qtyRemaining); // Negative per contract
        const entryCash = entryPerUnit.mul(takeQty); // Negative
        const exitPrice = isOEXP ? toDec(0) : price; // 0 for OEXP
        const exitCash = exitPrice.mul(takeQty).mul(multiplier); // Positive or zero
        
        // P&L = exitCash - entryCash - fees
        // entryCash is negative, so we add it (subtract the absolute value)
        const lotFees = lot.fees.mul(takeQty).div(lot.qtyRemaining);
        const execFees = fees.mul(takeQty).div(exec.quantity);
        const pnl = exitCash.add(entryCash).sub(lotFees).sub(execFees);
        
        // Build single-leg trade record
        const [brokerAccountId, underlying, expiry, strikeStr, optionType] = key.split('::');
        const strike = parseFloat(strikeStr);
        
        // Format expiry as YYYY-MM-DD
        let optionExpiry: string | undefined = undefined;
        try {
          const date = new Date(expiry);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            optionExpiry = `${year}-${month}-${day}`;
          } else {
            // If already in YYYY-MM-DD format
            const dateMatch = expiry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateMatch) {
              optionExpiry = expiry;
            }
          }
        } catch (e) {
          console.warn(`Error parsing expiry date: ${expiry}`, e);
        }
        
        const trade: Trade = {
          user_id: exec.user_id,
          group_key: generateGroupKey(underlying, exec.id),
          symbol: underlying,
          instrument_type: 'option',
          status: 'closed',
          opened_at: lot.openedAt.toISOString(),
          closed_at: exec.timestamp,
          qty_opened: takeQty,
          qty_closed: takeQty,
          avg_open_price: lot.openPrice,
          avg_close_price: isOEXP ? 0 : exec.price,
          realized_pnl: pnl.toNumber(),
          fees: lotFees.add(execFees).toNumber(),
          legs: [
            {
              strike,
              option_type: optionType === 'C' ? 'call' : 'put',
              side: 'long',
              qty_opened: takeQty,
              qty_closed: takeQty,
              avg_open_price: lot.openPrice,
              avg_close_price: isOEXP ? 0 : exec.price,
              realized_pnl: pnl.toNumber(),
            },
          ],
          ingestion_run_id: exec.source_import_run_id,
          row_hash: undefined,
          underlying_symbol: underlying,
          option_expiration: optionExpiry,
          option_strike: strike,
          option_type: optionType === 'C' ? 'CALL' : 'PUT',
          // Store close_reason in meta JSONB
          meta: isOEXP ? { close_reason: 'expired' } : undefined,
        };
        
        await upsertTrade(trade, supabase);
        created++;
        
        // Update lot
        lot.qtyRemaining -= takeQty;
        remainingToClose -= takeQty;
        
        // Remove lot if fully consumed
        if (lot.qtyRemaining <= 0.00001) {
          openLots.shift();
        }
      }
      
      // If remainingToClose > 0 and no open lots, log warning
      if (remainingToClose > 0 && openLots.length === 0) {
        console.warn(`[Robinhood Matching] Attempted to close ${remainingToClose} contracts but no open lots available for contract ${key}`);
      }
    }
    
    // Any remaining open lots are genuinely open positions
    for (const lot of openLots) {
      const [brokerAccountId, underlying, expiry, strikeStr, optionType] = key.split('::');
      const strike = parseFloat(strikeStr);
      
      // Format expiry
      let optionExpiry: string | undefined = undefined;
      try {
        const date = new Date(expiry);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          optionExpiry = `${year}-${month}-${day}`;
        } else {
          const dateMatch = expiry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (dateMatch) {
            optionExpiry = expiry;
          }
        }
      } catch (e) {
        console.warn(`Error parsing expiry date: ${expiry}`, e);
      }
      
      // Use first execution from this contract group for user_id, etc.
      const firstExec = execs[0];
      
      const trade: Trade = {
        user_id: firstExec.user_id,
        group_key: generateGroupKey(underlying, firstExec.id),
        symbol: underlying,
        instrument_type: 'option',
        status: 'open',
        opened_at: lot.openedAt.toISOString(),
        closed_at: undefined,
        qty_opened: lot.qtyRemaining,
        qty_closed: 0,
        avg_open_price: lot.openPrice,
        avg_close_price: undefined,
        realized_pnl: 0,
        fees: lot.fees.toNumber(),
        legs: [
          {
            strike,
            option_type: optionType === 'C' ? 'call' : 'put',
            side: 'long',
            qty_opened: lot.qtyRemaining,
            qty_closed: 0,
            avg_open_price: lot.openPrice,
            avg_close_price: undefined,
            realized_pnl: 0,
          },
        ],
        ingestion_run_id: firstExec.source_import_run_id,
        row_hash: undefined,
        underlying_symbol: underlying,
        option_expiration: optionExpiry,
        option_strike: strike,
        option_type: optionType === 'C' ? 'CALL' : 'PUT',
      };
      
      await upsertTrade(trade, supabase);
      updated++;
    }
  }
  
  return { updated, created };
}

// Futures matching
async function matchFutures(executions: Execution[], supabase: SupabaseClient): Promise<{ updated: number; created: number }> {
  let updated = 0;
  let created = 0;

  // Group by symbol and broker account
  const symbolGroups = new Map<string, Execution[]>();
  
  for (const exec of executions) {
    const key = `${exec.symbol}-${exec.broker_account_id || 'default'}`;
    if (!symbolGroups.has(key)) {
      symbolGroups.set(key, []);
    }
    symbolGroups.get(key)!.push(exec);
  }

  for (const [symbolKey, symbolExecs] of symbolGroups) {
    const [symbol, brokerAccountId] = symbolKey.split('-');
    
    // Sort by timestamp
    symbolExecs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let position = 0;
    let avgPrice = 0;
    let totalCost = 0;
    let totalFees = 0;
    let firstExecId = '';
    let lastExecId = '';
    let openTrade: Trade | null = null;
    let trades: Trade[] = [];

    for (const exec of symbolExecs) {
      // Use Math.abs to ensure we start with a positive magnitude, then apply sign based on side
      const qty = exec.side === 'sell' ? -Math.abs(exec.quantity) : Math.abs(exec.quantity);
      const cost = qty * exec.price * exec.multiplier;
      
      if (position === 0) {
        // Starting a new position
        position = qty;
        avgPrice = exec.price;
        totalCost = cost;
        totalFees = exec.fees;
        firstExecId = exec.id;
        lastExecId = exec.id;
        
        openTrade = {
          user_id: exec.user_id,
          group_key: generateGroupKey(symbol, exec.id),
          symbol,
          instrument_type: 'futures',
          status: 'open',
          opened_at: exec.timestamp,
          qty_opened: Math.abs(qty), // Use absolute quantity
          qty_closed: 0,
          avg_open_price: avgPrice, // Use actual price
          realized_pnl: 0,
          fees: totalFees,
          ingestion_run_id: exec.source_import_run_id,
          row_hash: undefined, // Set to undefined to avoid unique constraint violation
        };
        
      } else {
        // Updating existing position
        const newPosition = position + qty;
        const newCost = totalCost + cost;
        const newFees = totalFees + exec.fees;
        
        if (Math.sign(position) === Math.sign(newPosition)) {
          // Same direction - update position
          position = newPosition;
          // Calculate weighted average price using Decimal
          if (openTrade) {
            const prices = [openTrade.avg_open_price, exec.price];
            const quantities = [Math.abs(position - qty), Math.abs(qty)];
            avgPrice = weightedAveragePrice(prices, quantities).toNumber();
          } else {
            avgPrice = exec.price;
          }
          totalCost = newCost;
          totalFees = newFees;
          lastExecId = exec.id;
          
          if (openTrade) {
            openTrade.qty_opened = Math.abs(position); // Use absolute quantity
            openTrade.avg_open_price = avgPrice; // Use actual calculated price
            openTrade.fees = totalFees;
          }
          
        } else {
          // Direction change - close current trade and potentially start new one
          if (openTrade) {
            const closeQty = Math.abs(position);
            // For futures, we need tick size and tick value from instrument metadata
            // For now, using a simplified calculation - this should be enhanced with proper tick data
            const realizedPnl = calculateEquityPnL(
              openTrade.avg_open_price,
              exec.price,
              closeQty * exec.multiplier,
              totalFees
            ).toNumber();
            
            openTrade.status = 'closed';
            openTrade.closed_at = exec.timestamp;
            openTrade.qty_closed = closeQty;
            openTrade.avg_close_price = exec.price;
            openTrade.realized_pnl = realizedPnl;
            openTrade.fees = totalFees;
            
            trades.push(openTrade);
            created++;
          }
          
          if (newPosition !== 0) {
            position = newPosition;
            avgPrice = newCost / Math.abs(position);
            totalCost = newCost;
            totalFees = newFees;
            firstExecId = exec.id;
            lastExecId = exec.id;
            
            openTrade = {
              user_id: exec.user_id,
              group_key: generateGroupKey(symbol, exec.id),
              symbol,
              instrument_type: 'futures',
              status: 'open',
              opened_at: exec.timestamp,
              qty_opened: Math.abs(position), // Use absolute quantity
              qty_closed: 0,
              avg_open_price: avgPrice, // Use actual calculated price
              realized_pnl: 0,
              fees: totalFees,
              ingestion_run_id: exec.source_import_run_id,
              row_hash: undefined, // Set to undefined to avoid unique constraint violation
            };
          } else {
            openTrade = null;
          }
        }
      }
    }
    
    // Save trades to database
    for (const trade of trades) {
      await upsertTrade(trade, supabase);
    }
    
    if (openTrade) {
      await upsertTrade(openTrade, supabase);
      updated++;
    }
  }

  return { updated, created };
}

// Helper functions
function generateGroupKey(symbol: string, firstExecId: string): string {
  return `${symbol}-${firstExecId}`;
}

function groupIntoWindows(executions: Execution[]): Execution[][] {
  const windows: Execution[][] = [];
  let currentWindow: Execution[] = [];
  
  for (const exec of executions) {
    if (currentWindow.length === 0) {
      currentWindow = [exec];
    } else {
      const lastExec = currentWindow[currentWindow.length - 1];
      const timeDiff = Math.abs(new Date(exec.timestamp).getTime() - new Date(lastExec.timestamp).getTime());
      
      // Same order_id or within 60 seconds
      if (exec.order_id === lastExec.order_id || timeDiff <= 60000) {
        currentWindow.push(exec);
      } else {
        windows.push(currentWindow);
        currentWindow = [exec];
      }
    }
  }
  
  if (currentWindow.length > 0) {
    windows.push(currentWindow);
  }
  
  return windows;
}

async function upsertTrade(trade: Trade, supabase: SupabaseClient): Promise<void> {
  
  // Validate trade before upserting - skip invalid trades
  if (trade.qty_opened <= 0) {
    console.warn(`Skipping trade upsert: qty_opened is ${trade.qty_opened} (must be > 0)`);
    return;
  }
  if (trade.avg_open_price <= 0) {
    console.warn(`Skipping trade upsert: avg_open_price is ${trade.avg_open_price} (must be > 0)`);
    return;
  }
  
  // Ensure all required fields are set and constraints are satisfied
  const tradeData = {
    ...trade,
    qty_opened: trade.qty_opened, // Already validated above
    qty_closed: trade.qty_closed || 0, // Ensure qty_closed >= 0
    avg_open_price: trade.avg_open_price, // Already validated above
    avg_close_price: trade.avg_close_price || null, // Allow null for open trades
    updated_at: new Date().toISOString(),
  };
  
  // Log trade data for debugging (but only if it's invalid to reduce noise)
  if (tradeData.qty_opened <= 0 || tradeData.avg_open_price <= 0) {
    console.error('[Upsert Trade] INVALID TRADE DETECTED:', {
      id: trade.id,
      symbol: trade.symbol,
      qty_opened: tradeData.qty_opened,
      avg_open_price: tradeData.avg_open_price,
      status: trade.status,
      instrument_type: trade.instrument_type,
      fullTrade: tradeData
    });
  }
  
  // Use upsert with group_key as the conflict resolution key
  // If group_key doesn't exist as a unique constraint, we'll need to check manually
  const { error } = await supabase
    .from('trades')
    .upsert(tradeData, { 
      onConflict: 'user_id,group_key',
      ignoreDuplicates: false 
    });
    
  if (error) {
    // If upsert fails due to no conflict target, try insert with manual check
    if (error.code === 'PGRST116' || error.message?.includes('conflict')) {
      // Check if trade exists by group_key
      const { data: existing } = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', trade.user_id)
        .eq('group_key', trade.group_key)
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('Error updating trade:', updateError);
          throw updateError;
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('trades')
          .insert(tradeData);
        
        if (insertError) {
          console.error('Error inserting trade:', insertError);
          throw insertError;
        }
      }
    } else {
      console.error('Error upserting trade:', error);
      console.error('Trade data:', tradeData);
      throw error;
    }
  }
}
