import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBULL CSV TEST START ===');
    
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
    
    // Process first 5 rows to show detailed parsing
    const parsingResults = [];
    let validTrades = 0;
    let skippedTrades = 0;
    
    for (let i = 1; i < Math.min(6, lines.length); i++) {
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
        
        const isValid = symbol && side && quantity > 0 && price > 0 && isFilled;
        
        if (isValid) {
          validTrades++;
        } else {
          skippedTrades++;
        }
        
        parsingResults.push({
          row: i,
          symbol,
          side,
          quantity,
          price,
          date,
          status,
          isFilled,
          isValid,
          rawData: row
        });
        
        console.log(`Row ${i}: symbol=${symbol}, side=${side}, quantity=${quantity}, price=${price}, date=${date}, status=${status}, filled=${isFilled}, valid=${isValid}`);
        
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        parsingResults.push({
          row: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          rawData: {}
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        totalLines: lines.length,
        headers: headers,
        parsingResults: parsingResults,
        summary: {
          validTrades,
          skippedTrades,
          totalProcessed: parsingResults.length
        }
      }
    });

  } catch (error: any) {
    console.error('Webull CSV Test error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
