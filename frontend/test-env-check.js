// Simple test to check if environment variables are being passed correctly
console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_E2E_TEST:', process.env.NEXT_PUBLIC_E2E_TEST);
console.log('NEXT_PUBLIC_IMPORT_V2_ENABLED:', process.env.NEXT_PUBLIC_IMPORT_V2_ENABLED);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
