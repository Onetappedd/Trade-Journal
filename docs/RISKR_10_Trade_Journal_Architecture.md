# Trade-Journal Architecture

## Overview

Trade-Journal is the main web application for the Riskr trading journal system. It's built with Next.js 14 using the App Router, TypeScript, and Supabase for backend services.

---

## Tech Stack

- **Framework:** Next.js 14.2.16 (App Router)
- **Language:** TypeScript 5.9.2
- **UI:** React 18, Tailwind CSS 3.4.17, shadcn/ui (Radix UI components)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **State Management:** 
  - React Query (@tanstack/react-query) for server state
  - SWR (used in some places) for data fetching
  - Zustand (available but limited usage)
  - React Context for auth state
- **Forms:** react-hook-form + zod validation
- **Package Manager:** npm/pnpm (dual support)

---

## Routing Structure

### App Router (Next.js 14)

The application uses Next.js App Router with the following structure:

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing page (redirects authenticated users)
├── providers.tsx           # React Query + Auth providers
│
├── auth/                   # Authentication routes
│   ├── login/
│   ├── signup/
│   ├── reset/
│   └── callback/           # OAuth callback handler
│
├── dashboard/              # Main authenticated app area
│   ├── page.tsx           # Dashboard home
│   ├── trades/            # Trade management
│   ├── analytics/          # Performance analytics
│   ├── import/             # Trade import
│   ├── calendar/           # P&L calendar view
│   ├── portfolio/          # Portfolio overview
│   ├── scanner/            # Market scanner
│   ├── trending-tickers/   # Trending stocks
│   ├── tax-center/        # Tax reporting
│   ├── settings/           # User settings
│   └── [various other pages]
│
├── trades/                 # Trade routes (alternative to dashboard/trades)
├── import/                 # Import hub (v2)
├── analytics/              # Analytics routes
├── calendar/               # Calendar view
├── journal/                # Trading journal
├── leaderboard/            # Trader leaderboard
├── profile/                # User profile
├── settings/               # Settings
├── subscriptions/          # Subscription management
│
└── api/                    # API routes (Next.js API routes)
    ├── trades/             # Trade CRUD operations
    ├── import/              # Import endpoints
    ├── analytics/            # Analytics calculations
    ├── snaptrade/           # SnapTrade integration
    ├── stripe/              # Stripe webhooks
    ├── polygon/             # Polygon.io market data
    ├── market/               # Market data endpoints
    └── [many other endpoints]
