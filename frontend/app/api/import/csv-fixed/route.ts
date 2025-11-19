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
    
    const rawHeaders = sampleRecords.length > 0 ? Object.keys(sampleRecords[0]) : [];
    const headers = rawHeaders.map(h => String(h || '').replace(/^["']|["']$/g, '').trim());
    const sampleRows = sampleRecords.slice(0, 200);
    
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
          // Convert NormalizedFill to trade data
          const tradeData = {
            user_id: user.id,
            row_hash: computeRowHashFromFill(fill, user.id, detection?.brokerId || 'csv'),
            broker: detection?.brokerId || 'csv',
            broker_trade_id: fill.tradeIdExternal || fill.orderId,
            import_run_id: importRun.id,
            symbol: fill.symbol,
            side: fill.side || (fill.quantity >= 0 ? 'BUY' : 'SELL'),
            quantity: Math.abs(fill.quantity),
            entry_price: fill.price,
            exit_price: null,
            entry_date: fill.execTime,
            exit_date: null,
            status: 'closed',
            notes: fill.notes || null,
            asset_type: fill.assetClass === 'options' ? 'OPTION' : fill.assetClass === 'crypto' ? 'CRYPTO' : 'EQUITY',
            underlying_symbol: fill.underlying || null,
            option_expiration: fill.expiry || null,
            option_strike: fill.strike || null,
            option_type: fill.right === 'C' ? 'CALL' : fill.right === 'P' ? 'PUT' : null
          };
          
          // Check for existing row
          const { data: existing } = await supabase
            .from('trades')
            .select('id')
            .eq('user_id', user.id)
            .eq('row_hash', tradeData.row_hash)
            .single();
          
          if (existing && requestData.options?.skipDuplicates) {
            skippedCount++;
          } else {
            if (existing) {
              const { error: updateError } = await supabase
                .from('trades')
                .update(tradeData)
                .eq('id', existing.id);
              
              if (updateError) {
                throw new Error(`Update failed: ${updateError.message}`);
              }
            } else {
              const { error: insertError } = await supabase
                .from('trades')
                .insert(tradeData)
                .select();
              
              if (insertError) {
                console.error(`[Import] Insert error for trade ${tradeData.symbol}:`, insertError);
                throw new Error(`Insert failed: ${insertError.message}`);
              }
            }
            insertedCount++;
            
            if (insertedCount % 50 === 0) {
              console.log(`[Import] Progress: ${insertedCount} trades inserted so far...`);
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
