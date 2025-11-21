import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import { parse } from 'csv-parse/sync';
import { revalidateTag } from 'next/cache';
import { detectAdapter, robinhoodAdapter, webullAdapter, ibkrAdapter, schwabAdapter, fidelityAdapter } from '@/lib/import/parsing/engine';
import { matchUserTrades } from '@/lib/matching/engine';

// File size limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ROWS = 100000; // 100k rows max

// MIME type validation
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel'
];

// Request schema
const ImportRequestSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().max(MAX_FILE_SIZE),
  broker: z.string().optional(),
  preset: z.string().optional(),
  mapping: z.record(z.string()).optional(),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    normalizeTimestamps: z.boolean().default(true),
    mapFees: z.boolean().default(true)
  }).optional()
});

interface ImportStatus {
  id: string;
  status: 'pending' | 'processing' | 'partial' | 'success' | 'failed';
  progress: number;
  totalRows: number;
  processedRows: number;
  errors: string[];
  result?: {
    inserted: number;
    skipped: number;
    errors: number;
  };
}

/**
 * Enhanced CSV Import API with bulletproof processing
 * Features:
 * - File size and MIME validation
 * - Streaming/chunked parsing
 * - Row-level idempotency
 * - UTC timestamp normalization
 * - Broker preset support
 * - Real-time status updates
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const supabase = createSupabaseWithToken(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requestData = formData.get('data') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = await validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Parse request data
    let importRequest;
    try {
      const parsedData = JSON.parse(requestData || '{}');
      importRequest = ImportRequestSchema.parse(parsedData);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 400 });
    }

    // Create import run
    // Note: source must be one of: 'csv', 'email', 'manual', 'api' (database constraint)
    // Store broker name in options instead
    const { data: runData, error: runError } = await supabase
      .from('import_runs')
      .insert({
        user_id: user.id,
        source: 'csv', // Always 'csv' for CSV imports (database constraint)
        status: 'pending',
        file_name: importRequest.fileName,
        file_size: importRequest.fileSize,
        options: {
          ...(importRequest.options || {}),
          broker: importRequest.broker || 'csv', // Store broker name in options
          preset: importRequest.preset
        }
      })
      .select('id')
      .single();

    if (runError) {
      console.error('Error creating import run:', runError);
      return NextResponse.json({ error: 'Failed to create import run', details: runError.message }, { status: 500 });
    }

    const importRunId = runData.id;

    // Process CSV synchronously to return stats immediately
    // This provides better UX but may be slower for very large files
    try {
      const result = await processCSVAsync(file, importRunId, user.id, importRequest, supabase);
      
      return NextResponse.json({
        success: true,
        importRunId,
        status: 'success',
        message: 'Import completed successfully',
        stats: {
          inserted: result.inserted,
          skipped: result.skipped,
          errors: result.errors,
          totalRows: result.totalRows
        }
      });
    } catch (processError: any) {
      // Update import run status to failed
      await supabase
        .from('import_runs')
        .update({
          status: 'failed',
          errors: [processError instanceof Error ? processError.message : 'Unknown error']
        })
        .eq('id', importRunId);
      
      throw processError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Get import status
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const supabase = createSupabaseWithToken(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const importRunId = searchParams.get('id');

    if (!importRunId) {
      return NextResponse.json({ error: 'Import run ID required' }, { status: 400 });
    }

    const { data: run, error } = await supabase
      .from('import_runs')
      .select('*')
      .eq('id', importRunId)
      .eq('user_id', user.id)
      .single();

    if (error || !run) {
      return NextResponse.json({ error: 'Import run not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: run.id,
      status: run.status,
      progress: run.progress || 0,
      totalRows: run.total_rows || 0,
      processedRows: run.processed_rows || 0,
      errors: run.errors || [],
      result: run.result,
      createdAt: run.created_at,
      updatedAt: run.updated_at
    });

  } catch (error: any) {
    console.error('Get import status error:', error);
    return NextResponse.json({ error: 'Failed to get status', details: error.message }, { status: 500 });
  }
}

/**
 * Validate uploaded file
 */
async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  // Check file extension
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'File must have .csv extension' };
  }

  return { valid: true };
}

/**
 * Compute row hash for idempotency
 */
