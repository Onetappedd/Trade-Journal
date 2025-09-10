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
  option_type?: 'call' | 'put';
  multiplier: number;
  underlying?: string;
  broker_account_id?: string;
}

interface Trade {
  id?: string;
  user_id: string;
  group_key: string;
  symbol: string;
  instrument_type: 'equity' | 'option' | 'future';
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  qty_opened: number;
  qty_closed?: number;
  avg_open_price: number;
  avg_close_price?: number;
  realized_pnl: number;
  fees: number;
  currency: string;
  venue: string;
  legs?: any[]; // For options
  notes?: string;
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
    const equityExecutions = executions.filter(e => e.instrument_type === 'stock' || e.instrument_type === 'equity');
    const optionExecutions = executions.filter(e => e.instrument_type === 'option');
    const futureExecutions = executions.filter(e => e.instrument_type === 'future');

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
      const qty = exec.side === 'sell' || exec.side === 'short' ? -exec.quantity : exec.quantity;
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
           qty_opened: Math.abs(qty),
           qty_closed: 0,
           avg_open_price: avgPrice,
           realized_pnl: 0,
           fees: totalFees,
           currency: exec.currency,
           venue: exec.venue,
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
            openTrade.qty_opened = Math.abs(position);
            openTrade.avg_open_price = avgPrice;
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
               qty_opened: Math.abs(position),
               qty_closed: 0,
               avg_open_price: avgPrice,
               realized_pnl: 0,
               fees: totalFees,
               currency: exec.currency,
               venue: exec.venue,
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
      
      for (const exec of window) {
        const legKey = `${exec.strike}-${exec.option_type === 'C' ? 'call' : 'put'}-${exec.side}`;
        const qty = exec.side === 'sell' ? -exec.quantity : exec.quantity;
        const cost = qty * exec.price * exec.multiplier;
        
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
          leg.avg_price = 0;
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
      
      // Calculate P&L for options using the new function
      let realizedPnl = 0;
      if (status === 'closed') {
        const optionLegs = Array.from(legs.values()).map(leg => ({
          openPrice: leg.avg_price,
          closePrice: leg.avg_price, // For now, using same price - this should be enhanced
          quantity: Math.abs(leg.qty),
          multiplier: 100 // Default option multiplier
        }));
        realizedPnl = calculateOptionPnL(optionLegs, totalFees).toNumber();
      }
      
      const trade: Trade = {
        user_id: window[0].user_id,
        group_key: generateGroupKey(underlying, firstExecId),
        symbol: underlying,
        instrument_type: 'option',
        status,
        opened_at: window[0].timestamp,
        closed_at: status === 'closed' ? window[window.length - 1].timestamp : undefined,
        qty_opened: Math.abs(netPosition),
        qty_closed: status === 'closed' ? Math.abs(netPosition) : 0,
        avg_open_price: 0, // Calculate from legs
        avg_close_price: status === 'closed' ? 0 : undefined,
        realized_pnl: realizedPnl,
        fees: totalFees,
        currency: window[0].currency,
        venue: window[0].venue,
        legs: legsArray,
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
      const qty = exec.side === 'sell' ? -exec.quantity : exec.quantity;
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
           instrument_type: 'future',
           status: 'open',
           opened_at: exec.timestamp,
           qty_opened: Math.abs(qty),
           qty_closed: 0,
           avg_open_price: avgPrice,
           realized_pnl: 0,
           fees: totalFees,
           currency: exec.currency,
           venue: exec.venue,
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
            openTrade.qty_opened = Math.abs(position);
            openTrade.avg_open_price = avgPrice;
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
               instrument_type: 'future',
               status: 'open',
               opened_at: exec.timestamp,
               qty_opened: Math.abs(position),
               qty_closed: 0,
               avg_open_price: avgPrice,
               realized_pnl: 0,
               fees: totalFees,
               currency: exec.currency,
               venue: exec.venue,
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
  
  const { error } = await supabase
    .from('trades')
    .upsert({
      ...trade,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'group_key',
    });
    
  if (error) {
    console.error('Error upserting trade:', error);
    throw error;
  }
}
