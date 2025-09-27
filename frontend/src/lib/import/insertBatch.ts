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
  insertFn: (batch: any[]) => Promise<{ data: any; error: any }>,
  depth: number = 0
): Promise<InsertResult> {
  // Prevent infinite recursion
  if (depth > 10) {
    console.error('🚫 Bisection depth limit reached, marking all rows as failed');
    return { inserted: 0, duplicates: 0, failed: rows };
  }

  if (rows.length === 0) {
    return { inserted: 0, duplicates: 0, failed: [] };
  }

  if (rows.length === 1) {
    // Single row - try to insert
    const result = await insertFn(rows);
    
    if (result.error) {
      // Check if it's a unique violation (duplicate) or 409 conflict
      if ((result.error.code === '23505' && (
        result.error.message.includes('unique_hash') || 
        result.error.message.includes('executions_normalized_unique_hash_key')
      )) || result.error.code === '409') {
        console.log('🔄 Single row duplicate/conflict detected, treating as duplicate');
        return { inserted: 0, duplicates: 1, failed: [] };
      }
      // Other error - mark as failed
      console.log('❌ Single row insert failed with error:', result.error.code, result.error.message);
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
    bisectInsert(leftHalf, insertFn, depth + 1),
    bisectInsert(rightHalf, insertFn, depth + 1)
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
  console.log('🔧 insertBatch called with', rows.length, 'rows');
  
  // Check authentication context
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 Auth context check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return { inserted: 0, duplicates: 0, failed: rows };
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return { inserted: 0, duplicates: 0, failed: rows };
    }
  } catch (error) {
    console.error('❌ Failed to check auth context:', error);
    return { inserted: 0, duplicates: 0, failed: rows };
  }
  
  if (rows.length === 0) {
    console.log('⚠️ insertBatch: No rows to insert');
    return { inserted: 0, duplicates: 0, failed: [] };
  }
  
  // Log sample data structure
  console.log('📊 Sample execution data:', JSON.stringify(rows[0], null, 2));

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

        // Check for specific error types that should not be retried
        if (result.error) {
          // Don't retry on duplicate/conflict errors - these are permanent
          if (result.error.code === '23505' || result.error.code === '409' || result.error.code === 'PGRST301') {
            return result; // Return immediately without retry
          }
          
          // Only retry on rate limiting and server errors
          if (result.error.code === '429' || result.error.code === '503') {
            if (attempt < retryDelays.length - 1) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
              continue;
            }
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
  console.log('💾 Attempting to insert batch of', rows.length, 'rows into executions_normalized table');
  const result = await insertWithRetry(rows);
  console.log('📋 Insert result:', result);
  
  if (result.error) {
    console.error('❌ Insert error details:', {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      fullError: result.error
    });
    
    // Check for specific error types
    if (result.error.code === 'PGRST301') {
      console.error('🚫 RLS Policy Error: Row Level Security is blocking the insert');
    } else if (result.error.code === '23505') {
      console.error('🔄 Duplicate Error: Unique constraint violation');
    } else if (result.error.code === '42501') {
      console.error('🔒 Permission Error: Insufficient privileges');
    } else if (result.error.message?.includes('JWT')) {
      console.error('🔑 JWT Error: Authentication token issue');
    }
  }

  if (!result.error) {
    // Success - all rows inserted
    console.log('Batch insert successful:', rows.length, 'rows inserted');
    return { inserted: rows.length, duplicates: 0, failed: [] };
  }

  // Handle specific error types
  if (result.error.code === '23505' && (
    result.error.message.includes('unique_hash') || 
    result.error.message.includes('executions_normalized_unique_hash_key') ||
    result.error.message.includes('user_id') ||
    result.error.message.includes('row_hash')
  )) {
    // Unique violation on (user_id, row_hash) - treat as duplicates directly to avoid infinite loops
    console.log('🔄 Detected duplicate hash conflict on (user_id, row_hash), treating all as duplicates');
    console.log('23505 error details:', {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint
    });
    return { inserted: 0, duplicates: rows.length, failed: [] };
  }

  // Handle 409 conflict errors (likely duplicate hashes)
  if (result.error.code === '409') {
    console.log('🔄 Detected 409 conflict error, treating as duplicates');
    // 409 errors are typically duplicate hashes, so treat all rows as duplicates
    // Log the error details for debugging
    console.log('409 error details:', {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint
    });
    return { inserted: 0, duplicates: rows.length, failed: [] };
  }

  // Handle RLS policy errors
  if (result.error.code === 'PGRST301') {
    console.error('🚫 RLS Policy Error: Cannot insert due to Row Level Security policy');
    return { inserted: 0, duplicates: 0, failed: rows };
  }

  // Other errors - mark all as failed to avoid infinite loops
  console.log('❌ Other error detected, marking all rows as failed');
  console.log('Other error details:', {
    code: result.error.code,
    message: result.error.message,
    details: result.error.details,
    hint: result.error.hint
  });
  return { inserted: 0, duplicates: 0, failed: rows };
}
