import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { matchUserTrades } from '@/lib/matching/engine';
import { resolveInstrument } from '@/lib/instruments/resolve';
import { requireProAccess, createSubscriptionRequiredResponse } from '@/lib/server-access-control';
import { emitUsageEvent } from '@/lib/usage-tracking';

// Initialize Sentry monitoring for API routes
import '@/lib/monitoring';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schema
const CommitSchema = z.object({
  uploadToken: z.string(),
  mapping: z.record(z.string()),
  options: z.object({
    tz: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
});

// Canonical field types
type CanonicalField = 
  | 'timestamp' | 'symbol' | 'side' | 'quantity' | 'price' | 'fees' 
  | 'currency' | 'venue' | 'order_id' | 'exec_id' | 'instrument_type'
  | 'expiry' | 'strike' | 'option_type' | 'multiplier' | 'underlying';

// Required fields for validation
const REQUIRED_FIELDS: CanonicalField[] = ['timestamp', 'symbol', 'side', 'quantity', 'price'];
const OPTION_REQUIRED_FIELDS: CanonicalField[] = ['expiry', 'strike', 'option_type'];

// Data normalization functions
function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function normalizeSide(side: string): 'buy' | 'sell' | 'short' {
  const normalized = side.toLowerCase().trim();
  if (['buy', 'long', 'b'].includes(normalized)) return 'buy';
  if (['sell', 's'].includes(normalized)) return 'sell';
  if (['short'].includes(normalized)) return 'short';
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

// Parse CSV file
async function parseCsvFile(buffer: Buffer, delimiter: string = ','): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter,
      columns: false, // Don't auto-convert to objects, we'll handle headers manually
      skip_empty_lines: true,
      max_record_size: 1024 * 1024,
    });

    const rows: any[] = [];
    let headers: string[] = [];
    let isFirstRow = true;
    
    parser.on('readable', () => {
      let record;
      while ((record = parser.read())) {
        if (isFirstRow) {
          // First row contains headers
          headers = record;
          isFirstRow = false;
          
          // Handle duplicate column names by appending numbers
          const processedHeaders: string[] = [];
          const headerCounts: Record<string, number> = {};
          
          for (const header of headers) {
            const cleanHeader = header.trim();
            if (headerCounts[cleanHeader]) {
              headerCounts[cleanHeader]++;
              processedHeaders.push(`${cleanHeader}_${headerCounts[cleanHeader]}`);
            } else {
              headerCounts[cleanHeader] = 1;
              processedHeaders.push(cleanHeader);
            }
          }
          
          headers = processedHeaders;
          return;
        }
        
        // Convert array to object using processed headers
        const rowObj: Record<string, any> = {};
        for (let i = 0; i < headers.length && i < record.length; i++) {
          rowObj[headers[i]] = record[i];
        }
        
        rows.push(rowObj);
      }
    });

    parser.on('error', reject);
    parser.on('end', () => {
      resolve(rows);
    });

    parser.write(buffer);
    parser.end();
  });
}

// Parse Excel file
function parseExcelFile(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length <= 1) {
    return [];
  }

  const headers = jsonData[0] as string[];
  return jsonData.slice(1).map((row: any) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// Parse IBKR Flex XML
function parseFlexXmlFile(buffer: Buffer): any[] {
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
    
    tradeArray.forEach((trade: any) => {
      trades.push({
        dateTime: trade.dateTime || trade['@_dateTime'],
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        fees: trade.fees,
        currency: trade.currency,
        exchange: trade.exchange,
        orderID: trade.orderID,
        execID: trade.execID,
        instrumentType: trade.instrumentType,
        expiry: trade.expiry,
        strike: trade.strike,
        optionType: trade.optionType,
        multiplier: trade.multiplier,
        underlying: trade.underlying,
      });
    });
  }

  // Handle OptionEAE
  if (parsed.FlexQueryResponse?.OptionEAE?.OptionEAE) {
    const optionArray = Array.isArray(parsed.FlexQueryResponse.OptionEAE.OptionEAE)
      ? parsed.FlexQueryResponse.OptionEAE.OptionEAE
      : [parsed.FlexQueryResponse.OptionEAE.OptionEAE];
    
    optionArray.forEach((option: any) => {
      trades.push({
        dateTime: option.dateTime || option['@_dateTime'],
        symbol: option.symbol,
        side: option.side,
        quantity: option.quantity,
        price: option.price,
        fees: option.fees,
        currency: option.currency,
        exchange: option.exchange,
        orderID: option.orderID,
        execID: option.execID,
        instrumentType: 'option',
        expiry: option.expiry,
        strike: option.strike,
        optionType: option.optionType,
        multiplier: option.multiplier,
        underlying: option.underlying,
      });
    });
  }

  return trades;
}

