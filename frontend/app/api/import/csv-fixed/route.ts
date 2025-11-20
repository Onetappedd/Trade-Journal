import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parse } from 'csv-parse/sync';
import { detectAdapter, robinhoodAdapter, webullAdapter, ibkrAdapter, schwabAdapter, fidelityAdapter } from '@/lib/import/parsing/engine';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

// Helper to compute row hash for idempotency
function computeRowHashFromFill(fill: any, userId: string, broker: string): string {
  const key = `${userId}|${broker}|${fill.execTime}|${fill.symbol}|${fill.side}|${fill.quantity}|${fill.price}|${fill.underlying || ''}|${fill.expiry || ''}|${fill.strike || ''}|${fill.right || ''}`;
  return createHash('sha256').update(key).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== CSV IMPORT FIXED START ===');
    
    // Get the file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const data = formData.get('data') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('File received:', file.name, file.size);
    
    // Parse the request data
    let requestData;
    try {
      requestData = JSON.parse(data || '{}');
    } catch (e) {
      console.error('Failed to parse request data:', e);
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    console.log('Request data:', requestData);
    
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    console.log('Supabase client created');
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // Test database connection first
    const { data: testData, error: testError } = await supabase
      .from('import_runs')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Database test error:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 });
    }
    
    console.log('Database connection successful');
    
    // Try to create import run with minimal fields first
    let importRun;
    try {
      const { data: importRunData, error: importError } = await supabase
        .from('import_runs')
        .insert({
          user_id: user.id,
          source: 'csv',
          status: 'processing'
        })
        .select()
        .single();
      
      if (importError) {
        console.error('Import run creation error:', importError);
        return NextResponse.json({ 
          error: 'Failed to create import run', 
          details: importError.message 
        }, { status: 500 });
      }
      
      importRun = importRunData;
      console.log('Import run created:', importRun.id);
      
    } catch (e) {
      console.error('Import run creation failed:', e);
      return NextResponse.json({ 
        error: 'Import run creation failed', 
        details: e instanceof Error ? e.message : 'Unknown error' 
      }, { status: 500 });
    }
    
    // Read CSV content
    const csvContent = await file.text();
    
    // Detect delimiter
    const firstLine = csvContent.split('\n')[0] || '';
    const hasTabs = firstLine.includes('\t');
    const delimiter = hasTabs ? '\t' : ',';
    
    console.log('Detected delimiter:', delimiter === '\t' ? 'TAB' : 'COMMA');
    
    // Parse CSV to get headers and sample rows for detection
    const sampleRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: delimiter,
      to_line: 201, // First 200 rows + header
      relax_column_count: true,
      relax_quotes: true
    });
    
    const rawHeaders = sampleRecords.length > 0 ? Object.keys(sampleRecords[0] as Record<string, any>) : [];
    const headers = rawHeaders.map(h => String(h || '').replace(/^["']|["']$/g, '').trim());
    const sampleRows = sampleRecords.slice(0, 200) as any[];
    
    console.log('Parsed headers:', headers);
    console.log('Sample rows:', sampleRows.length);
    
    // Detect broker adapter
    const detection = detectAdapter(headers, sampleRows);
    console.log('Detection result:', detection);
    
    let fills: any[] = [];
    let parseErrors: Array<{ row: number; message: string }> = [];
    
    if (detection) {
      console.log(`Detected broker: ${detection.brokerId} with confidence ${detection.confidence}`);
      
      // Get the adapter
      const adapters = [robinhoodAdapter, webullAdapter, ibkrAdapter, schwabAdapter, fidelityAdapter];
      const adapter = adapters.find(a => a.id === detection.brokerId);
      
      if (adapter) {
        // Parse full CSV
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          delimiter: delimiter,
          relax_column_count: true,
          relax_quotes: true
        });
        
        console.log(`Parsing ${records.length} rows with adapter ${adapter.id}`);
        
        // Parse using adapter
        const parseResult = adapter.parse({
          rows: records,
          headerMap: detection.headerMap,
          userTimezone: 'UTC',
          assetClass: detection.assetClass
        });
        
        fills = parseResult.fills;
        parseErrors = parseResult.errors;
        
        console.log(`Parsed ${fills.length} fills, ${parseErrors.length} errors`);
      }
    }
    
    if (fills.length === 0) {
      console.warn('No fills parsed, returning error');
      return NextResponse.json({
        success: false,
        error: 'No trades could be parsed from CSV. Please check the file format.',
        stats: {
          totalRows: 0,
          inserted: 0,
          skipped: 0,
          errors: parseErrors.length
        }
      }, { status: 400 });
    }
    
    // Insert trades into database
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = parseErrors.length;
    const errorMessages: string[] = parseErrors.map(e => `Row ${e.row}: ${e.message}`);
    
    console.log(`Starting to insert ${fills.length} trades`);
    
    // Process fills in chunks
    const CHUNK_SIZE = 100;
    for (let i = 0; i < fills.length; i += CHUNK_SIZE) {
      const chunk = fills.slice(i, i + CHUNK_SIZE);
      
      for (const fill of chunk) {
        try {
          // Convert side to lowercase (database constraint requires 'buy' or 'sell')
          const sideLower = (fill.side || (fill.quantity >= 0 ? 'BUY' : 'SELL')).toLowerCase();
          const normalizedSide = sideLower === 'buy' ? 'buy' : sideLower === 'sell' ? 'sell' : 'buy';
          
          // Convert asset_type to lowercase (database constraint requires 'equity', 'option', or 'futures')
          let assetType = 'equity'; // default
          if (fill.assetClass === 'options') {
            assetType = 'option';
          } else if (fill.assetClass === 'futures') {
            assetType = 'futures';
          } else if (fill.assetClass === 'crypto') {
            assetType = 'equity'; // crypto not in constraint, treat as equity
          }
          
          // Convert execTime (ISO timestamp) to DATE for entry_date
          const entryDate = fill.execTime ? fill.execTime.split('T')[0] : null;
          
          // Ensure price and quantity are valid numbers
          const price = fill.price && !isNaN(fill.price) ? fill.price : 0;
          const quantity = fill.quantity && !isNaN(fill.quantity) ? Math.abs(fill.quantity) : 0;
          
          if (price <= 0 || quantity <= 0) {
            console.warn(`[Import] Skipping trade with invalid price (${price}) or quantity (${quantity}):`, fill);
            skippedCount++;
            continue;
          }
          
          // Build external_id from fill data
          const externalId = fill.tradeIdExternal || fill.orderId || `${fill.symbol}_${fill.execTime}_${normalizedSide}`;
          
          // Convert NormalizedFill to trade data - using the schema from test_idempotency_functionality.sql
          // Note: We need to set both old schema fields (avg_open_price, qty_opened) and new schema fields (entry_price, quantity)
          // to satisfy any CHECK constraints that might exist
          const tradeData: any = {
            user_id: user.id,
            symbol: fill.symbol,
            symbol_raw: fill.symbol, // Use symbol as symbol_raw if not provided
            side: normalizedSide,
            quantity: Number(quantity), // Ensure it's a number, not a string
            entry_price: Number(price), // Ensure it's a number, not a string
            entry_date: entryDate,
            broker: detection?.brokerId || 'csv',
            external_id: externalId,
            asset_type: assetType,
            fees: Number(fill.fees || 0), // Ensure it's a number
            commission: 0, // Default to 0 if not provided
            executed_at: fill.execTime || new Date().toISOString(),
            row_hash: computeRowHashFromFill(fill, user.id, detection?.brokerId || 'csv'),
            import_run_id: importRun.id,
            // Also set old schema fields to satisfy CHECK constraints
            avg_open_price: Number(price), // Required by CHECK constraint: avg_open_price > 0
            qty_opened: Number(quantity),  // Required by CHECK constraint: qty_opened > 0
            status: 'closed', // Required NOT NULL field - imported trades are closed
            opened_at: fill.execTime || new Date().toISOString(), // Set opened_at for compatibility
            meta: {
              rowIndex: fill.raw?.rowIndex || i + 1,
              source: fill.sourceBroker || 'csv',
              originalDescription: fill.notes || null,
              underlying: fill.underlying || null,
              expiry: fill.expiry || null,
              strike: fill.strike || null,
              optionType: fill.right || null,
            }
          };
          
          // Add option-specific fields if this is an option
          if (assetType === 'option') {
            if (fill.underlying) tradeData.underlying_symbol = fill.underlying;
            if (fill.expiry) tradeData.option_expiration = fill.expiry;
            if (fill.strike) tradeData.option_strike = fill.strike;
            if (fill.right) {
              tradeData.option_type = fill.right === 'C' ? 'CALL' : fill.right === 'P' ? 'PUT' : null;
            }
          }
          
          // Add notes if available
          if (fill.notes) {
            tradeData.notes = fill.notes;
          }
          
          // Check for existing row using row_hash
          const { data: existing, error: checkError } = await supabase
            .from('trades')
            .select('id')
            .eq('user_id', user.id)
            .eq('row_hash', tradeData.row_hash)
            .maybeSingle();
          
          if (checkError) {
            console.error(`[Import] Error checking for existing trade:`, checkError);
            throw new Error(`Check failed: ${checkError.message}`);
          }
          
          if (existing && requestData.options?.skipDuplicates) {
            skippedCount++;
            console.log(`[Import] Skipping duplicate trade: ${tradeData.symbol} (row_hash: ${tradeData.row_hash})`);
          } else {
            if (existing) {
              // Update existing trade
              const { error: updateError } = await supabase
                .from('trades')
                .update(tradeData)
                .eq('id', existing.id);
              
              if (updateError) {
                console.error(`[Import] Update error for trade ${tradeData.symbol}:`, updateError);
                console.error(`[Import] Trade data:`, JSON.stringify(tradeData, null, 2));
                throw new Error(`Update failed: ${updateError.message}`);
              }
              insertedCount++;
            } else {
              // Insert new trade
              const { data: insertedData, error: insertError } = await supabase
                .from('trades')
                .insert(tradeData)
                .select();
              
              if (insertError) {
                console.error(`[Import] Insert error for trade ${tradeData.symbol}:`, insertError);
                console.error(`[Import] Insert error details:`, {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint
                });
                console.error(`[Import] Trade data that failed:`, JSON.stringify(tradeData, null, 2));
                // Don't throw - log and continue to process other trades
                errorCount++;
                errorMessages.push(`Trade ${tradeData.symbol}: ${insertError.message} (code: ${insertError.code})`);
                continue; // Skip this trade and continue with the next one
              }
              
              if (insertedData && insertedData.length > 0) {
                insertedCount++;
                if (insertedCount % 50 === 0) {
                  console.log(`[Import] Progress: ${insertedCount} trades inserted so far...`);
                }
              } else {
                console.warn(`[Import] Insert returned no data for trade ${tradeData.symbol}`);
              }
            }
          }
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errorMessages.push(`Fill ${i + 1}: ${errorMsg}`);
          console.error(`[Import] Error processing fill ${i + 1}:`, errorMsg);
        }
      }
    }
    
    // Update import run with progress (try with minimal fields)
    try {
      await supabase
        .from('import_runs')
        .update({
          status: 'completed',
          result: {
            inserted: insertedCount,
            skipped: skippedCount,
            errors: errorCount
          }
        })
        .eq('id', importRun.id);
    } catch (e) {
      console.error('Failed to update import run:', e);
      // Don't fail the whole import for this
    }
    
    console.log('Import completed successfully');
    console.log('Final stats:', {
      totalRows: fills.length,
      inserted: insertedCount,
      skipped: skippedCount,
      errors: errorCount
    });
    
    return NextResponse.json({
      success: true,
      importRunId: importRun.id,
      message: 'CSV import completed successfully',
      stats: {
        totalRows: fills.length,
        inserted: insertedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    });

  } catch (error: any) {
    console.error('CSV Import Fixed error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  }
}
