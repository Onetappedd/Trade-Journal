# Trade-Journal App Overview

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Purpose**: High-level overview of the Trade-Journal Next.js application architecture and technology stack.

---

## 1. Product Purpose

**Trade-Journal** is the primary web application for the RISKR trading analytics platform. It provides traders with:

- **Trade Journaling**: Comprehensive trade entry and management system
- **Portfolio Analytics**: Real-time performance metrics, P&L tracking, and risk analytics
- **Data Import**: CSV imports from multiple brokers and SnapTrade broker connection integration
- **Performance Visualization**: Charts, heatmaps, equity curves, and analytics dashboards
- **Subscription Management**: Tiered access control with Stripe integration
- **Market Data**: Real-time quotes, options chain data, and market scanning tools

The application is designed as a full-featured SaaS platform for retail traders to track, analyze, and improve their trading performance.

---

## 2. Technology Stack

### Framework & Language
- **Framework**: Next.js 14.2.16 (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Node.js 20.x
- **Package Manager**: npm (≥8.0.0), using pnpm-compatible lockfile

### Frontend Stack
- **UI Framework**: React 18
- **Styling**: 
  - Tailwind CSS 3.4.17
  - CSS Variables for theming (dark/light mode)
  - PostCSS for processing
- **Component Library**: 
  - Radix UI (headless primitives)
  - shadcn/ui (built on Radix)
  - Lucide React (icons)
- **Animation**: Framer Motion 12.23.12
- **Charting Libraries**:
  - @visx (low-level D3 abstractions)
  - Recharts 3.2.1 (higher-level charts)
  - D3 utilities (d3-array, d3-time-format)

### State Management
- **Server State**: 
  - @tanstack/react-query 5.85.5 (primary)
  - SWR 2.2.4 (legacy, used in some hooks)
- **Client State**: 
  - Zustand 5.0.7 (global stores)
  - React Context (auth, theme)
- **Form State**: react-hook-form 7.53.0 with Zod 3.25.76 validation

### Backend & Database
- **Backend Service**: Supabase (PostgreSQL, Auth, RLS)
- **Supabase Packages**:
  - @supabase/supabase-js (client SDK)
  - @supabase/ssr (server-side rendering support)
  - @supabase/auth-helpers-nextjs 0.10.0
- **API Layer**: Next.js API Routes (in `app/api/*`)
- **Server Actions**: Next.js Server Actions (in `app/actions/*`)

### External Integrations
- **Brokerage Connectivity**: 
  - SnapTrade SDK (snaptrade-typescript-sdk 9.0.143, snaptrade-react 3.2.4)
- **Payments**: Stripe 18.5.0
- **Market Data**: 
  - Polygon.io (custom client implementation)
  - Fallback/hybrid providers
- **Error Tracking**: Sentry (@sentry/nextjs 10.10.0)
- **Authentication**: NextAuth 4.24.11 (supplementary to Supabase Auth)

### Data Processing
- **CSV Parsing**: 
  - csv-parse 6.1.0
  - papaparse 5.5.3
  - xlsx 0.18.5 (Excel support)
- **XML Parsing**: fast-xml-parser 5.2.5
- **Math**: Decimal.js 10.6.0 (precision calculations)
- **Date/Time**: 
  - date-fns 4.1.0
  - date-fns-tz 3.2.0

### Development & Testing
- **TypeScript**: 5.9.2
- **Testing**:
  - Vitest 3.2.4 (unit tests)
  - @testing-library/react 16.3.0
  - Playwright (E2E tests, configured in playwright.config.ts)
- **Linting**: ESLint 9.34.0
- **Code Quality**: 
  - Validation scripts (validate-env-simple.js, check-client-secrets.js)
  - Type checking via tsc

### UI/UX Libraries
- **Tables**: @tanstack/react-table 8.21.3
- **Virtualization**: 
  - @tanstack/react-virtual 3.13.12
  - react-virtuoso 4.14.0
  - react-window 2.1.2
- **Drag & Drop**: react-dropzone 14.3.8
- **Panels**: react-resizable-panels
- **Carousels**: embla-carousel-react
- **Notifications**: Sonner (toast notifications)

---

## 3. Folder Structure

```
Trade-Journal/frontend/
│
├── app/                          # Next.js 14 App Router (primary application code)
│   ├── api/                      # API Routes (128 files)
│   │   ├── analytics/            # Analytics endpoints
│   │   ├── import/               # CSV import & trade ingestion
│   │   ├── kpi/                  # KPI calculation endpoints
│   │   ├── market/               # Market data proxies (Polygon, etc.)
│   │   ├── snaptrade/            # SnapTrade integration
│   │   ├── stripe/               # Stripe webhooks
│   │   ├── trades/               # Trade CRUD operations
│   │   ├── test-*/               # Debug/test endpoints
│   │   └── ...                   # Other API endpoints
│   ├── actions/                  # Next.js Server Actions
│   ├── dashboard/                # Main dashboard pages & subpages
│   ├── trades/                   # Trade list and management
│   ├── import/                   # Import wizard pages
│   ├── analytics/                # Analytics dashboard
│   ├── settings/                 # User settings
│   ├── auth/                     # Auth pages (login, signup, reset)
│   ├── calendar/                 # Calendar view
│   ├── subscriptions/            # Subscription management
│   ├── admin/                    # Admin-only pages
│   ├── layout.tsx                # Root layout (wraps entire app)
│   ├── providers.tsx             # Global providers (React Query, Auth, Theme)
│   ├── page.tsx                  # Landing page
│   └── middleware.ts             # Route protection middleware (moved to root)
│
├── components/                   # React Components (241 files)
│   ├── analytics/                # Analytics charts and tables
│   ├── auth/                     # Auth forms and providers
│   ├── dashboard/                # Dashboard-specific components
│   ├── import/                   # Import wizard components
│   ├── trades/                   # Trade list, details, filters
│   ├── snaptrade/                # SnapTrade UI components
│   ├── options/                  # Options calculator & tools
│   ├── scanner/                  # Market scanner components
│   ├── tax-center/               # Tax reporting tools
│   ├── ui/                       # Reusable UI primitives (shadcn/ui)
│   ├── layout/                   # AppShell & sidebar layouts
│   ├── marketing/                # Marketing/landing page components
│   └── ...
│
├── lib/                          # Core Utilities & Libraries (118 files)
│   ├── supabase/                 # Supabase clients (client.ts, server.ts)
│   ├── import/                   # CSV import parsing engine & adapters
│   │   ├── adapters/             # Broker-specific import adapters
│   │   └── parsing/              # Core parsing logic
│   ├── analytics/                # Analytics calculation utilities
│   ├── options/                  # Options pricing models (Black-Scholes, American)
│   ├── marketdata/               # Market data providers (Polygon, etc.)
│   ├── matching/                 # Trade matching engine
│   ├── auth/                     # Auth helpers
│   ├── crypto/                   # Cryptographic utilities
│   ├── math/                     # Math & money precision utils
│   ├── observability/            # Telemetry & monitoring
│   ├── snaptrade/                # SnapTrade SDK wrappers
│   ├── types/                    # Type definitions
│   └── ...                       # Various utility modules
│
├── hooks/                        # Custom React Hooks (24 files)
│   ├── useTrades.ts              # Trade data fetching
│   ├── useAnalytics.ts           # Analytics data
│   ├── useMarketData.ts          # Market data
│   ├── usePortfolio.ts           # Portfolio metrics
│   ├── useScannerData.ts         # Scanner state
│   ├── useEntitlements.ts        # Subscription access control
│   └── ...
│
├── providers/                    # React Context Providers
│   └── auth-provider.tsx         # Auth state management
│
├── store/                        # Zustand Global Stores
│   └── analytics-filters.ts      # Analytics filter state
│
├── types/                        # TypeScript Type Definitions
│   ├── trading.ts
│   └── imports.ts
│
├── context/                      # Legacy context (auth.tsx)
│
├── supabase/                     # Supabase Configuration
│   └── migrations/               # Database migration files (26 SQL files)
│
├── scripts/                      # Build & utility scripts (42 files)
│   ├── validate-env-simple.js    # Environment validation
│   ├── check-client-secrets.js   # Security checks
│   ├── snaptrade-cli.ts          # SnapTrade CLI tool
│   └── ...
│
├── tests/                        # Test Suite
│   └── e2e/                      # Playwright E2E tests
│
├── __tests__/                    # Unit/Integration Tests
│   ├── lib/                      # Library tests
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
│
├── public/                       # Static Assets
│   └── (images, SVGs, etc.)
│
├── docs/                         # Documentation (this folder)
│
├── middleware.ts                 # Next.js Middleware (route protection)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
├── vitest.config.ts              # Vitest test configuration
├── playwright.config.ts          # Playwright E2E config
└── README.md                     # Main README
```

---

## 4. Application Architecture

### Routing Pattern
- **Pattern**: Next.js 14 App Router (file-system based)
- **Layout System**: Nested layouts with `layout.tsx` files
- **Client/Server Split**: Mix of Server Components (default) and Client Components (`'use client'`)

### Authentication Flow
1. User authenticates via Supabase Auth (email/password)
2. Session managed by `AuthProvider` (React Context)
3. Middleware (`middleware.ts`) protects routes requiring auth
4. RLS policies in Supabase enforce data isolation

### Data Flow
1. **Client → API Routes → Supabase**
   - Client components call Next.js API routes
   - API routes use Supabase client to query database
   - RLS policies filter data by user_id
2. **Client → Direct Supabase (some cases)**
   - Some components use Supabase client directly for real-time features

### State Management Strategy
- **Server State**: React Query for API data (caching, refetching)
- **Global Client State**: Zustand for UI state (filters, preferences)
- **Local Component State**: React useState/useReducer
- **Form State**: react-hook-form for complex forms

### Build & Deployment
- **Build Command**: `npm run build` (includes env validation and secret checking)
- **Development**: `npm run dev`
- **Environment**: Node.js 20.x
- **Deployment Target**: Vercel (implied by vercel.json config)

---

## 5. Key Configuration Files

### next.config.js
- **TypeScript Errors**: Ignored during builds (⚠️ Technical Debt)
- **ESLint Errors**: Ignored during builds (⚠️ Technical Debt)
- **External Packages**: `@supabase/ssr` marked as external for server components

### tsconfig.json
- **Strict Mode**: Enabled
- **Module Resolution**: Bundler
- **Path Aliases**: `@/*` maps to project root
- **Target**: ES6
- **Excludes**: test files, node_modules

### tailwind.config.ts
- **Dark Mode**: Class-based (`class` strategy)
- **Content**: Scans `app/`, `components/`, `pages/` for Tailwind classes
- **Theme Extensions**:
  - Custom color system (background, foreground, card, popover, etc.)
  - Sidebar-specific colors
  - Chart colors (chart-1 through chart-5)
  - Marketing-specific colors (`pp-*` namespace)
  - Custom border radius variables
  - Accordion animations

### package.json Scripts
- **dev**: Validates env, then starts Next.js dev server
- **build**: Validates env, builds Next.js, checks for client secrets
- **test**: Runs Vitest unit tests
- **test:e2e**: Runs Playwright E2E tests
- **check:all**: Runs format check, type check, lint, and env checks
- **snaptrade:*** : CLI commands for SnapTrade integration
- **types:gen**: Generates TypeScript types from Supabase schema

---

## 6. Environment Variables

The application expects environment variables to be set in `.env.local` for local development. Key categories:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`
- **SnapTrade**: `SNAPTRADE_CLIENT_ID`, `SNAPTRADE_CONSUMER_KEY`
- **Polygon**: (Likely `POLYGON_API_KEY` based on usage in lib/polygon-api.ts)
- **Sentry**: `SENTRY_DSN` (optional, for error tracking)
- **App Config**: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_E2E_TEST`

See `env.example` for full list.

---

## 7. Notable Implementation Details

### Import System
- Streaming CSV parser for large files
- Broker-specific adapters (Webull, Robinhood, etc.)
- Idempotency handling via `idempotency_key`
- Extensive error handling and user feedback

### Performance Optimizations
- Virtualization for large trade lists (react-window, react-virtuoso)
- React Query caching with smart invalidation
- Lazy loading of heavy components (e.g., charts, tables)

### Security Features
- Environment variable validation at build time
- Client secret detection script prevents leaking server secrets to browser bundle
- Supabase RLS for data isolation
- Middleware-based route protection

### Testing Strategy
- Unit tests via Vitest
- E2E tests via Playwright
- Integration tests for import flows
- Test fixtures for sample trade data

---

## 8. Development Workflow

### Starting Development
```bash
npm run dev           # Starts dev server on http://localhost:3000
```

### Running Tests
```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run check:all     # Full quality checks
```

### Building for Production
```bash
npm run build         # Builds optimized production bundle
npm start             # Serves production build locally
```

### Generating Supabase Types
```bash
npm run types:gen     # Regenerates lib/database.types.ts from Supabase schema
```

---

## 9. Known Technical Debt & Warnings

1. **Build Errors Ignored** (⚠️ HIGH PRIORITY)
   - `next.config.js` ignores TypeScript and ESLint errors during builds
   - This allows broken code to be deployed to production
   - **Recommendation**: Fix errors and remove these overrides

2. **Dual State Management**
   - Both React Query and SWR are used for similar purposes
   - **Recommendation**: Standardize on React Query (newer, more actively used)

3. **Multiple Test Frameworks**
   - Vitest for unit tests
   - Playwright for E2E
   - This is acceptable, but consistency is important

4. **Debug/Test API Routes in Production**
   - Many `app/api/test-*` endpoints exist
   - **Recommendation**: Gate these behind feature flags or remove in production builds

5. **Legacy Files**
   - Multiple backup folders exist (frontend-backup-/, frontend-backup-20250115/)
   - **Recommendation**: Archive or remove to reduce confusion

---

## 10. Next Steps for Onboarding

To fully understand the Trade-Journal app, continue with:

1. **[TJ_20_Route_Feature_Map.md](./TJ_20_Route_Feature_Map.md)** - Complete sitemap and user journeys
2. **[TJ_30_Auth_And_Data_Model.md](./TJ_30_Auth_And_Data_Model.md)** - Authentication and data access patterns
3. **[Feature Deep Dives](./features/)** - Domain-specific documentation (Trades, Analytics, Imports, etc.)
4. **[TJ_40_Api_Routes_Inventory.md](./TJ_40_Api_Routes_Inventory.md)** - Complete API route reference
5. **[TJ_50_State_And_UX_Patterns.md](./TJ_50_State_And_UX_Patterns.md)** - State management and UI patterns
6. **[TJ_60_Owners_Manual.md](./TJ_60_Owners_Manual.md)** - User-facing feature overview

---

**End of Document**

