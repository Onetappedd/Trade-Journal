import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { resolveInstrument } from '@/lib/instruments/resolve';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schema
const CommitChunkSchema = z.object({
  jobId: z.string().uuid(),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(5000), // Max 5000 rows per chunk
});

// Canonical field types
type CanonicalField = 
  | 'timestamp' | 'symbol' | 'side' | 'quantity' | 'price' | 'fees' 
  | 'currency' | 'venue' | 'order_id' | 'exec_id' | 'instrument_type'
  | 'expiry' | 'strike' | 'option_type' | 'multiplier' | 'underlying';

// Data normalization functions
function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function normalizeSide(side: string): 'buy' | 'sell' | 'short' | 'cover' {
  const normalized = side.toLowerCase().trim();
  if (['buy', 'long', 'b'].includes(normalized)) return 'buy';
  if (['sell', 's'].includes(normalized)) return 'sell';
  if (['short'].includes(normalized)) return 'short';
  if (['cover'].includes(normalized)) return 'cover';
  return 'buy'; // default
}

function parseTimestamp(timestamp: string, timezone?: string): string {
  try {
    // Try various timestamp formats
    let date: Date;
    
    // Handle common formats
    if (timestamp.includes('T') || timestamp.includes(' ')) {
      date = new Date(timestamp);
    } else if (timestamp.includes('/')) {
      // Handle MM/DD/YYYY or DD/MM/YYYY
      date = new Date(timestamp);
    } else {
      // Try parsing as timestamp
      const num = parseFloat(timestamp);
      if (!isNaN(num)) {
        date = new Date(num);
      } else {
        date = new Date(timestamp);
      }
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp');
    }

    // Convert to UTC
    return date.toISOString();
  } catch (error) {
    throw new Error(`Failed to parse timestamp: ${timestamp}`);
  }
}

function parseNumber(value: string): number {
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  
  // Handle parentheses (negative numbers)
  const isNegative = str.includes('(') && str.includes(')');
  const cleanStr = str.replace(/[(),]/g, '');
  
  const num = parseFloat(cleanStr);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  
  return isNegative ? -num : num;
}

// Generate unique hash (now handled by database trigger)
function generateUniqueHash(row: any, brokerAccountId?: string): string {
  const components = [
    row.timestamp,
    row.symbol,
    row.side,
    Math.abs(row.quantity),
    row.price,
    brokerAccountId || ''
  ];
  
  return components.join('|');
}

// Parse CSV chunk
async function parseCsvChunk(buffer: Buffer, offset: number, limit: number, delimiter: string = ','): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter,
      columns: true,
      skip_empty_lines: true,
      max_record_size: 1024 * 1024,
    });

    const rows: any[] = [];
    let currentRow = 0;
    
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) && rows.length < limit) {
        if (currentRow >= offset) {
          rows.push(record);
        }
        currentRow++;
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve(rows));
    parser.write(buffer);
    parser.end();
  });
}

