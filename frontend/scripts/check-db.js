// check-db.js: Lightweight check of Supabase schema
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  );
  process.exit(1);
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const REQUIRED_TABLES = {
  trades: [
    'id',
    'user_id',
    'symbol',
    'asset_type',
    'side',
    'quantity',
    'entry_price',
    'exit_price',
    'entry_date',
    'exit_date',
    'status',
    'notes',
    'strike_price',
    'expiry_date',
    'option_type', // options
    'contract_code',
    'point_multiplier',
    'tick_size',
    'tick_value', // futures
    'created_at',
    'updated_at',
  ],
  watchlist: ['id', 'user_id', 'symbol'],
  user_settings: ['user_id', 'initial_capital'],
};

async function checkTableColumns(table, requiredCols) {
  const sql = `select column_name from information_schema.columns where table_schema = 'public' and table_name = '${table}'`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      name: 'exec_sql',
      args: { sql },
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch columns for ${table}`);
  }
  const data = await res.json();
  const cols = (data || []).map((r) => r.column_name);
  const missing = requiredCols.filter((c) => !cols.includes(c));
  return { columns: cols, missing };
}
(async () => {
  let failed = false;
  for (const [table, cols] of Object.entries(REQUIRED_TABLES)) {
    try {
      const { missing } = await checkTableColumns(table, cols);
      if (missing.length === 0) {
        console.log(`[OK] ${table} table: all required columns present`);
      } else {
        failed = true;
        console.error(`[FAIL] ${table} missing columns: ${missing.join(', ')}`);
      }
    } catch (err) {
      failed = true;
      console.error(`[FAIL] Error checking ${table}:`, err.message);
    }
  }
  process.exit(failed ? 1 : 0);
})();
