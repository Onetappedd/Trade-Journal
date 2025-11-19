import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { detectAdapter, parseCsvSample } from '@/lib/import/parsing/engine';
import { robinhoodAdapter, webullAdapter, ibkrAdapter, schwabAdapter, fidelityAdapter } from '@/lib/import/parsing/engine';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== CSV DEBUG DETAILED START ===');
    
    // Get the file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('File received:', file.name, file.size);
    
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
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    // Read file content
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const csvContent = fileBuffer.toString('utf-8');
    
    // Use parsing engine to detect and parse
    let detection = null;
    let fills: any[] = [];
    let parseErrors: Array<{ row: number; message: string }> = [];
    
    try {
      // Parse CSV directly from string content (more reliable in server context)
      // Use csv-parse to get headers and sample rows
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        to_line: 201 // Get first 200 rows + header
      });
      
      // Extract headers from first record keys
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      const sampleRows = records.slice(0, 200);
      
      console.log('Parsed headers:', headers);
      console.log('Sample rows count:', sampleRows.length);
      if (sampleRows.length > 0) {
        console.log('First sample row:', sampleRows[0]);
      }
      
      detection = detectAdapter(headers, sampleRows);
      
      if (detection) {
        console.log(`Detected broker: ${detection.brokerId} with confidence ${detection.confidence}`);
        console.log('Header map:', detection.headerMap);
        
        // Get the adapter
        const adapters = [robinhoodAdapter, webullAdapter, ibkrAdapter, schwabAdapter, fidelityAdapter];
        const adapter = adapters.find(a => a.id === detection!.brokerId);
        
        if (adapter) {
          // Parse full CSV
          const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
          });

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
    } catch (detectionError) {
      console.error('Detection/parsing error:', detectionError);
    }
    
    // Build response in expected format
    const importableTradesPreview = fills.slice(0, 10).map((fill, idx) => ({
      externalId: fill.tradeIdExternal || fill.orderId || `trade-${idx}`,
      broker: fill.sourceBroker || 'unknown',
      symbolRaw: fill.raw?.Instrument || fill.raw?.Symbol || fill.symbol || '',
      symbol: fill.symbol || '',
      assetType: fill.assetClass || 'stocks',
      side: fill.side || 'BUY',
      quantity: Math.abs(fill.quantity),
      price: fill.price,
      fees: fill.fees || 0,
      commission: fill.fees || 0,
      status: 'filled',
      executedAt: fill.execTime,
      meta: {
        rowIndex: idx + 1,
        source: 'csv'
      }
    }));
    
    const skippedRowsPreview = parseErrors.slice(0, 10).map(err => ({
      rowIndex: err.row,
      reason: err.message,
      symbolRaw: '',
      status: 'error',
      filled: 'no',
      price: '0'
    }));
    
    return NextResponse.json({
      success: true,
      profiling: {
        totalRows: fills.length + parseErrors.length,
        headerRows: 1,
        parsedRows: fills.length + parseErrors.length,
        filledRows: fills.length,
        importedRows: fills.length,
        skipped: {
          cancelled: 0,
          zeroQty: 0,
          zeroPrice: 0,
          badDate: 0,
          parseError: parseErrors.length
        }
      },
      importableTradesPreview,
      skippedRowsPreview,
      message: `Found ${fills.length} importable trades from ${detection?.brokerId || 'unknown'} broker`,
      debug: {
        detection: detection ? {
          brokerId: detection.brokerId,
          confidence: detection.confidence,
          assetClass: detection.assetClass
        } : null,
        totalFills: fills.length,
        totalErrors: parseErrors.length
      }
    });

  } catch (error: any) {
    console.error('CSV Debug Detailed error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 });
  }
}
