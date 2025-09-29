import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseWebullCsvHeaders, processWebullCsv } from '@/lib/imports/webull';
import { logImportStart, logImportSummary, logImportErrors, logImportError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const fileId = `test-${Date.now()}`;
  let userId = '';
  
  try {
    console.log('=== WEBULL IMPORT SIMPLE TEST START ===');
    
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
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    userId = user.id;
    console.log('User authenticated:', user.id);
    
    // Log import start
    logImportStart(fileId, userId, file.name);
    
    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log('CSV parsed, lines:', lines.length);
    console.log('Headers:', headers);
    
    // Create field mapping
    const fieldMap = parseWebullCsvHeaders(headers);
    console.log('Field map:', fieldMap);
    
    // Process entire CSV with comprehensive filtering and telemetry
    const { trades, summary, skippedRows } = processWebullCsv(csvText, fieldMap);
    
    console.log('Processing complete:', summary);
    console.log('Total trades found:', trades.length);
    console.log('Total skipped rows:', skippedRows.length);
    
    // Log import summary
    logImportSummary(fileId, userId, {
      totalRows: summary.totalRows,
      parsedRows: summary.parsedRows,
      filledRows: summary.filledRows,
      importedRows: summary.importedRows,
      skipped: summary.skipped
    });
    
    // Log errors if any
    if (summary.errors.length > 0) {
      logImportErrors(fileId, userId, summary.errors);
    }
    
    // Prepare comprehensive profiling data for frontend modal
    const profilingSummary = {
      totalRows: summary.totalRows,
      headerRows: summary.headerRows,
      parsedRows: summary.parsedRows,
      filledRows: summary.filledRows,
      importedRows: summary.importedRows,
      skipped: {
        cancelled: summary.skipped.cancelled,
        zeroQty: summary.skipped.zeroQty,
        zeroPrice: summary.skipped.zeroPrice,
        badDate: summary.skipped.badDate,
        parseError: summary.skipped.parseError
      }
    };
    
    // Get first 10 importable trades for preview
    const importableTradesPreview = trades.slice(0, 10).map(trade => ({
      externalId: trade.externalId,
      broker: trade.broker,
      symbolRaw: trade.symbolRaw,
      symbol: trade.symbol,
      assetType: trade.assetType,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      fees: trade.fees,
      commission: trade.commission,
      status: trade.status,
      executedAt: trade.executedAt,
      meta: {
        rowIndex: trade.meta.rowIndex,
        source: trade.meta.source
      }
    }));
    
    // Get first 10 skipped rows with reasons
    const skippedRowsPreview = skippedRows.slice(0, 10).map(skipped => ({
      rowIndex: skipped.rowIndex,
      reason: skipped.reason,
      symbolRaw: skipped.symbolRaw,
      status: skipped.status,
      filled: skipped.filled,
      price: skipped.price
    }));
    
            return NextResponse.json({
              success: true,
              profiling: profilingSummary,
              importableTradesPreview: importableTradesPreview,
              skippedRowsPreview: skippedRowsPreview,
              errors: summary.errors,
              errorSummary: summary.errorSummary,
              message: `Processed ${summary.totalRows} rows: ${summary.importedRows} importable, ${Object.values(summary.skipped).reduce((a, b) => a + b, 0)} skipped`
            });

  } catch (error: any) {
    console.error('Webull import simple test error:', error);
    
    // Log import error
    if (userId) {
      logImportError(fileId, userId, error, 'test-webull-import-simple');
    }
    
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
