export const config = {
  site: {
    name: 'Riskr',
    description: 'Professional Trading Journal & Analytics',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://riskr.net',
    domain: 'riskr.net',
  },
  auth: {
    redirectUrl: process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : 'http://localhost:3000/auth/callback',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
      : 'http://localhost:3000/api',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
} as const;

export type Config = typeof config;
