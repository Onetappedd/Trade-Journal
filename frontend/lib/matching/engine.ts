import { getServerSupabase } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
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

    const { data: executions, error } = await query;
    if (error) throw error;

    console.log(`Found ${executions?.length || 0} executions for user ${userId}`);

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
      const qty = (exec.side === 'sell' || exec.side === 'short') ? -Math.abs(exec.quantity) : Math.abs(exec.quantity);
      const cost = qty * exec.price;
      
      if (position === 0) {
        // Starting a new position
        position = qty;
        avgPrice = exec.price;
        totalCost = cost;
        totalFees = exec.fees;
        firstExecId = exec.id;
        lastExecId = exec.id;
        
        // Create open trade
        openTrade = {
          user_id: exec.user_id,
          group_key: generateGroupKey(symbol, exec.id),
          symbol,
          instrument_type: 'equity',
          status: 'open',
          opened_at: exec.timestamp,
          qty_opened: Math.abs(qty), // Use absolute quantity for qty_opened
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
              exec.price,
              closeQty,
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
          
          // Start new position if remaining qty
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
              instrument_type: 'equity',
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
    
    // Update open trade if exists
    if (openTrade) {
      await upsertTrade(openTrade, supabase);
      updated++;
    }
  }

  return { updated, created };
}

// Options matching (multi-leg within window)
async function matchOptions(executions: Execution[], supabase: SupabaseClient): Promise<{ updated: number; created: number }> {
  console.log(`Starting options matching with ${executions.length} executions`);
  let updated = 0;
  let created = 0;

  // Group by underlying and expiry
  const optionGroups = new Map<string, Execution[]>();
  
  for (const exec of executions) {
    if (!exec.underlying || !exec.expiry) continue;
    const key = `${exec.underlying}-${exec.expiry}`;
    if (!optionGroups.has(key)) {
      optionGroups.set(key, []);
    }
    optionGroups.get(key)!.push(exec);
  }

  console.log(`Grouped into ${optionGroups.size} option groups`);

  for (const [key, optionExecs] of optionGroups) {
    const [underlying, expiry] = key.split('-');
    
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
            // The multiplier is typically 100 for standard options
            const matchedQty = Math.min(buy.quantity, sell.quantity);
            const priceDiff = sell.price - buy.price;
            const legPnL = priceDiff * matchedQty * (buy.multiplier || 100);
            totalPnL += legPnL;
            
            // Reduce quantities
            const matchedQty = Math.min(buy.quantity, sell.quantity);
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
      const optionStrike = firstLeg?.strike || null;
      const optionExpiry = firstLeg?.expiry || expiry || null;
      const optionType = firstLeg?.type === 'call' ? 'CALL' : firstLeg?.type === 'put' ? 'PUT' : null;
      
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
  
  // Ensure all required fields are set and constraints are satisfied
  const tradeData = {
    ...trade,
    qty_opened: trade.qty_opened > 0 ? trade.qty_opened : 0.01, // Ensure qty_opened > 0
    qty_closed: trade.qty_closed || 0, // Ensure qty_closed >= 0
    avg_open_price: trade.avg_open_price > 0 ? trade.avg_open_price : 0.01, // Ensure avg_open_price > 0
    avg_close_price: trade.avg_close_price || null, // Allow null for open trades
    updated_at: new Date().toISOString(),
  };
  
  console.log('Upserting trade:', tradeData);
  
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
