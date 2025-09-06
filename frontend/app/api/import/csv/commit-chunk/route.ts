import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { resolveInstrument } from '@/lib/instruments/resolve';
import { applyBrokerAdapter } from '@/lib/import/adapters';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schema
const CommitChunkSchema = z.object({
  jobId: z.string(), // Accept any string (upload token)
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(5000), // Max 5000 rows per chunk
  startAtRow: z.number().int().min(0).optional(), // Resume from specific row index
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

// Generate errors CSV and upload to storage
async function generateErrorsCsv(errorDetails: any[], userId: string, runId: string): Promise<string | null> {
  try {
    if (errorDetails.length === 0) {
      return null;
    }

    // Create CSV content
    const csvHeaders = ['Line Number', 'Reason', 'Symbol', 'Timestamp', 'Side', 'Quantity', 'Price', 'Raw Data'];
    const csvRows = [csvHeaders];
    
    for (const error of errorDetails) {
      csvRows.push([
        error.lineNumber.toString(),
        error.reason,
        error.symbol,
        error.timestamp,
        error.side,
        error.quantity,
        error.price,
        error.raw
      ]);
    }

    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Upload to storage
    const supabase = getServerSupabase();
    const fileName = `errors/${runId}.csv`;
    const filePath = `temp-uploads/${userId}/${fileName}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('imports')
      .upload(filePath, csvContent, {
        contentType: 'text/csv',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload errors CSV:', uploadError);
      return null;
    }

    // Generate signed URL for download
    const { data: signedUrl } = await supabase.storage
      .from('imports')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    return signedUrl?.signedUrl || null;
  } catch (error) {
    console.error('Failed to generate errors CSV:', error);
    return null;
  }
}

// Parse CSV chunk with resume support
async function parseCsvChunk(buffer: Buffer, offset: number, limit: number, delimiter: string = ',', startAtRow?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter,
      columns: false, // Don't auto-convert to objects, we'll handle headers manually
      skip_empty_lines: true,
      max_record_size: 1024 * 1024,
    });

    const rows: any[] = [];
    let currentRow = 0;
    let headers: string[] = [];
    let isFirstRow = true;
    const effectiveOffset = startAtRow !== undefined ? startAtRow : offset;
    
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) && rows.length < limit) {
        if (isFirstRow) {
          // First row contains headers
          headers = record;
          isFirstRow = false;
          console.log(`[CSV Parse] Headers:`, headers);
          
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
          console.log(`[CSV Parse] Processed headers (duplicates handled):`, headers);
          return;
        }
        
        // Convert array to object using processed headers
        const rowObj: Record<string, any> = {};
        for (let i = 0; i < headers.length && i < record.length; i++) {
          rowObj[headers[i]] = record[i];
        }
        
        // Include rows from effective offset onwards (0-based indexing)
        if (currentRow >= effectiveOffset) {
          rows.push(rowObj);
        }
        currentRow++;
      }
    });

    parser.on('error', reject);
    parser.on('end', () => {
      console.log(`[CSV Parse] Parsed ${currentRow} total rows, returning ${rows.length} rows from effective offset ${effectiveOffset} with limit ${limit}`);
      console.log(`[CSV Parse] Row range: ${effectiveOffset} to ${effectiveOffset + limit - 1}, actual rows: ${currentRow}`);
      
      // If we're at the end of the file and effective offset is beyond available rows, return empty
      if (effectiveOffset >= currentRow) {
        console.log(`[CSV Parse] Effective offset ${effectiveOffset} is beyond available rows (${currentRow}), returning empty array`);
        resolve([]);
        return;
      }
      
      resolve(rows);
    });
    parser.write(buffer);
    parser.end();
  });
}

// Parse Excel chunk with resume support
function parseExcelChunk(buffer: Buffer, offset: number, limit: number, startAtRow?: number): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length <= 1) {
    return [];
  }

  const headers = jsonData[0] as string[];
  const effectiveStartRow = startAtRow !== undefined ? startAtRow + 1 : offset + 1; // Skip header
  const endRow = Math.min(effectiveStartRow + limit, jsonData.length);
  
  return jsonData.slice(effectiveStartRow, endRow).map((row: any) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// Parse IBKR Flex XML chunk with resume support
function parseFlexXmlChunk(buffer: Buffer, offset: number, limit: number, startAtRow?: number): any[] {
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
    
    const effectiveStartIndex = startAtRow !== undefined ? startAtRow : offset;
    const endIndex = Math.min(effectiveStartIndex + limit, tradeArray.length);
    
    tradeArray.slice(effectiveStartIndex, endIndex).forEach((trade: any) => {
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

    const { jobId, offset, limit, startAtRow } = validation.data;

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
        console.log(`[Commit Chunk] Parsing CSV with offset: ${offset}, limit: ${limit}, startAtRow: ${startAtRow}, delimiter: ${delimiter}`);
        chunkRows = await parseCsvChunk(buffer, offset, limit, delimiter, startAtRow);
        console.log(`[Commit Chunk] CSV parsing result: ${chunkRows.length} rows`);
        
        // Log first few rows to debug column alignment
        if (chunkRows.length > 0) {
          console.log(`[Commit Chunk] First row sample:`, chunkRows[0]);
          console.log(`[Commit Chunk] First row keys:`, Object.keys(chunkRows[0]));
          if (chunkRows.length > 1) {
            console.log(`[Commit Chunk] Second row sample:`, chunkRows[1]);
          }
        }
        break;
      case 'xlsx':
      case 'xls':
        chunkRows = parseExcelChunk(buffer, offset, limit, startAtRow);
        break;
      case 'xml':
        chunkRows = parseFlexXmlChunk(buffer, offset, limit, startAtRow);
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

    // Process chunk with vectorized upserts
    let added = 0;
    let duplicates = 0;
    let errors = 0;
    const errorDetails: any[] = [];
    
    // Get the mapping from the import run summary
    const mapping: Record<string, string> = importRun.summary?.mapping || {};
    
    console.log(`[Commit Chunk] Using mapping:`, mapping);
    console.log(`[Commit Chunk] Mapping has broker field:`, !!mapping.broker);
    console.log(`[Commit Chunk] Broker value:`, mapping.broker);
    console.log(`[Commit Chunk] First row sample:`, chunkRows[0]);
    
    // Prepare normalized rows for bulk upsert
    const normalizedRows: any[] = [];
    
    for (let i = 0; i < chunkRows.length; i++) {
      const row: Record<string, any> = chunkRows[i];
      const lineNumber = offset + i + 1; // +1 for 1-based line numbers

      try {
        // Map row to canonical fields using the user's mapping
        const mappedData: any = {};
        
        // Apply the user's field mapping with case-insensitive lookup
        for (const [canonicalField, csvHeader] of Object.entries(mapping)) {
          if (csvHeader) {
            // Try exact match first
            if (row[csvHeader] !== undefined) {
              mappedData[canonicalField] = row[csvHeader];
            } else {
              // Try case-insensitive match
              const csvHeaders = Object.keys(row);
              const matchingHeaders = csvHeaders.filter(header => 
                header.toLowerCase() === csvHeader.toLowerCase()
              );
              
              if (matchingHeaders.length > 0) {
                // If multiple matches (e.g., "Filled Time" and "Filled Time_2"), prefer the first non-empty one
                let selectedValue = null;
                for (const header of matchingHeaders) {
                  const value = row[header];
                  if (value !== undefined && value !== null && value !== '') {
                    selectedValue = value;
                    break; // Use the first non-empty value
                  }
                }
                if (selectedValue !== null) {
                  mappedData[canonicalField] = selectedValue;
                }
              }
            }
          }
        }
        
        console.log(`[Commit Chunk] Row ${lineNumber} mapped data:`, mappedData);
        
        // Apply broker-specific adapter if mapping.broker is specified
        if (mapping.broker) {
          console.log(`[Commit Chunk] Applying ${mapping.broker} adapter for row ${lineNumber}`);
          try {
            const adaptedData = applyBrokerAdapter(row, mapping);
            // Merge adapted data with mapped data (adapted data takes precedence)
            Object.assign(mappedData, adaptedData);
            console.log(`[Commit Chunk] Applied ${mapping.broker} adapter for row ${lineNumber}:`, adaptedData);
          } catch (adapterError) {
            console.warn(`[Commit Chunk] Adapter failed for row ${lineNumber}:`, adapterError);
            // Continue with original mapped data if adapter fails
          }
        } else {
          console.log(`[Commit Chunk] No broker specified in mapping for row ${lineNumber}`);
        }

        // Validate required fields
        const requiredFields: CanonicalField[] = ['timestamp', 'symbol', 'side', 'quantity', 'price'];
        for (const field of requiredFields) {
          if (!mappedData[field]) {
            console.error(`[Commit Chunk] Row ${lineNumber} missing required field: ${field}`);
            console.error(`[Commit Chunk] Row ${lineNumber} mappedData:`, mappedData);
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

        // Prepare row for bulk upsert
        // Note: dedupe_hash is required by schema, unique_hash will be computed by trigger
        normalizedRows.push({
          user_id: user.id,
          import_run_id: importRun.id, // Use import_run_id as per schema
          dedupe_hash: generateUniqueHash(normalizedData), // Generate dedupe_hash for schema compatibility
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

      } catch (rowError) {
        errors++;
        console.error(`[Commit Chunk] Row ${lineNumber} validation error:`, rowError);
        console.error(`[Commit Chunk] Row ${lineNumber} raw data:`, row);
        console.error(`[Commit Chunk] Row ${lineNumber} mapping:`, mapping);
        errorDetails.push({
          lineNumber: lineNumber,
          reason: rowError instanceof Error ? rowError.message : 'Unknown error',
          raw: JSON.stringify(row),
          symbol: row[mapping.symbol] || 'N/A',
          timestamp: row[mapping.timestamp] || 'N/A',
          side: row[mapping.side] || 'N/A',
          quantity: row[mapping.quantity] || 'N/A',
          price: row[mapping.price] || 'N/A'
        });
      }
    }

    // Fail-safe: If all trades in this chunk failed validation, return an error
    if (errors === chunkRows.length && normalizedRows.length === 0) {
      console.error(`[Commit Chunk] All ${chunkRows.length} trades failed validation. Import cannot proceed.`);
      return NextResponse.json({
        processedRows: offset,
        added: 0,
        duplicates: 0,
        errors: errors,
        message: `All ${chunkRows.length} trades failed validation. Import cannot proceed.`,
        errorDetails: errorDetails
      }, { status: 400 });
    }

    // Bulk upsert normalized rows using vectorized operations
    if (normalizedRows.length > 0) {
      const BATCH_SIZE = Number(process.env.IMPORT_CHUNK_SIZE_DEFAULT ?? 1000);
      
      for (let i = 0; i < normalizedRows.length; i += BATCH_SIZE) {
        const batch = normalizedRows.slice(i, i + BATCH_SIZE);
        
        console.log(`[Commit Chunk] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(normalizedRows.length / BATCH_SIZE)}, size: ${batch.length}`);

        // Insert batch and let database handle conflicts naturally
        const { data, error } = await supabase
          .from('executions_normalized')
          .insert(batch)
          .select('id'); // force returning to measure inserts count

        if (error) {
          console.error(`[Commit Chunk] Batch insert failed:`, error);
          
          // Check if this is a unique constraint violation (duplicates)
          if (error.code === '23505') { // PostgreSQL unique constraint violation
            console.log(`[Commit Chunk] Batch had duplicate conflicts, treating as duplicates`);
            duplicates += batch.length;
          } else {
            // Other errors - accumulate as failures
            errors += batch.length;
          }
          continue;
        }

        // All rows in batch were inserted successfully
        const insertedCount = data?.length ?? 0;
        added += insertedCount;
        
        console.log(`[Commit Chunk] Batch result: ${insertedCount} inserted successfully`);
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

    // Update resume information for this import run
    const lastProcessedRowIndex = offset + chunkRows.length - 1;
    const processedBytes = Math.floor((lastProcessedRowIndex / (importRun.summary?.total || 1)) * fileData.size);
    
    await supabase
      .from('import_runs')
      .update({
        last_row_index: lastProcessedRowIndex,
        processed_bytes: processedBytes,
        total_bytes: fileData.size,
        updated_at: new Date().toISOString()
      })
      .eq('id', importRun.id);

    // Generate errors CSV if there are errors
    let errorsCsvUrl: string | null = null;
    if (errorDetails.length > 0) {
      errorsCsvUrl = await generateErrorsCsv(errorDetails, user.id, importRun.id);
      
      // Update import run summary to include errors CSV URL
      if (errorsCsvUrl) {
        await supabase
          .from('import_runs')
          .update({
            summary: {
              total: importRun.summary?.total || 0,
              added: (importRun.summary?.added || 0) + added,
              duplicates: (importRun.summary?.duplicates || 0) + duplicates,
              errors: (importRun.summary?.errors || 0) + errors,
              errorsCsvUrl: errorsCsvUrl,
              errorCount: errorDetails.length
            }
          })
          .eq('id', importRun.id);
      }
    }

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
      message: `Processed ${chunkRows.length} rows`,
      errorsCsvUrl: errorsCsvUrl,
      errorCount: errorDetails.length
    });

  } catch (error) {
    console.error('Commit chunk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
