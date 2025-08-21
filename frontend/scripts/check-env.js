const criticalVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];
const warnVars = [
  'POLYGON_API_KEY',
  'FINNHUB_API_KEY',
];

let failed = false;

for (const v of criticalVars) {
  if (!process.env[v]) {
    console.error(`ERROR: Required environment variable ${v} is not set.`);
    failed = true;
  }
}
for (const v of warnVars) {
  if (!process.env[v]) {
    console.warn(`Warning: Optional environment variable ${v} is not set.`);
  }
}
if (failed) {
  process.exit(1);
}