export async function POST(request: NextRequest) {
  try {
    // Check Pro access for CSV import
    const { userId } = await requireProAccess(request);
    
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { uploadToken, mapping, options } = CommitSchema.parse(body);

    // Validate required fields
    const missingRequired = REQUIRED_FIELDS.filter(field => !mapping[field]);
    if (missingRequired.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingRequired.join(', ')}` 
      }, { status: 400 });
    }

    // Get temp upload metadata
    const { data: tempUpload, error: tempError } = await supabase
      .from('temp_uploads')
      .select('*')
      .eq('token', uploadToken)
      .eq('user_id', user.id)
      .single();

    if (tempError || !tempUpload) {
      return NextResponse.json({ error: 'Invalid upload token' }, { status: 400 });
    }

    // Check if expired
    if (new Date(tempUpload.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Upload token expired' }, { status: 400 });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('imports')
      .download(`temp/${user.id}/${uploadToken}`);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Create import run
    const { data: importRun, error: runError } = await supabase
      .from('import_runs')
      .insert({
        user_id: user.id,
        source: 'csv',
        status: 'processing',
        started_at: new Date().toISOString(),
        summary: { added: 0, duplicates: 0, errors: 0 },
      })
      .select()
      .single();

    if (runError) {
      return NextResponse.json({ error: 'Failed to create import run' }, { status: 500 });
    }

    const runId = importRun.id;
    let added = 0;
    let duplicates = 0;
    let errors = 0;
    const errorDetails: Array<{ line: number; message: string }> = [];

    try {
      // Parse file based on type
      let rows: any[] = [];
      
      switch (tempUpload.file_type) {
        case 'csv':
          rows = await parseCsvFile(buffer, ',');
          break;
        case 'tsv':
          rows = await parseCsvFile(buffer, '\t');
          break;
        case 'xlsx':
        case 'xls':
          rows = parseExcelFile(buffer);
          break;
        case 'xml':
          rows = parseFlexXmlFile(buffer);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      // Process rows in batches
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const row = batch[j];
          const lineNumber = i + j + 2; // +2 for header row and 0-based index
          
          try {
            // Map raw data to canonical fields
            const mappedData: any = {};
            
            for (const [canonicalField, sourceField] of Object.entries(mapping)) {
              if (sourceField && row[sourceField] !== undefined) {
                mappedData[canonicalField] = row[sourceField];
              }
            }

            // Validate required fields
            for (const field of REQUIRED_FIELDS) {
              if (!mappedData[field]) {
                throw new Error(`Missing required field: ${field}`);
              }
            }

            // Check if options require additional fields
            if (mappedData.instrument_type === 'option') {
              for (const field of OPTION_REQUIRED_FIELDS) {
                if (!mappedData[field]) {
                  throw new Error(`Missing required option field: ${field}`);
                }
              }
            }

            // Normalize data
            const normalizedData = {
              timestamp: parseTimestamp(mappedData.timestamp, options?.tz),
              symbol: normalizeSymbol(mappedData.symbol),
              side: normalizeSide(mappedData.side),
              quantity: parseNumber(mappedData.quantity),
              price: parseNumber(mappedData.price),
              fees: mappedData.fees ? parseNumber(mappedData.fees) : 0,
              currency: mappedData.currency || options?.currency || 'USD',
              venue: mappedData.venue || '',
              order_id: mappedData.order_id || '',
              exec_id: mappedData.exec_id || '',
              instrument_type: mappedData.instrument_type || 'stock',
              expiry: mappedData.expiry || null,
              strike: mappedData.strike ? parseNumber(mappedData.strike) : null,
              option_type: mappedData.option_type || null,
              multiplier: mappedData.multiplier ? parseNumber(mappedData.multiplier) : 1,
              underlying: mappedData.underlying || null,
            };

            // Create raw import item
            const { error: rawError } = await supabase
              .from('raw_import_items')
              .insert({
                import_run_id: runId,
                raw_data: row,
                mapped_data: mappedData,
                line_number: lineNumber,
              });

            if (rawError) {
              throw new Error(`Failed to save raw data: ${rawError.message}`);
            }

            // Generate unique hash (database trigger will handle this automatically)
            const uniqueHash = generateUniqueHash(normalizedData);

            // Check for existing execution using unique_hash
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
                  occ_symbol: normalizedData.symbol, // Use symbol as OCC if it looks like one
                  futures_symbol: normalizedData.symbol, // Use symbol as futures if it looks like one
                  expiry: normalizedData.expiry,
                  strike: normalizedData.strike || undefined,
                  option_type: normalizedData.option_type,
                  underlying: normalizedData.underlying,
                  multiplier: normalizedData.multiplier,
                  instrument_type: normalizedData.instrument_type,
                });
                instrumentId = resolved.instrument_id;
              } catch (resolveError) {
                console.warn(`Failed to resolve instrument for ${normalizedData.symbol}:`, resolveError);
                // Continue without instrument resolution
              }

              // Insert new execution (unique_hash will be computed by database trigger)
              const { error: execError } = await supabase
                .from('executions_normalized')
                .insert({
                  user_id: user.id,
                  import_run_id: runId,
                  unique_hash: uniqueHash, // Database trigger will compute if null
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

            // Save error to raw_import_items
            await supabase
              .from('raw_import_items')
              .insert({
                import_run_id: runId,
                raw_data: row,
                mapped_data: {},
                line_number: lineNumber,
                error: rowError instanceof Error ? rowError.message : 'Unknown error',
              });
          }
        }

        // Update progress every batch
        await supabase
          .from('import_runs')
          .update({
            summary: { added, duplicates, errors },
          })
          .eq('id', runId);
      }

      // Final update
      const finalStatus = errors > 0 ? (added > 0 ? 'partial' : 'failed') : 'success';
      
      await supabase
        .from('import_runs')
        .update({
          status: finalStatus,
          finished_at: new Date().toISOString(),
          summary: { added, duplicates, errors },
          error: errorDetails.length > 0 ? JSON.stringify(errorDetails.slice(0, 10)) : null,
        })
        .eq('id', runId);

             // Clean up temp file
       await supabase.storage
         .from('imports')
         .remove([`temp/${user.id}/${uploadToken}`]);

       await supabase
         .from('temp_uploads')
         .delete()
         .eq('token', uploadToken);

       // Run matching engine to create trades
       try {
         const matchResult = await matchUserTrades({ 
           userId: user.id, 
           sinceImportRunId: runId 
         });
         
         console.log(`Matching engine result: ${matchResult.createdTrades} created, ${matchResult.updatedTrades} updated`);
       } catch (matchError) {
         console.error('Error in matching engine:', matchError);
         // Don't fail the import if matching fails
       }

       // Track usage for Pro feature
       try {
         await emitUsageEvent(user.id, 'csv_import', {
           import_run_id: runId,
           row_count: added + duplicates + errors,
           successful_rows: added,
           file_type: tempUpload.file_type,
           timestamp: new Date().toISOString()
         });
       } catch (usageError) {
         console.error('Failed to track usage:', usageError);
         // Don't fail the import if usage tracking fails
       }

       return NextResponse.json({
         runId,
         summary: { added, duplicates, errors },
         errorDetails: errorDetails.slice(0, 10),
       });

    } catch (error) {
      // Update run status to failed
      await supabase
        .from('import_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', runId);

      throw error;
    }

  } catch (error) {
    console.error('CSV commit error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
