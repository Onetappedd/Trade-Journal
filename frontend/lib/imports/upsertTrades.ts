import { createHash } from 'crypto';
import { WebullTradeDTO } from './webull';
import { ImportError, createImportError, logImportError } from './errors';

export interface UpsertResult {
  inserted: number;
  skipped: number;
  duplicatesSkipped: number;
  errors: number;
  summary: {
    totalProcessed: number;
    newTrades: number;
    duplicateTrades: number;
    errorTrades: number;
  };
}

export interface TradeRecord {
  id?: string;
  user_id: string;
  broker: string;
  external_id: string;
  idempotency_key: string;
  asset_type: 'option' | 'equity';
  symbol: string;
  symbol_raw: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  fees: number;
  commission: number;
  executed_at: string; // ISO UTC
  group_key: string; // Required field for grouping trades
  instrument_type: string; // Required field for instrument type
  opened_at: string; // Required field for when trade was opened
  qty_opened: number; // Required field for quantity opened
  meta: Record<string, any>;
}

/**
 * Generates an idempotency key for a trade
 * @param broker - Broker name (e.g., 'webull')
 * @param externalId - External trade ID from broker
 * @param symbolRaw - Raw symbol from broker
 * @param executedAt - Execution timestamp
 * @param side - Trade side (buy/sell)
 * @param price - Trade price
 * @param quantity - Trade quantity
 * @returns Unique idempotency key
 */
export function generateIdempotencyKey(
  broker: string,
  externalId: string | null,
  symbolRaw: string,
  executedAt: string,
  side: string,
  price: number,
  quantity: number
): string {
  // Use externalId if available, otherwise create hash from trade details
  const keySource = externalId || `${symbolRaw}_${executedAt}_${side}_${price}_${quantity}`;
  const hashInput = `${broker}_${keySource}`;
  
  return createHash('sha256')
    .update(hashInput)
    .digest('hex')
    .substring(0, 32); // Use first 32 characters for efficiency
}

/**
 * Coerces a string to a number by cleaning and parsing
 * @param value - String or number to coerce
 * @returns Parsed number or null if invalid
 */
export function coerceNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Convert to string and clean
  let cleaned = String(value).trim();
  
  // Remove common price formatting characters
  cleaned = cleaned
    .replace(/[@$]/g, '')      // Remove all @ and $ symbols
    .replace(/,/g, '')         // Remove all commas
    .replace(/\s+/g, '')       // Remove all spaces
    .trim();
  
  // Handle empty string after cleaning
  if (cleaned === '' || cleaned === '-') {
    return null;
  }
  
  // Parse the cleaned value
  const parsed = parseFloat(cleaned);
  
  // Return null for NaN, otherwise return the parsed number
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely converts a string or number to a numeric value, defaulting to 0
 * @param value - Value to convert
 * @returns Numeric value or 0
 */
function safeNumeric(value: string | number | null | undefined): number {
  const coerced = coerceNumber(value);
  return coerced === null ? 0 : coerced;
}

/**
 * Converts a WebullTradeDTO to a TradeRecord for database storage
 * @param tradeDTO - Parsed trade DTO
 * @param userId - User ID
 * @returns TradeRecord ready for database insertion
 */
