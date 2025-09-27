import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment variables for all tests
  process.env.NEXT_PUBLIC_E2E_TEST = 'true';
  process.env.NEXT_PUBLIC_IMPORT_V2_ENABLED = 'true';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://lobigrwmngwirucuklmc.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjAzODgsImV4cCI6MjA2OTQ5NjM4OH0.FZvlw06ILW7TutkrakBLdEIEkuf5f69nGxXaycaMGQQ';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDM4OCwiZXhwIjoyMDY5NDk2Mzg4fQ.7rHGN2rqpumTPPPF5np09G6y67vLy2CGjBUeG-MRxBM';
  
  console.log('🔧 Global setup: Environment variables set for E2E tests');
}

export default globalSetup;

