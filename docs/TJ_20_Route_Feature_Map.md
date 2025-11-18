# Trade-Journal Route & Feature Map

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Purpose**: Complete sitemap showing all routes, pages, authentication requirements, and user journeys in the Trade-Journal application.

---

## 1. Complete Route Table

### Public Routes (No Authentication Required)

| Path | Auth Required | Description | Key Components | Key Data Sources |
|------|--------------|-------------|----------------|------------------|
| `/` | No | Marketing landing page | `Hero`, `FeaturePanel`, `PricingTable`, `Testimonials`, `FAQAccordion` | Static marketing content |
| `/auth/login` | No | User login page | `FormField`, `Button` from login form | Supabase Auth (`signInWithPassword`) |
| `/auth/signup` | No | User registration page | `FormField`, `Button` from signup form | Supabase Auth (`signUp`) |
| `/auth/reset-password` | No | Password reset flow | Password reset form | Supabase Auth (`resetPasswordForEmail`) |
| `/auth/reset` | No | Password reset confirmation | Password reset UI | Supabase Auth |
| `/auth/callback` | No | OAuth callback handler | `OAuthCallbackHandler` | Supabase Auth |
| `/legal/terms` | No | Terms of Service page | Static legal content | N/A |
| `/legal/privacy` | No | Privacy Policy page | Static legal content | N/A |

### Protected Routes (Authentication Required)

**Note**: Protected routes are enforced by `middleware.ts` which checks for a valid Supabase session. Unauthenticated users are redirected to `/login` with a `redirectTo` parameter.

#### Dashboard & Overview

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/dashboard` | Main dashboard with portfolio overview | `DashboardClient`, `DashboardStats`, `RecentTrades`, `PerformanceChart` | Supabase: `trades`, `snaptrade_accounts`, `user_broker_verification` |
| `/dashboard/portfolio` | Portfolio summary and positions | `PositionsTable`, metrics cards | Supabase: `trades`, `snaptrade_accounts` |
| `/dashboard/account` | Account overview and balances | Account metrics, balance cards | Supabase: `snaptrade_accounts` |

#### Trading & Trade Management

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/trades` | Trade list with filters and sorting | `TradesClient`, `TradeTable`, `TradeDetailsDrawer` | Supabase: `trades` table via `/api/trades` |
| `/trades/add` | Add new trade manually | `AddTradeForm` | Supabase: `trades` table |
| `/add-trade` | Alternative add trade page | `AddTradePage` | Supabase: `trades` table |
| `/dashboard/trades` | Dashboard-embedded trade list | Trade list component | Supabase: `trades` |
| `/trade-history` | Historical trades view | `TradeHistoryPage`, trade list | Supabase: `trades` |
| `/dashboard/trade-history` | Dashboard-embedded trade history | Historical trade view | Supabase: `trades` |

