/**
 * Script to fill the gap in benchmark data from October 2024 to today
 * This will fetch all missing data between October 1, 2024 and today
 */

require('dotenv').config({ path: '.env.local' });

const YahooFinance = require('yahoo-finance2').default;
const { createClient } = require('@supabase/supabase-js');

const SYMBOLS = ['SPY', 'QQQ'];

async function fillGap() {
  console.log('🔄 Filling benchmark data gap from October 2024 to today...\n');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

  // Fetch from October 1, 2024 to today
  const period1 = new Date('2024-10-01');
  const period2 = new Date();
  
  console.log(`📅 Fetching from ${period1.toISOString().split('T')[0]} to ${period2.toISOString().split('T')[0]}\n`);

  const results = [];

  for (const symbol of SYMBOLS) {
    try {
      console.log(`📊 Fetching ${symbol}...`);

      const historical = await yahooFinance.historical(symbol, {
        period1,
        period2,
        interval: '1d',
      });

      if (!historical || !Array.isArray(historical) || historical.length === 0) {
        console.log(`  ⚠️  No data returned for ${symbol}`);
        results.push({ symbol, count: 0 });
        continue;
      }

      const rows = historical
        .filter((quote) => quote.date && quote.close !== null && quote.close !== undefined)
        .map((quote) => {
          const dateStr = quote.date instanceof Date
            ? quote.date.toISOString().slice(0, 10)
            : new Date(quote.date).toISOString().slice(0, 10);

          return {
            symbol,
            date: dateStr,
            close: quote.close,
            adjusted_close: (quote.adjClose ?? quote.adjustedClose ?? quote.close),
            volume: quote.volume ?? null,
          };
        });

      if (rows.length === 0) {
        console.log(`  ⚠️  No valid rows after filtering for ${symbol}`);
        results.push({ symbol, count: 0 });
        continue;
      }

      // Show date range
      const dates = rows.map(r => r.date).sort();
      console.log(`  ✅ Fetched ${rows.length} data points`);
      console.log(`  📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);

      // Upsert into database
      const { error: upsertError } = await supabase
        .from('benchmark_prices')
        .upsert(rows, {
          onConflict: 'symbol,date',
        });

      if (upsertError) {
        console.error(`  ❌ Upsert error:`, upsertError);
        results.push({ symbol, count: 0, error: upsertError.message });
      } else {
        console.log(`  ✅ Successfully upserted ${rows.length} rows`);
        results.push({ symbol, count: rows.length });
      }
    } catch (error) {
      console.error(`  ❌ Error fetching ${symbol}:`, error.message);
      results.push({ symbol, count: 0, error: error.message });
    }
  }

  const totalRows = results.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n✅ Complete! Total rows updated: ${totalRows}`);
  console.log(`\nResults:`, results);
}

fillGap().catch(console.error);

