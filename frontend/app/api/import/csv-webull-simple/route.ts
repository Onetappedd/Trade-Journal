import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBULL CSV SIMPLE START ===');
    
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
    
    console.log('User authenticated:', user.id);
    
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
    console.log('Headers found:', headers);
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Log first few rows for debugging
        if (i <= 3) {
          console.log(`Row ${i} raw data:`, row);
        }
        
        // Webull-specific parsing
        const symbol = row['Symbol'] || '';
        const side = (row['Side'] || '').toLowerCase();
        const status = row['Status'] || '';
        
        // Use the "Filled" column for quantity
        const filledStr = row['Filled'] || '0';
        const quantity = parseFloat(filledStr);
        
        // Handle Webull's price format with @ symbol
        const priceStr = row['Price'] || '0';
        const cleanPriceStr = priceStr.replace('@', '').trim();
        const price = parseFloat(cleanPriceStr);
        
        // Use filled time if available, otherwise placed time
        const dateStr = row['Filled Time'] || row['Placed Time'] || '';
        const date = dateStr.split(' ')[0]; // Extract just the date part
        
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
    
    console.log('Import completed successfully');
    console.log('Final stats:', {
      totalRows: lines.length - 1,
      inserted: insertedCount,
      skipped: skippedCount,
      errors: errorCount
    });
    
    // Log summary of what was processed
    console.log(`Processed ${lines.length - 1} total rows`);
    console.log(`Found ${insertedCount} valid trades to import`);
    console.log(`Skipped ${skippedCount} rows`);
    console.log(`Encountered ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: 'Webull CSV import completed successfully',
      stats: {
        totalRows: lines.length - 1,
        inserted: insertedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    });

  } catch (error: any) {
    console.error('Webull CSV Simple error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  }
}