export function convertToTradeRecord(tradeDTO: WebullTradeDTO, userId: string): TradeRecord {
  // Coerce all numeric fields using coerceNumber
  const coercedPrice = coerceNumber(tradeDTO.price);
  const coercedQuantity = coerceNumber(tradeDTO.quantity);
  const coercedFees = coerceNumber(tradeDTO.fees);
  const coercedCommission = coerceNumber(tradeDTO.commission);
  
  // Ensure quantity is always positive magnitude
  const absoluteQuantity = coercedQuantity ? Math.abs(coercedQuantity) : 0;
  
  // Ensure side is explicitly set (buy|sell)
  const explicitSide = tradeDTO.side === 'sell' ? 'sell' : 'buy';
  
  // Use coerced values or default to 0
  const safePrice = coercedPrice ?? 0;
  const safeFees = coercedFees ?? 0;
  const safeCommission = coercedCommission ?? 0;

  const idempotencyKey = generateIdempotencyKey(
    tradeDTO.broker,
    tradeDTO.externalId,
    tradeDTO.symbolRaw,
    tradeDTO.executedAt,
    explicitSide,
    safePrice,
    absoluteQuantity
  );

  // Generate group key for grouping related trades
  // Use symbol + date to group trades of the same symbol on the same day
  const tradeDate = new Date(tradeDTO.executedAt).toISOString().split('T')[0];
  const groupKey = `${tradeDTO.symbol}_${tradeDate}`;

  return {
    user_id: userId,
    broker: tradeDTO.broker,
    external_id: tradeDTO.externalId,
    idempotency_key: idempotencyKey,
    asset_type: tradeDTO.assetType,
    symbol: tradeDTO.symbol,
    symbol_raw: tradeDTO.symbolRaw,
    side: explicitSide,
    qty: absoluteQuantity,
    price: safePrice,
    fees: safeFees,
    commission: safeCommission,
    executed_at: tradeDTO.executedAt,
    group_key: groupKey,
    instrument_type: tradeDTO.assetType, // Use asset_type as instrument_type
    opened_at: tradeDTO.executedAt, // Use executed_at as opened_at
    qty_opened: absoluteQuantity, // Use same quantity as opened
    meta: {
      ...tradeDTO.meta,
      originalBroker: tradeDTO.broker,
      importTimestamp: new Date().toISOString(),
      // Store original values for reference
      originalQuantity: tradeDTO.quantity,
      originalSide: tradeDTO.side,
      originalPrice: tradeDTO.price,
      originalFees: tradeDTO.fees,
      originalCommission: tradeDTO.commission
    }
  };
}

/**
 * Checks if a trade already exists based on idempotency key
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param idempotencyKey - Idempotency key to check
 * @returns True if trade exists, false otherwise
 */
export async function checkTradeExists(
  supabase: any,
  userId: string,
  idempotencyKey: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId)
      .eq('idempotency_key', idempotencyKey)
      .limit(1);

    if (error) {
      console.error('Error checking trade existence:', error);
      return false; // Assume doesn't exist on error
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking trade existence:', error);
    return false;
  }
}

/**
 * Upserts a single trade with idempotency checking
 * @param supabase - Supabase client
 * @param tradeRecord - Trade record to upsert
 * @returns Result of the upsert operation
 */
export async function upsertSingleTrade(
  supabase: any,
  tradeRecord: TradeRecord
): Promise<{ success: boolean; isDuplicate: boolean; error?: string }> {
  try {
    // Check if trade already exists
    const exists = await checkTradeExists(supabase, tradeRecord.user_id, tradeRecord.idempotency_key);
    
    if (exists) {
      const error = createImportError(tradeRecord.meta?.rowIndex || 0, 'DUPLICATE', tradeRecord.symbol_raw, {
        idempotencyKey: tradeRecord.idempotency_key,
        tradeRecord
      });
      logImportError(error, 'upsertSingleTrade');
      return { success: true, isDuplicate: true };
    }

    // Only insert if status is "filled" (filtered at higher level)
    const { data, error } = await supabase
      .from('trades')
      .insert(tradeRecord)
      .select('id');

    if (error) {
      const importError = createImportError(tradeRecord.meta?.rowIndex || 0, 'PARSE_ERROR', tradeRecord.symbol_raw, {
        databaseError: error.message,
        tradeRecord,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint
      });
      logImportError(importError, 'upsertSingleTrade');
      console.error('Error inserting trade:', error);
      console.error('Trade record that failed:', JSON.stringify(tradeRecord, null, 2));
      return { success: false, isDuplicate: false, error: error.message };
    }

    return { success: true, isDuplicate: false };
  } catch (error: any) {
    console.error('Error upserting trade:', error);
    return { success: false, isDuplicate: false, error: error.message };
  }
}

/**
 * Upserts multiple trades with idempotency checking
 * @param supabase - Supabase client
 * @param tradeDTOs - Array of trade DTOs to upsert
 * @param userId - User ID
 * @returns UpsertResult with detailed statistics
 */