#### Import & Data Ingestion

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/import` | CSV import wizard and broker connections | `FunctionalCSVImporter`, broker connection UI | `/api/import/csv`, `/api/snaptrade/*` |
| `/dashboard/import` | Dashboard-embedded import page | Import wizard | Same as `/import` |
| `/dashboard/import-trades` | Alternative import route | Import UI | Same as `/import` |
| `/connect` | SnapTrade broker connection management | `ConnectBrokerButton`, `BrokerVerifiedBadge`, connection table | `/api/snaptrade/connections`, `/api/snaptrade/sync` |
| `/dashboard/brokers` | Dashboard-embedded broker connections | Broker connection UI | `/api/snaptrade/*` |

#### Analytics & Performance

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/analytics` | Comprehensive analytics dashboard | `AnalyticsFilters`, `EquityCurveChart`, `PnLByMonthChart`, performance metrics | `/api/analytics/combined` (broker + manual data) |
| `/dashboard/analytics` | Dashboard-embedded analytics | Analytics charts and metrics | Same as `/analytics` |
| `/calendar` | Calendar heatmap of daily P&L | `CalendarPage`, calendar grid with P&L visualization | `/api/trades` |
| `/dashboard/calendar` | Dashboard-embedded calendar view | Calendar heatmap | Same as `/calendar` |
| `/dashboard/reports` | Performance reports | Report generation UI | Supabase: analytics aggregations |

#### Options Tools

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/dashboard/options` | Options calculator with Greeks | `OptionsCalculator`, Black-Scholes calculator | Client-side calculations (`lib/options/blackscholes.ts`) |

#### Market Tools

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/dashboard/scanner` | Market scanner with presets | `MarketScanner`, scanner filters | `/api/scanner/data`, `/api/market/*` |
| `/dashboard/market-scanner` | Alternative scanner route | Market scanner UI | Same as `/dashboard/scanner` |
| `/dashboard/trending-tickers` | Trending stocks and options | Trending tickers list | `/api/trending`, Polygon API |

#### User Settings & Subscriptions

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/settings` | User settings (profile, security, data) | `SettingsPageClient`, settings tabs | `/api/settings/*`, `/api/profiles/*` |
| `/dashboard/settings` | Dashboard-embedded settings | Settings UI | Same as `/settings` |
| `/subscriptions` | Subscription management and billing | `PricingTable`, Stripe checkout integration | `/api/checkout`, `/api/portal` (Stripe) |
| `/dashboard/billing` | Billing management | Billing UI, Stripe portal | `/api/checkout`, `/api/portal` |

#### Admin Routes

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/admin/users` | Admin user management | `AdminGuard`, user admin UI | Supabase: `profiles`, `admin_users` |
| `/admin/instruments/merge` | Admin instrument merging tool | `InstrumentMergeTool` | Supabase: `instruments`, `instrument_aliases` |

#### Additional Protected Routes

| Path | Description | Key Components | Key Data Sources |
|------|-------------|----------------|------------------|
| `/journal` | Trade journal / notes | Journal UI | Supabase: `trades` (notes field) |
| `/profile` | Public profile view | Profile display | Supabase: `profiles` |
| `/dashboard/profile` | User profile page | Profile edit form | Supabase: `profiles` |
| `/dashboard/alerts` | Price alerts and notifications | Alerts UI | Supabase: `price_alerts` (if implemented) |
| `/dashboard/notifications` | User notifications | Notifications list | Supabase: `notifications` (if implemented) |
| `/dashboard/tax-center` | Tax reporting tools | Tax calculation UI | Supabase: `trades`, analytics |
| `/dashboard/risk-management` | Risk metrics and analysis | Risk metrics UI | Analytics calculations |
| `/dashboard/price-alerts` | Price alert management | Alert setup UI | Supabase: `price_alerts` |
| `/dashboard/benchmark` | Benchmark comparison | Benchmark charts | External market data APIs |
| `/dashboard/demo-adjustment` | Demo data adjustment tools | Demo adjustment UI | Test/demo data |
| `/leaderboard` | User leaderboard (if public) | Leaderboard table | Supabase: aggregated user metrics |
| `/sandbox/tv` | TradingView sandbox | TradingView widget | TradingView embed |

### API Routes (Backend)

API routes are documented separately in **[TJ_40_Api_Routes_Inventory.md](./TJ_40_Api_Routes_Inventory.md)**. They live under `/api/*` and handle backend logic.

---

## 2. Route Protection Mechanism

### Middleware Configuration

The application uses Next.js middleware (`middleware.ts`) to protect routes:

```typescript
// middleware.ts
const protectedRoutes = [
  '/dashboard',
  '/trades', 
  '/import',
  '/analytics',
  '/settings'
]

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trades/:path*', 
    '/import/:path*',
    '/analytics/:path*',
    '/settings/:path*'
  ],
}
```

**How it works:**
1. For any route matching the `config.matcher` patterns, middleware executes before rendering the page.
2. It calls `getServerSupabase()` to check for a valid session.
3. If no valid session exists, the user is redirected to `/login?redirectTo={originalPath}`.
4. After successful login, the user is redirected back to their original destination.
5. E2E tests can bypass this by setting `NEXT_PUBLIC_E2E_TEST=true`.

### Server-Side Auth Checks

In addition to middleware, many pages perform server-side auth checks using `getUserOrRedirect()`:

```typescript
// Example from app/trades/page.tsx
export default async function TradesPage() {
  const user = await getUserOrRedirect('/trades')
  return <TradesClient />
}
```

This provides defense-in-depth: even if middleware is bypassed, the page itself checks auth.

---

## 3. User Journeys

### Journey 1: New User Onboarding

1. **Landing** (`/`)
   - User views marketing page with features, pricing, testimonials
   - Clicks "Sign Up" or "Get Started" button

2. **Signup** (`/auth/signup`)
   - User creates account with email/password
   - Form validation: username (3+ chars), email, password (8+ chars, mixed case + number)
   - Account created via Supabase Auth
   - User may be prompted to verify email (depending on Supabase config)

3. **First Login** (`/auth/login`)
   - User logs in with email/password
   - Session cookie set by Supabase Auth
   - Redirected to `/dashboard`

4. **Dashboard (Empty State)** (`/dashboard`)
   - Shows empty state: "Import your first trade"
   - Encourages connecting broker or importing CSV

5. **Import Trades** (`/import`)
   - User uploads CSV or connects broker via SnapTrade
   - CSV parsed and validated
   - Trades imported into `trades` table
   - User sees import success confirmation

6. **View Trades** (`/trades`)
   - User sees imported trades in paginated table
   - Can filter, sort, search trades
   - Can open trade details drawer

7. **View Analytics** (`/analytics`)
   - User sees performance charts, P&L, win rate, Sharpe ratio
   - Data sourced from imported trades

### Journey 2: Existing User - Daily Workflow

1. **Login** (`/auth/login`)
   - User logs in with credentials
   - Redirected to `/dashboard`

2. **Dashboard** (`/dashboard`)
   - Views key metrics: day P&L, portfolio value, open positions
   - Sees recent trades
   - Checks broker-verified badge status

3. **Check Market Scanner** (`/dashboard/scanner`)
   - Uses scanner presets (gappers, high volume, IV rank)
   - Identifies potential trade setups

4. **Use Options Calculator** (`/dashboard/options`)
   - Inputs strike, DTE, IV for option of interest
   - Views Greeks (Delta, Gamma, Theta, Vega)
   - Adjusts scenario sliders

5. **Execute Trade (External Broker)**
   - User executes trade on their brokerage platform

6. **Auto-Sync or Manual Entry** (`/import` or `/trades/add`)
   - If SnapTrade connected: trade auto-syncs
   - Otherwise: user manually adds trade

7. **View Updated Analytics** (`/analytics` or `/calendar`)
   - Checks updated P&L and performance metrics
   - Reviews calendar heatmap for daily patterns

8. **Review Trade Journal** (`/journal` or trade details)
   - Adds notes or tags to trades
   - Reviews trade outcomes

### Journey 3: Broker Connection (SnapTrade)

1. **Navigate to Connect** (`/connect` or `/import`)
   - User clicks "Connect Broker" button

2. **SnapTrade OAuth Flow**
   - User is redirected to SnapTrade portal
   - Selects broker (e.g., Robinhood, TD Ameritrade)
   - Authenticates with broker credentials

3. **Redirect Back to App** (`/auth/callback` or `/connect`)
   - SnapTrade calls back to app with connection details
   - App calls `/api/snaptrade/sync` to sync accounts

4. **Broker-Verified Badge** (`/dashboard`)
   - User sees "Broker-Verified" badge next to username
   - Badge visible across all pages

5. **View Synced Data** (`/connect`)
   - User sees connected accounts with balances
   - Views last sync timestamp
   - Can manually trigger refresh

### Journey 4: Subscription Upgrade

1. **Check Subscription** (`/subscriptions` or `/dashboard/billing`)
   - User views current plan (e.g., Free, Starter)
   - Reviews features of higher tiers (Professional, Enterprise)

2. **Select Plan** (`/subscriptions`)
   - User clicks "Upgrade" on Professional plan
   - Redirected to Stripe Checkout via `/api/checkout`

3. **Stripe Payment**
   - User enters payment details in Stripe-hosted form
   - Completes payment

4. **Webhook Processing** (`/api/stripe/webhook`)
   - Stripe sends webhook to app
   - App updates user's subscription status in `profiles` table

5. **Access Premium Features**
   - User now has access to:
     - Unlimited trades
     - Advanced analytics
     - API access
     - Real-time market data
     - Priority support

6. **Manage Billing** (`/subscriptions`)
   - User clicks "Manage Billing"
   - Redirected to Stripe Customer Portal via `/api/portal`
   - Can update payment method, cancel subscription, view invoices

### Journey 5: CSV Import Workflow

1. **Start Import** (`/import`)
   - User clicks "Import CSV" tab
   - Sees broker preset options (Robinhood, Webull, IBKR, etc.)

2. **Select Broker Preset**
   - User selects broker or "Generic CSV"
   - System loads field mappings for that broker

3. **Upload CSV**
   - User drags and drops CSV file
   - File parsed by `lib/import/parsing/engine.ts`

4. **Field Mapping Review**
   - UI shows detected columns mapped to trade fields (symbol, side, qty, price, date, etc.)
   - User confirms or adjusts mappings

5. **Validation**
   - App validates rows: checks for required fields, valid dates, numeric values
   - Displays errors for invalid rows
   - User can skip or fix errors

6. **Import**
   - User clicks "Import"
   - Request sent to `/api/import/csv`
   - Backend:
     - Parses CSV
     - Normalizes data (broker-specific adapters)
     - Creates `import_runs` record
     - Inserts trades with `idempotency_key` to prevent duplicates
     - Returns summary (inserted, skipped, errors)

7. **Import Complete**
   - User sees success modal with summary
   - Can view imported trades immediately or continue to dashboard

---

## 4. Conditional Layouts and Navigation

### AppShell (Authenticated Users)

**Component**: `components/layout/AppShell.tsx`

**When Active**: All routes under `/dashboard/*`, `/trades/*`, `/import/*`, `/analytics/*`, `/settings/*`

**Structure**:
- **Sidebar (Left)**: Main navigation menu
  - Dashboard
  - Trades
  - Import
  - Analytics
  - Calendar
  - Options
  - Scanner
  - Settings
  - Admin (if admin role)
- **Header (Top)**: 
  - Logo
  - User avatar dropdown
  - Notifications (if applicable)
  - Theme toggle
  - Broker-verified badge
- **Main Content Area**: Page content

**Conditional Layout Logic** (`components/conditional-layout.tsx`):
- Checks if user is authenticated
- Checks if route requires AppShell
- If authenticated + protected route: wraps content with AppShell
- If public route (landing, login, signup): renders content directly without AppShell

### Marketing Layout (Public)

**When Active**: `/` (landing page), possibly other marketing pages

**Structure**:
- **SiteHeader**: Logo, navigation links (Features, Pricing, Sign In)
- **Main Content**: Marketing sections (Hero, Features, Testimonials, Pricing, FAQ)
- **SiteFooter**: Footer links, social media, copyright

**Components**:
- `components/marketing/SiteHeader.tsx`
- `components/marketing/SiteFooter.tsx`

---

## 5. Dynamic Routes

The application has minimal dynamic routing, relying primarily on static paths with query parameters for filters.

**Dynamic API Routes**:
- `/api/profiles/[id]/route.ts`: User profile by ID
- `/api/trades/[id]/route.ts`: Individual trade by ID
- `/api/tags/[id]/route.ts`: Tag by ID

**Dynamic Paths in Frontend**:
Currently, most frontend routes are static. Dynamic segments are handled via query parameters (e.g., `/trades?symbol=AAPL&status=open`) rather than path parameters (e.g., `/trades/[id]`).

---

## 6. Redirect Patterns

### Post-Login Redirects

1. **User logs in** at `/auth/login`
2. **Middleware or login handler** checks for `redirectTo` query parameter
3. If `redirectTo` exists: redirect to that path
4. Otherwise: redirect to `/dashboard` (default)

### Authenticated User on Public Page

1. **User navigates to** `/` (landing page) while logged in
2. **Page component** (in `app/page.tsx`) checks auth status via `useAuth()`
3. If authenticated: `router.push('/dashboard')`
4. Otherwise: render landing page

### Unauthenticated User on Protected Page

1. **User navigates to** `/dashboard` without session
2. **Middleware** intercepts request
3. Redirects to `/login?redirectTo=/dashboard`

---

## 7. Empty States

Many pages show empty states when data is missing:

- **Dashboard** (`/dashboard`): Empty state if no trades, prompts to import
- **Trades** (`/trades`): Empty state if no trades
- **Analytics** (`/analytics`): "Not enough data yet" if < 10 trades
- **Calendar** (`/calendar`): "No trades yet" empty state
- **Connect** (`/connect`): Prompts to connect broker if no connections

**Empty State Component**: `components/empty-state.tsx`

**Typical Empty State Structure**:
- Icon (e.g., BarChart3, CalendarIcon)
- Title ("No trades yet")
- Description ("Import your first trade to get started")
- Action Button ("Import Trades" → `/import`)

---

## 8. Loading States

**Page-Level Loading**:
- Many pages show skeleton loaders while fetching data
- Example: `analytics/page.tsx` has a full skeleton UI while `isLoading`

**Component-Level Loading**:
- Tables show loading spinners while paginating or filtering
- Forms disable buttons during submission

**Loading Component**: `app/loading.tsx` (Next.js convention for route segment loading)

---

## 9. Error Handling

**Page-Level Errors**: 
- `app/error.tsx`: Error boundary for unexpected errors
- `app/not-found.tsx`: 404 page for missing routes

**Component-Level Errors**:
- Most pages have `hasError` state that shows inline error messages
- Example: `analytics/page.tsx` shows error banner with retry button if data fetch fails

**Toast Notifications**:
- Success/error messages shown via `sonner` or `use-toast` hook
- Examples:
  - Import success: "Trades imported successfully"
  - Login failure: "Invalid email or password"
  - Sync error: "Failed to sync broker data"

---

## 10. Feature Flags and Experimental Routes

**Environment-Based Flags**:
- `NEXT_PUBLIC_E2E_TEST`: Bypasses middleware auth for E2E tests
- `NEXT_PUBLIC_IMPORT_V2_ENABLED`: Enables/disables Import V2 features

**Experimental Routes** (may be work-in-progress):
- `/sandbox/tv`: TradingView sandbox
- `/dashboard/demo-adjustment`: Demo data adjustment tools
- `/test-errors`, `/test-performance`, `/test-subscription`: Test/debug pages

**Note**: Test and debug routes should be gated behind feature flags or removed in production builds.

---

## 11. Summary of Key Routes by User Need

### For New Users:
- `/` (landing), `/auth/signup`, `/auth/login`

### For Daily Trading:
- `/dashboard` (overview)
- `/trades` (manage trades)
- `/dashboard/scanner` (market scanning)
- `/dashboard/options` (options calculator)

### For Analysis:
- `/analytics` (performance metrics)
- `/calendar` (daily P&L heatmap)
- `/dashboard/reports` (reports)

### For Data Management:
- `/import` (CSV or broker import)
- `/connect` (broker connections)
- `/settings` (user settings)

### For Subscriptions:
- `/subscriptions` (billing and plans)

### For Admin:
- `/admin/users`, `/admin/instruments/merge`

---

## 12. Route Naming Conventions

**Pattern Observed**:
- Top-level feature routes: `/trades`, `/analytics`, `/import`, `/settings`
- Dashboard-embedded variants: `/dashboard/trades`, `/dashboard/analytics`, etc.
- Admin routes: `/admin/*`
- Auth routes: `/auth/*`
- API routes: `/api/*`

**Inconsistencies** (potential cleanup opportunities):
- Some features have both top-level and `/dashboard/*` routes (e.g., `/trades` and `/dashboard/trades`)
- Some routes have alternative paths (e.g., `/import` and `/dashboard/import-trades`)

---

## 13. Mobile Responsiveness

**Responsive Layouts**:
- All pages use Tailwind responsive classes (`sm:`, `md:`, `lg:`)
- Sidebar collapses to drawer on mobile
- Tables use horizontal scroll or virtualized rendering on small screens
- Forms stack vertically on mobile

**Mobile-Specific Behavior**:
- Touch-friendly button sizes
- Swipe gestures (potentially, if implemented with `react-swipeable` or similar)
- Reduced data density on small screens

---

## 14. Accessibility Considerations

**Keyboard Navigation**:
- All interactive elements accessible via keyboard
- Tab order follows logical flow

**Screen Readers**:
- Semantic HTML (`<main>`, `<nav>`, `<header>`, `<footer>`)
- ARIA labels on icons and interactive elements (where present)
- `alt` text on images

**Color Contrast**:
- Tailwind color scheme designed for readability
- Dark mode support via `next-themes`

---

**End of Document**