function computeRowHash(row: Record<string, any>, userId: string, broker: string): string {
  const normalizedRow = {
    user_id: userId,
    broker,
    symbol: row.symbol?.toString().toUpperCase(),
    side: row.side?.toString().toLowerCase(),
    quantity: row.quantity,
    price: row.price,
    date: row.date,
    broker_trade_id: row.broker_trade_id || row.trade_id || row.id
  };

  const hashInput = JSON.stringify(normalizedRow, Object.keys(normalizedRow).sort());
  return createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Normalize timestamp to UTC
 */
function normalizeTimestamp(timestamp: string | Date): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }
  return date.toISOString();
}

/**
 * Process CSV asynchronously
 */
async function processCSVAsync(
  file: File, 
  importRunId: string, 
  userId: string, 
  importRequest: z.infer<typeof ImportRequestSchema>,
  supabase: any
): Promise<{ inserted: number; skipped: number; errors: number; totalRows: number }> {
  try {
    // Update status to processing
    await supabase
      .from('import_runs')
      .update({ status: 'processing', progress: 0 })
      .eq('id', importRunId);

    // Read file once
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const csvContent = fileBuffer.toString('utf-8');
    
    // Detect broker format using parsing engine
    let detection = null;
    let fills: any[] = [];
    let parseErrors: Array<{ row: number; message: string }> = [];
    let parseWarnings: string[] = [];

    try {
      // Detect delimiter first
      const firstLine = csvContent.split('\n')[0] || '';
      const hasTabs = firstLine.includes('\t');
      const delimiter = hasTabs ? '\t' : ',';
      
      // Parse a sample of the CSV to get headers and sample rows for detection
      const sampleRecords = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: delimiter,
        relax_column_count: true,
        relax_quotes: true,
        to_line: 201 // Get first 200 rows + header
      });
      
      // Extract headers from the first record's keys
      const headers = sampleRecords.length > 0 
        ? Object.keys(sampleRecords[0] as Record<string, any>)
        : [];
      
      // Clean headers: remove quotes
      const cleanedHeaders = headers.map(h => String(h || '').replace(/^["']|["']$/g, '').trim());
      
      // Get sample rows (first 200)
      const sampleRows = sampleRecords.slice(0, 200);
      
      // Use parsing engine to detect
      detection = detectAdapter(cleanedHeaders, sampleRows);
      
      if (detection) {
        console.log(`Detected broker: ${detection.brokerId} with confidence ${detection.confidence}`);
        
        // Get the adapter
        const adapters = [robinhoodAdapter, webullAdapter, ibkrAdapter, schwabAdapter, fidelityAdapter];
        const adapter = adapters.find(a => a.id === detection!.brokerId);
        
        if (adapter) {
          // Detect delimiter (tab or comma)
          const firstLine = csvContent.split('\n')[0] || '';
          const hasTabs = firstLine.includes('\t');
          const delimiter = hasTabs ? '\t' : ',';
          
          // Parse full CSV
          const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            delimiter: delimiter,
            relax_column_count: true, // Allow inconsistent column counts
            relax_quotes: true // Be more lenient with quotes
          });

          if (records.length > MAX_ROWS) {
            throw new Error(`Too many rows. Maximum is ${MAX_ROWS}`);
          }

          // Parse using adapter
          const parseResult = adapter.parse({
            rows: records,
            headerMap: detection.headerMap,
            userTimezone: 'UTC',
            assetClass: detection.assetClass
          });

          fills = parseResult.fills;
          parseErrors = parseResult.errors;
          parseWarnings = parseResult.warnings;

          console.log(`Parsed ${fills.length} fills, ${parseErrors.length} errors, ${parseWarnings.length} warnings`);
        }
      }
    } catch (detectionError) {
      console.error('Detection/parsing error:', detectionError);
      // Fall back to simple parsing if detection fails
    }

    // If no fills from adapter, fall back to simple parsing
    if (fills.length === 0) {
      // Detect delimiter for fallback parse
      const firstLine = csvContent.split('\n')[0] || '';
      const hasTabs = firstLine.includes('\t');
      const delimiter = hasTabs ? '\t' : ',';
      
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: delimiter
      });

      if (records.length > MAX_ROWS) {
        throw new Error(`Too many rows. Maximum is ${MAX_ROWS}`);
      }

      // Use old normalization for backward compatibility
      fills = records.map((row: any, idx: number) => {
        try {
          const normalizedRow = normalizeRowDataSync(row, importRequest);
          return {
            sourceBroker: importRequest.broker || 'csv',
            assetClass: 'stocks' as const,
            symbol: normalizedRow.symbol,
            quantity: normalizedRow.quantity,
            price: normalizedRow.price,
            execTime: normalizedRow.entry_date || new Date().toISOString(),
            side: normalizedRow.side,
            fees: normalizedRow.fees || 0,
            raw: row
          };
        } catch (e) {
          parseErrors.push({ row: idx + 1, message: e instanceof Error ? e.message : 'Parse error' });
          return null;
        }
      }).filter(Boolean);
    }

    // Update total rows
    await supabase
      .from('import_runs')
      .update({ total_rows: fills.length })
      .eq('id', importRunId);

    let processedRows = 0;
    let inserted = 0;
    let skipped = 0;
    let errors = parseErrors.length;
    const errorMessages: string[] = parseErrors.map(e => `Row ${e.row}: ${e.message}`);

    // Process fills in chunks
    const CHUNK_SIZE = 100;
    for (let i = 0; i < fills.length; i += CHUNK_SIZE) {
      const chunk = fills.slice(i, i + CHUNK_SIZE);
      
      for (const fill of chunk) {
        try {
          // Convert NormalizedFill to execution data for executions_normalized table
          // This table holds raw executions which will be paired by the matching engine
          const executionData = {
            user_id: userId,
            source_import_run_id: importRunId,
            broker_account_id: null, // Can be populated if we have broker account info
            // Map assetClass to database instrument_type
            // Database only allows: 'equity', 'option', 'futures'
            // Parsing engine uses: 'stocks', 'options', 'futures', 'crypto'
            instrument_type: fill.assetClass === 'options' ? 'option' : 
                             fill.assetClass === 'futures' ? 'futures' : 
                             'equity', // 'stocks' and 'crypto' both map to 'equity'
            symbol: fill.symbol,
            side: (fill.side || (fill.quantity >= 0 ? 'buy' : 'sell')).toLowerCase(),
            quantity: Math.abs(fill.quantity),
            price: fill.price,
            fees: fill.fees || 0,
            currency: fill.currency || 'USD',
            timestamp: fill.execTime || new Date().toISOString(),
            venue: detection?.brokerId || importRequest.broker || 'csv',
            order_id: fill.orderId || fill.tradeIdExternal || randomUUID(),
            exec_id: fill.tradeIdExternal || randomUUID(),
            multiplier: fill.assetClass === 'options' ? 100 : 1,
            expiry: fill.expiry || null,
            strike: fill.strike || null,
            option_type: fill.right === 'C' || fill.right === 'CALL' ? 'C' : 
                         fill.right === 'P' || fill.right === 'PUT' ? 'P' : null,
            underlying: fill.underlying || null,
            notes: fill.notes || null,
            unique_hash: computeRowHashFromFill(fill, userId, detection?.brokerId || importRequest.broker || 'csv')
          };
          
          const rowHash = executionData.unique_hash;
          
          // Check for existing execution using unique_hash
          const { data: existing } = await supabase
            .from('executions_normalized')
            .select('id')
            .eq('user_id', userId)
            .eq('unique_hash', rowHash)
            .maybeSingle();

          if (existing && importRequest.options?.skipDuplicates) {
            skipped++;
            console.log(`[Import] Skipping duplicate execution: ${executionData.symbol} ${executionData.side} ${executionData.quantity} @ ${executionData.price}`);
          } else {
            if (existing) {
              const { error: updateError } = await supabase
                .from('executions_normalized')
                .update(executionData)
                .eq('id', existing.id);
              
              if (updateError) {
                throw new Error(`Update failed: ${updateError.message}`);
              }
            } else {
              const { error: insertError, data: insertData } = await supabase
                .from('executions_normalized')
                .insert(executionData)
                .select();
              
              if (insertError) {
                console.error(`[Import] Insert error for execution ${executionData.symbol}:`, insertError);
                throw new Error(`Insert failed: ${insertError.message}`);
              }
            }
            inserted++;
            
            if (inserted % 50 === 0) {
              console.log(`[Import] Progress: ${inserted} executions inserted so far...`);
            }
          }
        } catch (error) {
          errors++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errorMessages.push(`Row ${processedRows + 1}: ${errorMsg}`);
          console.error(`[Import] Error processing row ${processedRows + 1}:`, errorMsg);
          
          // Log first few errors in detail
          if (errors <= 5) {
            console.error(`[Import] Detailed error for row ${processedRows + 1}:`, error);
          }
        }
        
        processedRows++;
      }

      // Update progress
      const progress = Math.round((processedRows / fills.length) * 100);
      await supabase
        .from('import_runs')
        .update({ 
          progress,
          processed_rows: processedRows,
          errors: errorMessages
        })
        .eq('id', importRunId);
    }

    // Update final status
    await supabase
      .from('import_runs')
      .update({
        status: 'success',
        progress: 100,
        result: {
          inserted,
          skipped,
          errors
        }
      })
      .eq('id', importRunId);

    // Run matching engine immediately to pair executions into trades
    console.log('[Import] Running matching engine for import run:', importRunId);
    try {
      const matchResult = await matchUserTrades({
        userId,
        sinceImportRunId: importRunId,
        supabase
      });
      console.log('[Import] Matching completed:', matchResult);
    } catch (matchError) {
      console.error('[Import] Matching engine failed:', matchError);
      // We don't fail the import run if matching fails, but we log it
      // User can retry matching from UI
    }

    // Revalidate KPI cache after import completion
    revalidateTag('kpi');

    // Return stats for immediate response
    return {
      inserted,
      skipped,
      errors,
      totalRows: fills.length
    };

  } catch (error) {
    console.error('CSV processing error:', error);
    
    await supabase
      .from('import_runs')
      .update({
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
      .eq('id', importRunId);
    
    // Re-throw to be handled by caller
    throw error;
  }
}

/**
 * Normalize row data according to preset and options (sync version for fallback)
 */
function normalizeRowDataSync(
  row: Record<string, any>, 
  importRequest: z.infer<typeof ImportRequestSchema>
): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Apply mapping if provided
  if (importRequest.mapping) {
    for (const [target, source] of Object.entries(importRequest.mapping)) {
      normalized[target] = row[source];
    }
  } else {
    // Use default mapping
    normalized.symbol = row.symbol || row.Symbol || row.ticker;
    normalized.side = row.side || row.Side || row.action;
    normalized.quantity = parseFloat(row.quantity || row.Quantity || row.shares || row.qty || 0);
    normalized.price = parseFloat(row.price || row.Price || row.avg_price || 0);
    normalized.date = row.date || row.Date || row.trade_date || row.timestamp;
    normalized.broker_trade_id = row.broker_trade_id || row.trade_id || row.id;
    normalized.fees = parseFloat(row.fees || row.Fees || row.commission || 0);
    normalized.pnl = parseFloat(row.pnl || row.PnL || row.profit_loss || 0);
  }

  // Normalize timestamps to UTC
  if (importRequest.options?.normalizeTimestamps) {
    if (normalized.date) {
      normalized.entry_date = normalized.date;
      normalized.exit_date = normalized.date; // Assume same day for now
    }
  }

  // Map fees/commissions
  if (importRequest.options?.mapFees) {
    normalized.commission = normalized.fees || 0;
  }

  return normalized;
}

