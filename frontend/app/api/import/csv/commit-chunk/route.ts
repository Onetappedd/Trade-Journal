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
  jobId: z.string(), // Accept any string (upload token)
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
        // Include rows from offset onwards (0-based indexing)
        if (currentRow >= offset) {
          rows.push(record);
        }
        currentRow++;
      }
    });

    parser.on('error', reject);
    parser.on('end', () => {
      console.log(`[CSV Parse] Parsed ${currentRow} total rows, returning ${rows.length} rows from offset ${offset} with limit ${limit}`);
      console.log(`[CSV Parse] Row range: ${offset} to ${offset + limit - 1}, actual rows: ${currentRow}`);
      
      // If we're at the end of the file and offset is beyond available rows, return empty
      if (offset >= currentRow) {
        console.log(`[CSV Parse] Offset ${offset} is beyond available rows (${currentRow}), returning empty array`);
        resolve([]);
        return;
      }
      
      resolve(rows);
    });
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

    // Get import run details - jobId is the upload token, so we need to find the import run
    // by looking for the most recent import run for this user
    const { data: importRun, error: runError } = await supabase
      .from('import_runs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (runError || !importRun) {
      return NextResponse.json({ error: 'No active import run found' }, { status: 400 });
    }

    if (importRun.status !== 'processing') {
      return NextResponse.json({ error: 'Import run is not in processing state' }, { status: 400 });
    }

    // Try to get progress from import_job_progress if available
    let processedRows = 0;
    try {
      const { data: progress } = await supabase
        .from('import_job_progress')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .single();
      
      processedRows = progress?.processed_rows || 0;
    } catch (error) {
      // Progress table might not exist, use 0 as default
      processedRows = 0;
    }

    // Check if chunk is already processed
    if (offset < processedRows) {
      return NextResponse.json({
        processedRows: processedRows,
        added: 0,
        duplicates: 0,
        errors: 0,
        message: 'Chunk already processed'
      });
    }

    // Download file from storage - jobId is now the upload token
    const filePath = `temp/${user.id}/${jobId}`;
    console.log(`[Commit Chunk] Attempting to download file from path: ${filePath}`);
    console.log(`[Commit Chunk] User ID: ${user.id}, Upload Token: ${jobId}`);
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('imports')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error(`[Commit Chunk] Download failed:`, {
        filePath,
        userId: user.id,
        uploadToken: jobId,
        error: downloadError?.message || 'No file data'
      });
      return NextResponse.json({ error: 'Failed to download file', details: downloadError?.message || 'No file data' }, { status: 500 });
    }
    
    console.log(`[Commit Chunk] File downloaded successfully, size: ${fileData.size} bytes`);

    const buffer = Buffer.from(await fileData.arrayBuffer());
    
    // Get file type from temp_uploads
    const { data: tempUpload } = await supabase
      .from('temp_uploads')
      .select('file_type')
      .eq('token', jobId)
      .eq('user_id', user.id)
      .single();

    const fileType = tempUpload?.file_type || 'csv';

    // Parse chunk based on file type
    let chunkRows: any[];
    switch (fileType) {
      case 'csv':
      case 'tsv':
        const delimiter = fileType === 'tsv' ? '\t' : ',';
        console.log(`[Commit Chunk] Parsing CSV with offset: ${offset}, limit: ${limit}, delimiter: ${delimiter}`);
        chunkRows = await parseCsvChunk(buffer, offset, limit, delimiter);
        console.log(`[Commit Chunk] CSV parsing result: ${chunkRows.length} rows`);
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
      console.log(`[Commit Chunk] No rows in chunk - offset: ${offset}, limit: ${limit}, file size: ${buffer.length} bytes`);
      console.log(`[Commit Chunk] This suggests the offset ${offset} is beyond the available data rows`);
      
      // If this is the first chunk and we get no rows, something is wrong
      if (offset === 0) {
        return NextResponse.json({ error: 'Failed to parse any rows from file' }, { status: 500 });
      }
      
      // If this is a later chunk with no rows, we're done
      return NextResponse.json({
        processedRows: offset,
        added: 0,
        duplicates: 0,
        errors: 0,
        message: 'No more rows to process - import complete'
      });
    }

    // Process chunk
    let added = 0;
    let duplicates = 0;
    let errors = 0;
    const errorDetails: any[] = [];
    
              // Get the mapping from the import run summary
          const mapping: Record<string, string> = importRun.summary?.mapping || {};
          
          console.log(`[Commit Chunk] Using mapping:`, mapping);
          console.log(`[Commit Chunk] First row sample:`, chunkRows[0]);
          
          // Process each row individually
          for (let i = 0; i < chunkRows.length; i++) {
               const row: Record<string, any> = chunkRows[i];
               const lineNumber = offset + i + 1; // +1 for 1-based line numbers

              try {
                // Map row to canonical fields using the user's mapping
                const mappedData: any = {};
                
                // Apply the user's field mapping
                for (const [canonicalField, csvHeader] of Object.entries(mapping)) {
                  if (csvHeader && row[csvHeader] !== undefined) {
                    mappedData[canonicalField] = row[csvHeader];
                  }
                }
                
                console.log(`[Commit Chunk] Row ${lineNumber} mapped data:`, mappedData);
          
          // Handle special cases for Webull options
          if (mapping.symbol === 'Name' && row.Name) {
            // Parse Webull options format: QQQ250822P00563000
            // Format: SYMBOL + YYMMDD + OPTION_TYPE + STRIKE
            const nameStr = row.Name.toString();
            
            // Extract underlying symbol (everything before the numbers)
            const symbolMatch = nameStr.match(/^([A-Z]+)/);
            if (symbolMatch) {
              const underlying = symbolMatch[1];
              
              // Extract expiry (YYMMDD format)
              const expiryMatch = nameStr.match(/(\d{6})/);
              if (expiryMatch) {
                const expiryStr = expiryMatch[1];
                const year = '20' + expiryStr.substring(0, 2);
                const month = expiryStr.substring(2, 4);
                const day = expiryStr.substring(4, 6);
                
                // Convert to YYYY-MM-DD format
                const expiry = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                
                // Extract option type (C or P) - look for it after the date
                const optionTypeMatch = nameStr.match(/([CP])(\d+)/);
                if (optionTypeMatch) {
                  const optionType = optionTypeMatch[1];
                  const strikeStr = optionTypeMatch[2];
                  
                  // Convert strike from integer format (e.g., 00563000 -> 56.30)
                  const strike = (parseInt(strikeStr) / 1000).toString();
                  
                  mappedData.underlying = underlying;
                  mappedData.expiry = expiry;
                  mappedData.instrument_type = 'option';
                  mappedData.multiplier = '100';
                  mappedData.strike = strike;
                  mappedData.option_type = optionType === 'C' ? 'call' : 'put';
                  
                  console.log(`[Webull Options] Parsed ${nameStr} -> Underlying: ${underlying}, Expiry: ${expiry}, Type: ${optionType}, Strike: ${strike}`);
                } else {
                  // Fallback if we can't parse the full format
                  mappedData.underlying = underlying;
                  mappedData.expiry = expiry;
                  mappedData.instrument_type = 'option';
                  mappedData.multiplier = '100';
                  mappedData.strike = '0';
                  mappedData.option_type = 'call';
                  
                  console.log(`[Webull Options] Parsed ${nameStr} -> Underlying: ${underlying}, Expiry: ${expiry} (fallback mode)`);
                }
              }
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
                         timestamp: parseTimestamp(mappedData.timestamp, undefined),
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
                                 source_import_run_id: importRun.id,
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

    // Update job progress
    const newProcessedRows = Math.min(offset + chunkRows.length, importRun.summary?.total || 0);
    
    // Try to update import_job_progress if it exists
    try {
      await supabase
        .from('import_job_progress')
        .update({ processed_rows: newProcessedRows })
        .eq('job_id', jobId);
    } catch (error) {
      // Progress table might not exist, continue anyway
      console.log('Could not update progress table:', error);
    }

    // Update import run summary
    await supabase
      .from('import_runs')
      .update({
        summary: {
          total: importRun.summary?.total || 0,
          added: (importRun.summary?.added || 0) + added,
          duplicates: (importRun.summary?.duplicates || 0) + duplicates,
          errors: (importRun.summary?.errors || 0) + errors,
        }
      })
      .eq('id', importRun.id);

    // Fail-safe: If all trades in this chunk failed, return an error
    if (errors === chunkRows.length && added === 0) {
      console.error(`[Commit Chunk] All ${chunkRows.length} trades failed validation. Import cannot proceed.`);
      return NextResponse.json({
        processedRows: newProcessedRows,
        added: 0,
        duplicates: 0,
        errors: errors,
        message: `All ${chunkRows.length} trades failed validation. Import cannot proceed.`,
        errorDetails: errorDetails
      }, { status: 400 });
    }

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