// Parse Excel chunk
function parseExcelChunk(buffer: Buffer, offset: number, limit: number): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length <= 1) {
    return [];
  }

  const headers = jsonData[0] as string[];
  const startRow = offset + 1; // Skip header
  const endRow = Math.min(startRow + limit, jsonData.length);
  
  return jsonData.slice(startRow, endRow).map((row: any) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// Parse IBKR Flex XML chunk
function parseFlexXmlChunk(buffer: Buffer, offset: number, limit: number): any[] {
  const xmlString = buffer.toString('utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  });

  const parsed = parser.parse(xmlString);
  const trades: any[] = [];
  
  // Handle Trades
  if (parsed.FlexQueryResponse?.Trades?.Trade) {
    const tradeArray = Array.isArray(parsed.FlexQueryResponse.Trades.Trade) 
      ? parsed.FlexQueryResponse.Trades.Trade 
      : [parsed.FlexQueryResponse.Trades.Trade];
    
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, tradeArray.length);
    
    tradeArray.slice(startIndex, endIndex).forEach((trade: any) => {
      trades.push({
        dateTime: trade.dateTime || trade['@_dateTime'],
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        fees: trade.fees,
        currency: trade.currency || 'USD',
        venue: trade.exchange || 'UNKNOWN',
        order_id: trade.orderId,
        exec_id: trade.execId,
        instrument_type: trade.secType || 'equity'
      });
    });
  }
  
  return trades;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = CommitChunkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { jobId, offset, limit } = validation.data;

    // Get import job details
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !importJob) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    if (importJob.status !== 'processing') {
      return NextResponse.json({ error: 'Job is not in processing state' }, { status: 400 });
    }

    // Check if chunk is already processed
    if (offset < importJob.processed_rows) {
      return NextResponse.json({
        processedRows: importJob.processed_rows,
        added: 0,
        duplicates: 0,
        errors: 0,
        message: 'Chunk already processed'
      });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('imports')
      .download(importJob.upload_ref);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    
    // Determine file type from upload_ref
    const fileType = importJob.upload_ref.includes('.xml') ? 'xml' :
                    importJob.upload_ref.includes('.xlsx') ? 'xlsx' :
                    importJob.upload_ref.includes('.xls') ? 'xls' :
                    importJob.upload_ref.includes('.tsv') ? 'tsv' : 'csv';

    // Parse chunk based on file type
    let chunkRows: any[];
    switch (fileType) {
      case 'csv':
      case 'tsv':
        const delimiter = fileType === 'tsv' ? '\t' : ',';
        chunkRows = await parseCsvChunk(buffer, offset, limit, delimiter);
        break;
      case 'xlsx':
      case 'xls':
        chunkRows = parseExcelChunk(buffer, offset, limit);
        break;
      case 'xml':
        chunkRows = parseFlexXmlChunk(buffer, offset, limit);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (chunkRows.length === 0) {
      return NextResponse.json({
        processedRows: offset,
        added: 0,
        duplicates: 0,
        errors: 0,
        message: 'No rows in chunk'
      });
    }

    // Process chunk
    let added = 0;
    let duplicates = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    // Use transaction for batch processing
    const { data: result, error: transactionError } = await supabase.rpc('process_import_chunk', {
      p_job_id: jobId,
      p_import_run_id: importJob.import_run_id,
      p_user_id: user.id,
      p_chunk_rows: JSON.stringify(chunkRows),
      p_mapping: JSON.stringify(importJob.mapping),
      p_offset: offset,
      p_limit: limit
    } as any);

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      
             // Fallback to individual processing
       for (let i = 0; i < chunkRows.length; i++) {
         const row: Record<string, any> = chunkRows[i];
         const lineNumber = offset + i + 1; // +1 for 1-based line numbers

        try {
          // Map row to canonical fields
          const mappedData: any = {};
          for (const [canonicalField, sourceField] of Object.entries(importJob.mapping)) {
            if (sourceField && typeof sourceField === 'string' && row[sourceField] !== undefined) {
              mappedData[canonicalField] = row[sourceField];
            }
          }

          // Validate required fields
          const requiredFields: CanonicalField[] = ['timestamp', 'symbol', 'side', 'quantity', 'price'];
          for (const field of requiredFields) {
            if (!mappedData[field]) {
              throw new Error(`Missing required field: ${field}`);
            }
          }

          // Normalize data
          const normalizedData = {
            timestamp: parseTimestamp(mappedData.timestamp, importJob.options?.tz),
            symbol: normalizeSymbol(mappedData.symbol),
            side: normalizeSide(mappedData.side),
            quantity: parseNumber(mappedData.quantity),
            price: parseNumber(mappedData.price),
            fees: parseNumber(mappedData.fees || '0'),
            currency: (mappedData.currency || 'USD').toUpperCase(),
            venue: (mappedData.venue || 'UNKNOWN').toUpperCase(),
            order_id: mappedData.order_id || null,
            exec_id: mappedData.exec_id || null,
            instrument_type: mappedData.instrument_type || 'equity',
            expiry: mappedData.expiry,
            strike: mappedData.strike ? parseNumber(mappedData.strike) : undefined,
            option_type: mappedData.option_type,
            multiplier: mappedData.multiplier ? parseNumber(mappedData.multiplier) : undefined,
            underlying: mappedData.underlying ? normalizeSymbol(mappedData.underlying) : undefined,
          };

          // Generate unique hash
          const uniqueHash = generateUniqueHash(normalizedData);

          // Check for existing execution
          const { data: existing } = await supabase
            .from('executions_normalized')
            .select('id')
            .eq('unique_hash', uniqueHash)
            .eq('user_id', user.id)
            .single();

          if (existing) {
            duplicates++;
          } else {
            // Resolve instrument
            let instrumentId: string | null = null;
            try {
              const resolved = await resolveInstrument({
                symbol: normalizedData.symbol,
                occ_symbol: normalizedData.symbol,
                futures_symbol: normalizedData.symbol,
                expiry: normalizedData.expiry,
                strike: normalizedData.strike,
                option_type: normalizedData.option_type,
                underlying: normalizedData.underlying,
                multiplier: normalizedData.multiplier,
                instrument_type: normalizedData.instrument_type,
              });
              instrumentId = resolved.instrument_id;
            } catch (resolveError) {
              console.warn(`Failed to resolve instrument for ${normalizedData.symbol}:`, resolveError);
            }

            // Insert new execution
            const { error: execError } = await supabase
              .from('executions_normalized')
              .insert({
                user_id: user.id,
                import_run_id: importJob.import_run_id,
                unique_hash: uniqueHash,
                instrument_id: instrumentId,
                timestamp: normalizedData.timestamp,
                symbol: normalizedData.symbol,
                side: normalizedData.side,
                quantity: normalizedData.quantity,
                price: normalizedData.price,
                fees: normalizedData.fees,
                currency: normalizedData.currency,
                venue: normalizedData.venue,
                order_id: normalizedData.order_id,
                exec_id: normalizedData.exec_id,
                instrument_type: normalizedData.instrument_type,
                expiry: normalizedData.expiry,
                strike: normalizedData.strike,
                option_type: normalizedData.option_type,
                multiplier: normalizedData.multiplier,
                underlying: normalizedData.underlying,
                status: 'new',
              });

            if (execError) {
              throw new Error(`Failed to save execution: ${execError.message}`);
            }

            added++;
          }

        } catch (rowError) {
          errors++;
          errorDetails.push({
            line: lineNumber,
            message: rowError instanceof Error ? rowError.message : 'Unknown error'
          });
        }
      }
    } else {
      // Use transaction results
      added = result.added || 0;
      duplicates = result.duplicates || 0;
      errors = result.errors || 0;
    }

    // Update job progress
    const newProcessedRows = Math.min(offset + chunkRows.length, importJob.total_rows);
    await supabase
      .from('import_jobs')
      .update({ processed_rows: newProcessedRows })
      .eq('id', jobId);

    // Update import run summary
    await supabase
      .from('import_runs')
      .update({
        summary: {
          total: importJob.total_rows,
          added: (importJob.processed_rows || 0) + added,
          duplicates: duplicates,
          errors: errors,
        }
      })
      .eq('id', importJob.import_run_id);

    return NextResponse.json({
      processedRows: newProcessedRows,
      added,
      duplicates,
      errors,
      message: `Processed ${chunkRows.length} rows`
    });

  } catch (error) {
    console.error('Commit chunk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