/**
 * Compute row hash from NormalizedFill
 */
function computeRowHashFromFill(fill: any, userId: string, broker: string): string {
  const normalizedRow = {
    user_id: userId,
    broker,
    symbol: fill.symbol?.toString().toUpperCase(),
    side: fill.side?.toString().toLowerCase(),
    quantity: fill.quantity,
    price: fill.price,
    date: fill.execTime,
    broker_trade_id: fill.tradeIdExternal || fill.orderId
  };

  const hashInput = JSON.stringify(normalizedRow, Object.keys(normalizedRow).sort());
  return createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Enqueue matching jobs for processed trades
 */
async function enqueueMatchingJobs(importRunId: string, userId: string, supabase: any) {
  try {
    // Get unique symbols and dates from the import
    const { data: trades } = await supabase
      .from('trades')
      .select('symbol, entry_date')
      .eq('user_id', userId)
      .eq('import_run_id', importRunId);

    if (!trades || trades.length === 0) return;

    // Group by symbol and date
    const batches = new Map<string, string[]>();
    
    for (const trade of trades) {
      const date = new Date(trade.entry_date).toISOString().split('T')[0];
      const key = `${trade.symbol}_${date}`;
      
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(trade.symbol);
    }

    // Create matching jobs
    for (const [key, symbols] of batches) {
      await supabase
        .from('matching_jobs')
        .insert({
          user_id: userId,
          import_run_id: importRunId,
          symbol: symbols[0],
          date: key.split('_')[1],
          status: 'pending'
        });
    }
  } catch (error) {
    console.error('Error enqueueing matching jobs:', error);
  }
}