import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG CSV PARSING START ===');
    
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
    
    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    console.log('CSV parsed, lines:', lines.length);
    console.log('Headers:', headers);
    
    // Show first few rows for debugging
    const sampleRows = [];
    for (let i = 1; i < Math.min(4, lines.length); i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      sampleRows.push(row);
    }
    
    console.log('Sample rows:', sampleRows);
    
    // Try to identify the correct columns
    const possibleSymbolColumns = headers.filter(h => 
      h.includes('symbol') || h.includes('ticker') || h.includes('instrument') || h.includes('stock')
    );
    const possibleSideColumns = headers.filter(h => 
      h.includes('side') || h.includes('action') || h.includes('type') || h.includes('direction')
    );
    const possibleQuantityColumns = headers.filter(h => 
      h.includes('quantity') || h.includes('shares') || h.includes('size') || h.includes('qty')
    );
    const possiblePriceColumns = headers.filter(h => 
      h.includes('price') || h.includes('amount') || h.includes('value')
    );
    const possibleDateColumns = headers.filter(h => 
      h.includes('date') || h.includes('time') || h.includes('timestamp')
    );
    
    return NextResponse.json({
      success: true,
      debug: {
        totalLines: lines.length,
        headers: headers,
        sampleRows: sampleRows,
        possibleColumns: {
          symbol: possibleSymbolColumns,
          side: possibleSideColumns,
          quantity: possibleQuantityColumns,
          price: possiblePriceColumns,
          date: possibleDateColumns
        }
      }
    });

  } catch (error: any) {
    console.error('Debug CSV parsing error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 });
  }
}
