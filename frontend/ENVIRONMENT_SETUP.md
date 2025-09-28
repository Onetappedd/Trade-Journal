# Environment Variables Setup

This document explains how to set up environment variables for the application.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your actual values in `.env.local`

3. Validate your environment:
   ```bash
   npm run validate-env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Required Environment Variables

### Client-Side Variables (NEXT_PUBLIC_*)

These variables are safe to expose to the browser and are included in the client bundle.

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_E2E_TEST` | Enable E2E test mode | `false` |
| `NEXT_PUBLIC_IMPORT_V2_ENABLED` | Enable Import V2 feature | `true` |

### Server-Only Variables

These variables are **NEVER** exposed to the client and should be kept secret.

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for admin operations | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_1234567890abcdef...` |
| `STRIPE_PRICE_BASIC` | Stripe price ID for basic plan | `price_1234567890abcdef` |
| `STRIPE_PRICE_PRO` | Stripe price ID for pro plan | `price_0987654321fedcba` |
| `SENTRY_DSN` | Sentry DSN for error tracking (optional) | `https://abc123@sentry.io/123456` |

## Security Features

### Automatic Secret Protection

The application automatically prevents server-only secrets from appearing in the client bundle:

- ✅ Server-only variables (without `NEXT_PUBLIC_`) are excluded from client bundle
- ✅ Build fails if server secrets are found in client code
- ✅ Runtime validation ensures required variables are present

### Validation Scripts

| Script | Purpose |
|--------|---------|
| `npm run validate-env` | Check all required environment variables are set |
| `npm run check-secrets` | Ensure no server secrets leak to client bundle |
| `npm run build` | Automatically runs both validation and secret checks |

## Development Workflow

### 1. Environment Setup

```bash
# Copy example environment file
cp env.example .env.local

# Edit with your actual values
nano .env.local

# Validate environment
npm run validate-env
```

### 2. Development

```bash
# Start development server (includes env validation)
npm run dev

# Or run validation separately
npm run validate-env
```

### 3. Building

```bash
# Build with environment validation and secret checking
npm run build
```

## Type-Safe Environment Access

Use the centralized environment system for type-safe access:

```typescript
import { getClientEnv, getServerEnv, isTestEnv } from '@/lib/env';

// Client-side (safe for browser)
const clientEnv = getClientEnv();
const supabaseUrl = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

// Server-side only
const serverEnv = getServerEnv();
const serviceKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

// Helper functions
if (isTestEnv()) {
  // Test-specific logic
}
```

## Troubleshooting

### Missing Environment Variables

If you get errors about missing environment variables:

1. Check that `.env.local` exists and contains all required variables
2. Run `npm run validate-env` to see which variables are missing
3. Ensure variable names match exactly (case-sensitive)

### Secret Leakage Errors

If the build fails with secret leakage errors:

1. Check that you're not using server-only variables in client code
2. Ensure server-only variables don't have `NEXT_PUBLIC_` prefix
3. Use the centralized env system instead of direct `process.env` access

### Build Failures

If the build fails:

1. Run `npm run validate-env` to check environment variables
2. Run `npm run check-secrets` to check for secret leakage
3. Ensure all required variables are set in `.env.local`

## Production Deployment

For production deployment:

1. Set all required environment variables in your deployment platform
2. Ensure server-only variables are not exposed to the client
3. Use the centralized env system for all environment variable access
4. Run the validation scripts in your CI/CD pipeline

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different values** for development and production
3. **Rotate secrets regularly** in production
4. **Monitor for secret leakage** in CI/CD pipelines
5. **Use the centralized env system** instead of direct `process.env` access

