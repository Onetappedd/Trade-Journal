/**
 * Batch insert utilities with retry logic and duplicate handling
 * Handles large batch inserts with proper error recovery and duplicate detection
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface InsertResult {
  inserted: number;
  duplicates: number;
  failed: any[];
}

/**
 * Pure helper function for bisecting inserts to isolate failures
 * @param rows Array of rows to insert
 * @param insertFn Function that performs the actual insert
 * @returns Result with counts of inserted, duplicates, and failed rows
 */
export async function bisectInsert(
  rows: any[],
  insertFn: (batch: any[]) => Promise<{ data: any; error: any }>
): Promise<InsertResult> {
  if (rows.length === 0) {
    return { inserted: 0, duplicates: 0, failed: [] };
  }

  if (rows.length === 1) {
    // Single row - try to insert
    const result = await insertFn(rows);
    
    if (result.error) {
      // Check if it's a unique violation (duplicate)
      if (result.error.code === '23505' && result.error.message.includes('unique_hash')) {
        return { inserted: 0, duplicates: 1, failed: [] };
      }
      // Other error - mark as failed
      return { inserted: 0, duplicates: 0, failed: rows };
    }
    
    return { inserted: 1, duplicates: 0, failed: [] };
  }

  // Split into two halves
  const mid = Math.floor(rows.length / 2);
  const leftHalf = rows.slice(0, mid);
  const rightHalf = rows.slice(mid);

  // Process both halves recursively
  const [leftResult, rightResult] = await Promise.all([
    bisectInsert(leftHalf, insertFn),
    bisectInsert(rightHalf, insertFn)
  ]);

  // Combine results
  return {
    inserted: leftResult.inserted + rightResult.inserted,
    duplicates: leftResult.duplicates + rightResult.duplicates,
    failed: [...leftResult.failed, ...rightResult.failed]
  };
}

/**
 * Insert batch of rows with retry logic and error handling
 * @param supabase Supabase client instance
 * @param rows Array of rows to insert
 * @returns Result with counts of inserted, duplicates, and failed rows
 */
export async function insertBatch(
  supabase: SupabaseClient,
  rows: any[]
): Promise<InsertResult> {
  console.log('insertBatch called with', rows.length, 'rows');
  if (rows.length === 0) {
    console.log('insertBatch: No rows to insert');
    return { inserted: 0, duplicates: 0, failed: [] };
  }

  // Create insert function with retry logic
  const insertWithRetry = async (batch: any[]): Promise<{ data: any; error: any }> => {
    const retryDelays = [250, 500, 1000]; // ms
    
    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      try {
        const result = await supabase
          .from('executions_normalized')
          .insert(batch)
          .select('id')
          .limit(1); // Use minimal data for performance

        // Check for rate limiting errors
        if (result.error && (result.error.code === '429' || result.error.code === '503')) {
          if (attempt < retryDelays.length - 1) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
            continue;
          }
        }

        return result;
      } catch (error) {
        // Network or other errors - retry if not last attempt
        if (attempt < retryDelays.length - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
          continue;
        }
        
        // Last attempt failed
        return { data: null, error };
      }
    }

    // All retries exhausted
    return { data: null, error: { code: 'RETRY_EXHAUSTED', message: 'All retry attempts failed' } };
  };

  // Try to insert the entire batch first
  console.log('Attempting to insert batch of', rows.length, 'rows');
  const result = await insertWithRetry(rows);
  console.log('Insert result:', result);

  if (!result.error) {
    // Success - all rows inserted
    console.log('Batch insert successful:', rows.length, 'rows inserted');
    return { inserted: rows.length, duplicates: 0, failed: [] };
  }

  // Handle specific error types
  if (result.error.code === '23505' && result.error.message.includes('unique_hash')) {
    // Unique violation - use bisection to count duplicates
    return await bisectInsert(rows, insertWithRetry);
  }

  // Other errors - use bisection to isolate failing records
  return await bisectInsert(rows, insertWithRetry);
}