export async function upsertTrades(
  supabase: any,
  tradeDTOs: WebullTradeDTO[],
  userId: string
): Promise<UpsertResult> {
  const result: UpsertResult = {
    inserted: 0,
    skipped: 0,
    duplicatesSkipped: 0,
    errors: 0,
    summary: {
      totalProcessed: tradeDTOs.length,
      newTrades: 0,
      duplicateTrades: 0,
      errorTrades: 0
    }
  };

  console.log(`Starting upsert of ${tradeDTOs.length} trades for user ${userId}`);

  for (const tradeDTO of tradeDTOs) {
    try {
      // Only process filled trades
      if (tradeDTO.status !== 'filled') {
        result.skipped++;
        continue;
      }

      // Convert to trade record
      const tradeRecord = convertToTradeRecord(tradeDTO, userId);
      
      // Upsert the trade
      const upsertResult = await upsertSingleTrade(supabase, tradeRecord);
      
      if (upsertResult.success) {
        if (upsertResult.isDuplicate) {
          result.duplicatesSkipped++;
          result.summary.duplicateTrades++;
          console.log(`Duplicate trade skipped: ${tradeRecord.symbol} ${tradeRecord.side} ${tradeRecord.qty} @ ${tradeRecord.price}`);
        } else {
          result.inserted++;
          result.summary.newTrades++;
          console.log(`Trade inserted: ${tradeRecord.symbol} ${tradeRecord.side} ${tradeRecord.qty} @ ${tradeRecord.price}`);
        }
      } else {
        result.errors++;
        result.summary.errorTrades++;
        console.error(`Error upserting trade: ${upsertResult.error}`);
      }
    } catch (error: any) {
      result.errors++;
      result.summary.errorTrades++;
      console.error(`Error processing trade: ${error.message}`);
    }
  }

  console.log('Upsert completed:', result);
  return result;
}

/**
 * Batch upserts trades for better performance
 * @param supabase - Supabase client
 * @param tradeDTOs - Array of trade DTOs to upsert
 * @param userId - User ID
 * @param batchSize - Number of trades to process in each batch
 * @returns UpsertResult with detailed statistics
 */
export async function batchUpsertTrades(
  supabase: any,
  tradeDTOs: WebullTradeDTO[],
  userId: string,
  batchSize: number = 50
): Promise<UpsertResult> {
  const result: UpsertResult = {
    inserted: 0,
    skipped: 0,
    duplicatesSkipped: 0,
    errors: 0,
    summary: {
      totalProcessed: tradeDTOs.length,
      newTrades: 0,
      duplicateTrades: 0,
      errorTrades: 0
    }
  };

  console.log(`Starting batch upsert of ${tradeDTOs.length} trades in batches of ${batchSize}`);

  // Process trades in batches
  for (let i = 0; i < tradeDTOs.length; i += batchSize) {
    const batch = tradeDTOs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: trades ${i + 1}-${Math.min(i + batchSize, tradeDTOs.length)}`);

    try {
      const batchResult = await upsertTrades(supabase, batch, userId);
      
      // Aggregate results
      result.inserted += batchResult.inserted;
      result.skipped += batchResult.skipped;
      result.duplicatesSkipped += batchResult.duplicatesSkipped;
      result.errors += batchResult.errors;
      result.summary.newTrades += batchResult.summary.newTrades;
      result.summary.duplicateTrades += batchResult.summary.duplicateTrades;
      result.summary.errorTrades += batchResult.summary.errorTrades;
    } catch (error: any) {
      console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
      result.errors += batch.length;
      result.summary.errorTrades += batch.length;
    }
  }

  console.log('Batch upsert completed:', result);
  return result;
}

/**
 * Gets existing trades for a user to check for duplicates
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param idempotencyKeys - Array of idempotency keys to check
 * @returns Set of existing idempotency keys
 */
export async function getExistingTrades(
  supabase: any,
  userId: string,
  idempotencyKeys: string[]
): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('idempotency_key')
      .eq('user_id', userId)
      .in('idempotency_key', idempotencyKeys);

    if (error) {
      console.error('Error fetching existing trades:', error);
      return new Set();
    }

    return new Set(data?.map(trade => trade.idempotency_key) || []);
  } catch (error) {
    console.error('Error fetching existing trades:', error);
    return new Set();
  }
}
