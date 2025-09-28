import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBULL CSV IMPORT START ===');
    
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
          source: 'webull',
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
        details: e.message 
      }, { status: 500 });
    }
    
    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log('CSV parsed, lines:', lines.length);
    console.log('Headers:', headers);
    
    // Parse and insert trades
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log('Starting to process', lines.length - 1, 'rows');
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Webull-specific parsing
        const symbol = row['Symbol'] || '';
        const side = (row['Side'] || '').toLowerCase();
        const status = row['Status'] || '';
        
        // Use the "Filled" column for quantity (how many contracts were actually filled)
        const filledStr = row['Filled'] || '0';
        const quantity = parseFloat(filledStr);
        
        // Handle Webull's price format with @ symbol
        const priceStr = row['Price'] || '0';
        const cleanPriceStr = priceStr.replace('@', '').trim();
        const price = parseFloat(cleanPriceStr);
        
        // Use filled time if available, otherwise placed time
        const dateStr = row['Filled Time'] || row['Placed Time'] || '';
        const date = dateStr.split(' ')[0]; // Extract just the date part (MM/DD/YYYY)
        
        // Check if trade is filled
        const isFilled = status.toLowerCase() === 'filled';
        
        console.log(`Row ${i}: symbol=${symbol}, side=${side}, quantity=${quantity}, price=${price}, date=${date}, status=${status}, filled=${isFilled}`);
        
        if (symbol && side && quantity > 0 && price > 0 && isFilled) {
          console.log(`Valid trade found: ${symbol} ${side} ${quantity} @ ${price}`);
          
          // Calculate P&L (simplified for options)
          const pnl = 0; // Options P&L calculation is complex, set to 0 for now
          
          const tradeData = {
            user_id: user.id,
            symbol: symbol.toUpperCase(),
            side: side === 'buy' ? 'buy' : 'sell',
            quantity,
            entry_price: price,
            exit_price: side === 'sell' ? price : null,
            entry_date: date,
            exit_date: side === 'sell' ? date : null,
            status: side === 'sell' ? 'closed' : 'open',
            pnl: pnl,
            broker: 'webull',
            import_run_id: importRun.id,
            row_hash: `${user.id}_${symbol}_${side}_${quantity}_${price}_${date}`
          };
          
          console.log('Inserting trade:', tradeData);
          
          const { data: insertData, error: insertError } = await supabase
            .from('trades')
            .insert(tradeData)
            .select();
          
          if (insertError) {
            console.error('Error inserting trade:', insertError);
            errorCount++;
          } else {
            console.log('Trade inserted successfully:', insertData);
            insertedCount++;
          }
        } else {
          const skipReason = !symbol ? 'no symbol' : 
                           !side ? 'no side' : 
                           quantity <= 0 ? 'invalid quantity' : 
                           price <= 0 ? 'invalid price' : 
                           !isFilled ? 'not filled' : 'unknown';
          console.log(`Skipped row ${i}: ${skipReason} - symbol=${symbol}, side=${side}, quantity=${quantity}, price=${price}, status=${status}`);
          skippedCount++;
        }
      } catch (error) {
        console.error('Error processing row:', error);
        errorCount++;
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
      totalRows: lines.length - 1,
      inserted: insertedCount,
      skipped: skippedCount,
      errors: errorCount
    });
    
    return NextResponse.json({
      success: true,
      importRunId: importRun.id,
      message: 'Webull CSV import completed successfully',
      stats: {
        totalRows: lines.length - 1,
        inserted: insertedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    });

  } catch (error: any) {
    console.error('Webull CSV Import error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  }
}
