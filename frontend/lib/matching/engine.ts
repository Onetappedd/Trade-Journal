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
  notes?: string;
  meta?: Record<string, any>;
  source_broker?: string;
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

    // Auto-expire options that are past expiration date and still open
    const expiredCount = await closeExpiredOptions(userId, client);
    if (expiredCount > 0) {
      console.log(`[Matching] Auto-expired ${expiredCount} options`);
      updatedTrades += expiredCount;
    }

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
  
  // 1. Filter and Group
  const contractGroups = new Map<string, Execution[]>();
  
  for (const exec of executions) {
    // Validate required fields
    if (!exec.quantity || exec.quantity <= 0) continue;
    if (!exec.underlying || !exec.expiry || !exec.strike || !exec.option_type) {
       console.warn(`[Robinhood Matching] Skipping execution ${exec.id}: missing required option fields`);
       continue;
    }

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
  
  // 2. Process each contract group
  for (const [key, execs] of contractGroups) {
    // Sort chronologically
    execs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // FIFO open lots queue
    type OpenLot = {
      qtyRemaining: Decimal;
      price: Decimal;
      openedAt: Date;
      multiplier: Decimal;
      fees: Decimal;
    };
    const openLots: OpenLot[] = [];
    
    // Track the current active trade for this contract
    // "Accumulative" model: we update this trade until it is flat.
    let activeTrade: Trade | null = null;
    
    for (const exec of execs) {
      const side = exec.side.toUpperCase(); // 'BUY' or 'SELL'
      const price = toDec(exec.price);
      const multiplier = toDec(exec.multiplier || 100);
      const qty = toDec(exec.quantity); // Absolute quantity
      const fees = toDec(exec.fees || 0);
      
      const isBuy = side === 'BUY';
      // OEXP detection
      const isOEXP = exec.meta?.robinhoodTransCode === 'OEXP' || 
                     exec.notes?.toUpperCase().includes('OPTION EXPIRATION') || 
                     exec.notes?.toUpperCase().includes('OEXP');
      
      if (isBuy) {
        // --- BTO: Open/Add to Position ---
        openLots.push({
          qtyRemaining: qty,
          price: price,
          openedAt: new Date(exec.timestamp),
          fees: fees,
          multiplier: multiplier
        });
        
        if (!activeTrade) {
          // Start a NEW Trade
          const [accountId, underlying, expiry, strikeStr, optType] = key.split('::');
          
          // Format expiry
          let optionExpiry = expiry;
          try {
            const date = new Date(expiry);
            if (!isNaN(date.getTime())) {
              optionExpiry = date.toISOString().split('T')[0];
            }
          } catch (e) {}
          
          activeTrade = {
            user_id: exec.user_id,
            group_key: generateGroupKey(underlying, exec.id), // Unique per trade cycle
            symbol: underlying,
            instrument_type: 'option',
            status: 'open',
            opened_at: exec.timestamp,
            qty_opened: qty.toNumber(),
            qty_closed: 0,
            avg_open_price: price.toNumber(),
            avg_close_price: undefined,
            realized_pnl: 0,
            fees: fees.toNumber(),
            underlying_symbol: underlying,
            option_expiration: optionExpiry,
            option_strike: parseFloat(strikeStr),
            option_type: optType === 'C' ? 'CALL' : 'PUT',
            source_broker: 'robinhood',
            meta: { contract_key: key },
            legs: [{
              side: 'long',
              strike: parseFloat(strikeStr),
              option_type: optType === 'C' ? 'call' : 'put',
              qty_opened: qty.toNumber(),
              qty_closed: 0,
              avg_open_price: price.toNumber(),
              avg_close_price: 0,
              realized_pnl: 0,
              expiry: optionExpiry
            }]
          };
          created++;
        } else {
          // Scale In: Update Active Trade
          const oldQty = toDec(activeTrade.qty_opened);
          const oldAvg = toDec(activeTrade.avg_open_price);
          const newTotal = oldQty.add(qty);
          const newAvg = (oldQty.mul(oldAvg).add(qty.mul(price))).div(newTotal);
          
          activeTrade.qty_opened = newTotal.toNumber();
          activeTrade.avg_open_price = newAvg.toNumber();
          activeTrade.fees = (activeTrade.fees || 0) + fees.toNumber();
          
          // Update legs (simplified: update first leg)
          if (activeTrade.legs && activeTrade.legs.length > 0) {
             activeTrade.legs[0].qty_opened = activeTrade.qty_opened;
             activeTrade.legs[0].avg_open_price = activeTrade.avg_open_price;
          }
          updated++;
        }
        
        await upsertTrade(activeTrade, supabase);
        
      } else {
        // --- STC / OEXP: Close Position ---
        let remainingToClose = qty;
        let accumulatedPnl = toDec(0);
        
        // Match against open lots FIFO
        while (remainingToClose.gt(0) && openLots.length > 0) {
          const lot = openLots[0];
          const take = Decimal.min(remainingToClose, lot.qtyRemaining);
          
          // P&L: Credit (Exit) - Debit (Entry)
          const entryVal = lot.price.mul(take).mul(multiplier);
          const exitVal = (isOEXP ? toDec(0) : price).mul(take).mul(multiplier);
          const pnl = exitVal.sub(entryVal);
          
          accumulatedPnl = accumulatedPnl.add(pnl);
          
          lot.qtyRemaining = lot.qtyRemaining.sub(take);
          remainingToClose = remainingToClose.sub(take);
          
          if (lot.qtyRemaining.lte(0)) openLots.shift();
        }
        
        if (activeTrade) {
          // Update Active Trade
          const closedSoFar = toDec(activeTrade.qty_closed || 0);
          const matchedQty = qty.sub(remainingToClose);
          
          if (matchedQty.gt(0)) {
            const totalClosed = closedSoFar.add(matchedQty);
            
            activeTrade.realized_pnl = (activeTrade.realized_pnl || 0) + accumulatedPnl.toNumber();
            activeTrade.fees = (activeTrade.fees || 0) + fees.toNumber();
            
            // Update Avg Close Price
            const prevAvgClose = toDec(activeTrade.avg_close_price || 0);
            const prevVal = prevAvgClose.mul(closedSoFar);
            const currentVal = (isOEXP ? toDec(0) : price).mul(matchedQty);
            const newAvgClose = prevVal.add(currentVal).div(totalClosed);
            
            activeTrade.qty_closed = totalClosed.toNumber();
            activeTrade.avg_close_price = newAvgClose.toNumber();
            activeTrade.closed_at = exec.timestamp; // Latest close
            
            // Set Close Reason
            if (isOEXP) {
               activeTrade.close_reason = 'expired';
               activeTrade.meta = { ...activeTrade.meta, close_reason: 'expired' };
            } else if (!activeTrade.close_reason) {
               activeTrade.close_reason = 'sell';
            }
            
            // Check if fully closed
            if (totalClosed.gte(toDec(activeTrade.qty_opened))) {
              activeTrade.status = 'closed';
            }
          }
          
          await upsertTrade(activeTrade, supabase);
          
          // If closed, reset activeTrade so next BTO starts new trade
          if (activeTrade.status === 'closed') {
            activeTrade = null;
          }
          updated++;
        } else {
           // Orphan close (no active trade found)
           // This implies shorting or missing BTO
           console.warn(`[Robinhood Matching] Orphan close/expiry for ${key}: ${qty} contracts`);
        }
      }
    }
    
    // Ensure any remaining open activeTrade is saved (already done in loop)
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

async function closeExpiredOptions(userId: string, supabase: SupabaseClient): Promise<number> {
  const today = new Date();
  
  // Fetch open options
  const { data: openOptions, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .eq('instrument_type', 'option');

  if (error || !openOptions) {
    console.error('[Matching] Error fetching open options for expiry check:', error);
    return 0;
  }

  let closedCount = 0;

  for (const trade of openOptions) {
    // Parse expiry
    let expiryDate: Date | null = null;
    if (trade.option_expiration) {
      expiryDate = new Date(trade.option_expiration);
    } else if (trade.legs && trade.legs.length > 0 && trade.legs[0].expiry) {
      // Fallback to leg expiry
      expiryDate = new Date(trade.legs[0].expiry);
    }

    if (expiryDate) {
      // Create date objects reset to midnight for comparison
      const expiryMidnight = new Date(expiryDate);
      expiryMidnight.setHours(0, 0, 0, 0);
      
      const todayMidnight = new Date(today);
      todayMidnight.setHours(0, 0, 0, 0);
      
      // Check if expired (expiry date is strictly in the past)
      if (expiryMidnight < todayMidnight) {
        
        const qtyOpened = toDec(trade.qty_opened);
        const qtyClosed = toDec(trade.qty_closed || 0);
        const qtyRemaining = qtyOpened.sub(qtyClosed);
        
        if (qtyRemaining.lte(0)) continue; // Should be closed already
        
        // Check side
        let isLong = true;
        if (trade.side) {
          isLong = trade.side.toUpperCase() === 'BUY' || trade.side.toUpperCase() === 'LONG';
        } else if (trade.legs && trade.legs.length > 0) {
          isLong = trade.legs[0].side.toUpperCase() === 'BUY' || trade.legs[0].side.toUpperCase() === 'LONG';
        }
        
        const multiplier = toDec(100);
        
        // Calculate realized P&L for this "close" action (expired worthless at 0)
        let remainingPnl = toDec(0);
        if (isLong) {
           // Loss = Entry Price * Qty * 100
           remainingPnl = toDec(0).sub(toDec(trade.avg_open_price)).mul(qtyRemaining).mul(multiplier);
        } else {
           // Profit = Entry Price * Qty * 100
           remainingPnl = toDec(trade.avg_open_price).sub(toDec(0)).mul(qtyRemaining).mul(multiplier);
        }
        
        // Total P&L = Existing Realized P&L + Remaining P&L
        const totalPnl = toDec(trade.realized_pnl || 0).add(remainingPnl);
        
        // Recalculate avg_close_price (weighted average with 0 price for this portion)
        const prevAvgClose = toDec(trade.avg_close_price || 0);
        const prevTotalCloseVal = prevAvgClose.mul(qtyClosed);
        const currentCloseVal = toDec(0).mul(qtyRemaining); // 0 price
        const newAvgClose = prevTotalCloseVal.add(currentCloseVal).div(qtyOpened);
        
        const closedTrade = {
          ...trade,
          status: 'closed',
          closed_at: expiryDate.toISOString(), // Set close date to expiration date
          qty_closed: qtyOpened.toNumber(), // Fully closed now
          avg_close_price: newAvgClose.toNumber(),
          realized_pnl: totalPnl.toNumber(),
          close_reason: 'expired_auto',
          updated_at: new Date().toISOString(),
          meta: {
              ...trade.meta,
              auto_expired: true,
              expired_on: new Date().toISOString()
          }
        };
        
        console.log(`[Matching] Auto-expiring option ${trade.symbol} (ID: ${trade.id})`);
        await upsertTrade(closedTrade as Trade, supabase);
        closedCount++;
      }
    }
  }
  return closedCount;
}