```

### Route Protection

Middleware (`middleware.ts`) protects routes:
- `/dashboard/*`
- `/trades/*`
- `/import/*`
- `/analytics/*`
- `/settings/*`

Unauthenticated users are redirected to `/login` with a `redirectTo` parameter.

---

## Major Feature Modules

### 1. Trade Management

**Location:** `app/dashboard/trades/`, `app/trades/`, `app/api/trades/`

**Features:**
- View all trades with filtering (symbol, asset type, date range)
- Add trades manually
- Edit/delete trades
- Trade details drawer with notes and tags
- Trade matching engine (matches executions to positions)

**Key Files:**
- `app/dashboard/trades/page.tsx` - Main trades list page
- `app/api/trades/route.ts` - Trade API endpoints
- `lib/trades/` - Trade-related utilities
- `lib/matching/engine.ts` - Trade matching logic

### 2. Import System

**Location:** `app/import/`, `app/dashboard/import/`, `app/api/import/`

**Features:**
- CSV import with broker presets (Robinhood, Webull)
- Manual field mapping
- Import run tracking
- Error handling and validation
- Resume failed imports

**Key Files:**
- `app/import/page.tsx` - Import hub (v2)
- `app/api/import/csv/route.ts` - CSV import endpoint
- `lib/import/parsing/engine.ts` - Parsing engine
- `lib/imports/upsertTrades.ts` - Trade upsert logic

**Broker Presets:**
- Robinhood: Detects by `Activity Date`, `Trans Code`, `Amount`
- Webull: Detects by headers like `SYMBOLS`, `SIDE`, `STATUS`, `QTY`, `PRICE`

### 3. Analytics & Performance

**Location:** `app/dashboard/analytics/`, `app/api/analytics/`

**Features:**
- Equity curve visualization
- Monthly P&L breakdown
- Performance metrics (Sharpe ratio, max drawdown, etc.)
- P&L calendar view
- Portfolio analytics

**Key Files:**
- `app/dashboard/analytics/page.tsx` - Analytics dashboard
- `lib/analytics/equity.ts` - Equity curve calculations
- `lib/analytics-server.ts` - Server-side analytics (calls external API at port 8000)
- `app/api/analytics/combined/route.ts` - Combined analytics endpoint

**Note:** Some analytics may call external API (RISKR-OPTIONS) at `localhost:8000` if configured.

### 4. Portfolio Management

**Location:** `app/dashboard/portfolio/`, `app/api/portfolio/`

**Features:**
- Portfolio overview
- Position tracking
- Account value snapshots
- Performance metrics

**Key Files:**
- `lib/portfolio.ts` - Portfolio calculations
- `lib/position-tracker.ts` - Position tracking logic

### 5. SnapTrade Integration

**Location:** `app/api/snaptrade/`, `lib/snaptrade/`

**Features:**
- Broker connection via SnapTrade
- Account synchronization
- Holdings sync
- Broker verification

**Key Files:**
- `app/api/snaptrade/register/route.ts` - User registration
- `app/api/snaptrade/login-link/route.ts` - Generate login link
- `app/api/snaptrade/sync/route.ts` - Sync connections and accounts
- `lib/snaptrade.ts` - SnapTrade SDK wrapper

**Tables:**
- `snaptrade_users` - SnapTrade credentials
- `snaptrade_connections` - Broker connections
- `snaptrade_accounts` - Account snapshots

### 6. Options Tools

**Location:** `lib/options/`, `components/options/`

**Features:**
- Options calculator (Black-Scholes, American options)
- Greeks calculation (Delta, Gamma, Theta, Vega, Rho)
- Options scenarios
- Options chain viewer

**Key Files:**
- `lib/options/blackscholes.ts` - Black-Scholes implementation
- `lib/options/american.ts` - American options pricing
- `components/options/OptionsCalculator.tsx` - Calculator UI

### 7. Market Data

**Location:** `app/api/market/`, `app/api/polygon/`, `lib/marketdata/`

**Features:**
- Real-time quotes
- Options chains
- Market scanner
- Trending tickers
- Historical data

**Key Files:**
- `lib/marketdata/polygon.ts` - Polygon.io client
- `app/api/market/quote/route.ts` - Quote endpoint
- `app/api/market/chain/route.ts` - Options chain endpoint

### 8. Subscriptions & Billing

**Location:** `app/subscriptions/`, `app/api/stripe/`, `app/api/checkout/`

**Features:**
- Stripe integration
- Subscription management
- Plan upgrades/downgrades
- Webhook handling

**Key Files:**
- `app/api/stripe/webhook/route.ts` - Stripe webhook handler
- `app/api/checkout/route.ts` - Checkout session creation
- `lib/subscription.ts` - Subscription utilities

---

## State Management

### React Query (Primary)

**Configuration:** `app/providers.tsx`, `components/providers/query-client-provider.tsx`

**Settings:**
- `staleTime`: 5 minutes
- `refetchOnWindowFocus`: false
- `retry`: 1

**Usage:**
- Server state management
- API data fetching
- Caching and invalidation

**Example:**
```typescript
// Some components use React Query directly
import { useQuery } from '@tanstack/react-query';
```

### SWR (Secondary)

**Usage:** Some components still use SWR (e.g., `hooks/useTrades.ts`)

**Note:** There's a mix of React Query and SWR usage, which could be consolidated.

### Zustand

**Status:** Available in dependencies but limited usage found.

### React Context

**Auth Context:** `providers/auth-provider.tsx`
- Provides: `user`, `session`, `userId`, `loading`, `signOut`
- Used throughout app for authentication state

---

## Supabase Integration

### Client Setup

**Browser Client:** `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr';
```

**Server Client:** `lib/supabase/server.ts`
- `getServerSupabase()` - For server components
- `createSupabaseWithToken()` - For API routes with auth token
- `createSupabaseAdmin()` - For admin operations (service role)

### Authentication

**Provider:** `providers/auth-provider.tsx`
- Wraps app with auth context
- Manages session state
- Handles auth state changes

**Flow:**
1. User signs in via Supabase Auth
2. Session stored in cookies (via @supabase/ssr)
3. AuthProvider provides session to app
4. Middleware checks session for protected routes

### Database Queries

**Pattern:** Direct Supabase client usage in API routes and server components

**Example:**
```typescript
const supabase = getServerSupabase();
const { data } = await supabase
  .from('trades')
  .select('*')
  .eq('user_id', userId);
```

### RLS (Row Level Security)

- Enforced at database level
- Users can only access their own data
- Service role key used for admin operations

---

## Environment Variables

### Required Variables

| Variable | Usage | Location | Notes |
|----------|-------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client & Server | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Client & Server | Public, safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Server only | **Secret** - Admin operations |
| `SUPABASE_JWT_SECRET` | JWT secret | Server only | **Secret** - Token verification |

### Optional Variables

| Variable | Usage | Location | Notes |
|----------|-------|----------|-------|
| `NEXT_PUBLIC_API_URL` | External API URL | Client | For RISKR-OPTIONS integration |
| `PYTHON_API_BASE_URL` | External API URL | Server | Alternative to NEXT_PUBLIC_API_URL |
| `SNAPTRADE_CLIENT_ID` | SnapTrade API | Server | **Secret** |
| `SNAPTRADE_CONSUMER_KEY` | SnapTrade API | Server | **Secret** |
| `STRIPE_SECRET_KEY` | Stripe API | Server | **Secret** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | Server | **Secret** |
| `STRIPE_PRICE_BASIC` | Stripe price ID | Server | Basic plan price |
| `STRIPE_PRICE_PRO` | Stripe price ID | Server | Pro plan price |
| `POLYGON_API_KEY` | Polygon.io API | Server | **Secret** - Market data |
| `SENTRY_DSN` | Sentry error tracking | Server | Optional |

### Feature Flags

| Variable | Usage | Default |
|----------|-------|---------|
| `NEXT_PUBLIC_E2E_TEST` | E2E test mode | `false` |
| `NEXT_PUBLIC_IMPORT_V2_ENABLED` | Import v2 UI | `true` |

### Environment File

- **Template:** `env.example`
- **Local:** `.env.local` (not committed)
- **Validation:** `scripts/validate-env-simple.js`
- **Secret Check:** `scripts/check-client-secrets.js`

---

## Key Libraries & Utilities

### Data Processing
- `papaparse` - CSV parsing
- `xlsx` - Excel file handling
- `csv-parse` - Alternative CSV parser

### Visualization
- `@visx/*` - Data visualization primitives
- `recharts` - Chart library
- `d3-array`, `d3-time-format` - D3 utilities

### Forms & Validation
- `react-hook-form` - Form management
- `zod` - Schema validation

### UI Components
- `@radix-ui/*` - Headless UI components
- `lucide-react` - Icons
- `framer-motion` - Animations
- `tailwindcss-animate` - Tailwind animations

### External SDKs
- `snaptrade-typescript-sdk` - SnapTrade integration
- `stripe` - Stripe payments
- `@supabase/supabase-js` - Supabase client

---

## Unfinished Features & TODOs

### Analytics Functions

**Location:** `hooks/useAnalytics.ts`

Multiple database functions not implemented:
- `get_user_metrics` - User metrics calculation
- `get_monthly_pnl` - Monthly P&L function
- `get_drawdown_series` - Drawdown calculations
- `get_equity_curve` - Equity curve function
- `get_pnl_by_tag` - P&L by tag
- `get_pnl_by_symbol` - P&L by symbol
- `get_expectancy_by_bucket` - Expectancy analysis

**Status:** Stub implementations return empty data.

### Dashboard Metrics

**Location:** `app/dashboard/page.tsx`

- `positions: []` - TODO: Calculate from trades
- `maxDrawdownPct: 0` - TODO: Calculate from trades

### Portfolio Analytics

**Location:** `app/api/portfolio/analytics/route.ts`

- `sharpeRatio = 0` - TODO: Calculate proper Sharpe ratio

### Trade Details

**Location:** `components/trades/TradeDetailsDrawer.tsx`

- Tags persistence - TODO: Persist tags via API
- Notes persistence - TODO: Persist note via API

### Usage Tracking

**Location:** `lib/usage-tracking.ts`

- `get_user_usage_summary` RPC function not implemented
- Returns stub response

### OAuth

**Location:** `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`

- Google OAuth - TODO: Implement Google OAuth

### Settings Export

**Location:** `app/api/settings/data/route.ts`

- `lastExport: null` - TODO: Implement export tracking

### Unrealized P&L

**Location:** `lib/trade-calculations.ts`

- `unrealizedPnL = 0` - TODO: Implement with real-time prices

### Date Filters

**Location:** `app/dashboard/trades/page.tsx`

- Date filters UI - TODO: Add date filters

---

## File Organization

### Main Directories

- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/` - Utility functions and business logic
- `hooks/` - Custom React hooks
- `providers/` - Context providers
- `scripts/` - Build and utility scripts
- `supabase/` - Database migrations
- `public/` - Static assets

### Backup Folders

- `frontend-backup-/` - Backup of frontend code
- `frontend-backup-20250115/` - Another backup
- `riskr-redesign/` - Redesign attempt (separate Next.js app)

**Note:** These backup folders may contain legacy code or alternative implementations.

---

## Development Workflow

### Setup

1. Install dependencies: `cd Trade-Journal/frontend && pnpm install`
2. Copy `env.example` to `.env.local`
3. Fill in required environment variables
4. Run validation: `pnpm validate-env`
5. Start dev server: `pnpm dev`

### Build

```bash
pnpm build
```

### Testing

- Unit tests: `pnpm test` (Vitest)
- E2E tests: `pnpm test:e2e` (Playwright)
- Type checking: `pnpm type-check`

### Database

- Migrations: `Trade-Journal/supabase/migrations/`
- Type generation: `pnpm types:gen` (generates TypeScript types from Supabase schema)

---

## Integration Points

### RISKR-OPTIONS Service

**Status:** Partially integrated / planned

**Evidence:**
- `lib/analytics-server.ts` has functions that call external API
- Environment variables `NEXT_PUBLIC_API_URL` or `PYTHON_API_BASE_URL` expected
- Default fallback: `http://localhost:8000`

**Current Usage:**
- Analytics endpoints may call RISKR-OPTIONS API if configured
- Not fully wired up in all places

### External Services

- **Supabase:** Primary database and auth
- **SnapTrade:** Broker connections
- **Stripe:** Subscriptions
- **Polygon.io:** Market data (optional)
- **Sentry:** Error tracking (optional)

---

## Notes

1. **Mixed State Management:** Both React Query and SWR are used. Consider consolidating to React Query.

2. **Backup Folders:** Multiple backup/redesign folders exist. May contain legacy code.

3. **API Route Organization:** Many API routes in `app/api/` - some may be test/debug endpoints.

4. **Type Safety:** TypeScript types generated from Supabase schema via `lib/database.types.ts`.

5. **Error Handling:** Centralized error handling in `lib/errors.ts` and `lib/error-mapping.ts`.

