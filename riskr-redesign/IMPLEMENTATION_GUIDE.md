# RiskR Implementation Guide
## Complete Backend Integration for Cursor + Supabase + Vercel

### Project Overview
This guide provides step-by-step instructions to implement a full-stack trading journal and analytics platform using the existing UI components with Supabase backend and Vercel deployment.

### Routes & Components Inventory

| Route | File | Purpose | Key Components | Backend Data Required |
|-------|------|---------|----------------|----------------------|
| `/` | `app/page.tsx` | Landing page | Hero, Features, Pricing, Testimonials | Static content, pricing configuration |
| `/dashboard` | `app/dashboard/page.tsx` | Main dashboard | Portfolio overview, performance charts, recent trades table | Portfolio value, daily P&L, equity curve data, recent trades list |
| `/analytics` | `app/analytics/page.tsx` | Performance analytics | Risk metrics, attribution analysis, correlation heatmap | Performance data, risk calculations, sector breakdowns, correlation matrices |
| `/trades` | `app/trades/page.tsx` | Trade history with filters | Virtualized table, advanced filters, CSV export | Paginated trades with filtering, export functionality |
| `/import` | `app/import/page.tsx` | 4-step CSV import wizard | File analysis, column mapping, validation, confirmation | File processing, broker detection, validation results |
| `/settings` | `app/settings/page.tsx` | User profile & preferences | Profile forms, security settings, data management | User profile, settings, active sessions, 2FA setup |
| `/leaderboard` | `app/leaderboard/page.tsx` | Community rankings | Top 3 highlight cards, rankings table | Leaderboard data by time period, user rankings |
| `/journal` | `app/journal/page.tsx` | Trade journal timeline | Timeline entries, rich-text notes, screenshot uploads | Journal entries with notes, tags, attachments |
| `/calendar` | `app/calendar/page.tsx` | P&L calendar visualization | Month/week grid with P&L coloring | Daily P&L aggregations, trade summaries by date |
| `/subscriptions` | `app/subscriptions/page.tsx` | Billing & plan management | Current plan display, pricing table, Stripe integration | Subscription data, billing history, plan features |
| `/auth/login` | `app/auth/login/page.tsx` | User authentication | Email/password form, Google OAuth | Authentication with Supabase Auth |
| `/auth/signup` | `app/auth/signup/page.tsx` | User registration | Signup form with validation, terms acceptance | User creation, email verification |
| `/auth/reset` | `app/auth/reset/page.tsx` | Password reset | Email input form, reset confirmation | Password reset flow |

### Environment Variables Setup

**Vercel Dashboard (Settings → Environment Variables):**
\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URLs
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Stripe Integration (Optional)
STRIPE_PUBLIC_KEY=pk_live_51234567890...
STRIPE_SECRET_KEY=sk_live_51234567890...
STRIPE_WEBHOOK_SECRET=whsec_1234567890...

# Security & Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here
NEXTAUTH_SECRET=your-nextauth-secret-key

# External APIs (Optional)
ALPHA_VANTAGE_API_KEY=your-api-key
POLYGON_API_KEY=your-api-key
\`\`\`

**Local Development (.env.local):**
\`\`\`bash
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

# Local URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Development Keys
STRIPE_PUBLIC_KEY=pk_test_51234567890...
STRIPE_SECRET_KEY=sk_test_51234567890...
ENCRYPTION_KEY=dev-encryption-key-32-chars-long
\`\`\`

### Database Schema (Supabase)

**Core Tables with Relationships:**

\`\`\`sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  full_name TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,8) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fees DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  strategy VARCHAR(100),
  sector VARCHAR(50),
  instrument VARCHAR(20) DEFAULT 'STOCK',
  broker VARCHAR(50),
  broker_trade_id VARCHAR(100),
  pnl_realized DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics daily snapshots
CREATE TABLE public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  equity DECIMAL(15,2) NOT NULL,
  day_return DECIMAL(8,4),
  cumulative_return DECIMAL(8,4),
  drawdown DECIMAL(8,4),
  sharpe_ratio DECIMAL(8,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id, date)
);

-- Import jobs tracking
CREATE TABLE public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  broker_detected VARCHAR(50),
  broker_confidence INTEGER,
  status VARCHAR(20) DEFAULT 'ANALYZING',
  total_rows INTEGER,
  valid_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  imported_trades INTEGER DEFAULT 0,
  validation_results JSONB,
  processing_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Leaderboard entries
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  period VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'annual'
  total_pnl DECIMAL(15,2) NOT NULL,
  percentage_gain DECIMAL(8,4) NOT NULL,
  win_rate DECIMAL(5,2) NOT NULL,
  total_trades INTEGER NOT NULL,
  rank_position INTEGER,
  calculation_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period, calculation_date)
);

-- User settings
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'dark',
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Journal entries
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  title VARCHAR(255),
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  screenshots TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Essential Indexes:**
\`\`\`sql
-- Performance indexes
CREATE INDEX idx_trades_user_date ON public.trades(user_id, executed_at DESC);
CREATE INDEX idx_trades_portfolio ON public.trades(portfolio_id);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
CREATE INDEX idx_analytics_user_date ON public.analytics_daily(user_id, date DESC);
CREATE INDEX idx_leaderboard_period_rank ON public.leaderboard_entries(period, rank_position);
CREATE INDEX idx_import_jobs_user_status ON public.import_jobs(user_id, status);
CREATE INDEX idx_journal_user_date ON public.journal_entries(user_id, date DESC);
\`\`\`

### Row Level Security (RLS) Policies

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own portfolios" ON public.portfolios
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trades" ON public.trades
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON public.analytics_daily
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own import jobs" ON public.import_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Leaderboard is publicly readable but users can only update their own entries
CREATE POLICY "Leaderboard is publicly readable" ON public.leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can update own leaderboard entries" ON public.leaderboard_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own journal entries" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- Service role has full access for background jobs
CREATE POLICY "Service role full access" ON public.trades
  FOR ALL USING (auth.role() = 'service_role');
\`\`\`

### API Contracts (TypeScript Interfaces)

**Dashboard Data:**
\`\`\`typescript
interface DashboardOverview {
  portfolioValue: number;
  dayPnL: number;
  dayPnLPercentage: number;
  equityCurve: { date: string; value: number }[];
  recentTrades: {
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    pnl: number;
    executed_at: string;
  }[];
  riskMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
    var95: number;
  };
}
\`\`\`

**Trades API:**
\`\`\`typescript
interface TradesListRequest {
  cursor?: string;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  symbols?: string[];
  strategies?: string[];
  instruments?: string[];
  pnlMin?: number;
  pnlMax?: number;
}

interface TradesListResponse {
  trades: Trade[];
  nextCursor: string | null;
  total: number;
  hasMore: boolean;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  executed_at: string;
  fees: number;
  pnl_realized?: number;
  strategy?: string;
  notes?: string;
  tags: string[];
}
\`\`\`

**Import API:**
\`\`\`typescript
interface ImportAnalysisResponse {
  jobId: string;
  fileSummary: {
    name: string;
    size: number;
    rows: number;
    headers: string[];
  };
  brokerDetection: {
    broker: string | null;
    confidence: number;
    patternsMatched: string[];
  };
}

interface ImportStatusResponse {
  jobId: string;
  status: 'analyzing' | 'mapped' | 'validated' | 'importing' | 'completed' | 'failed';
  progress: number;
  validationSummary?: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
  errors?: ValidationError[];
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  issue: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  suggestion?: string;
}
\`\`\`

### CSV Import Mapping Configuration

**Required Canonical Fields:**
- `executed_at` (Date/Time of trade execution)
- `symbol` (Stock/Asset symbol)
- `side` ('BUY' or 'SELL')
- `quantity` (Number of shares/units)
- `price` (Execution price per unit)
- `fees` (Commission and fees)
- `instrument` ('STOCK', 'OPTION', 'CRYPTO', etc.)

**Broker Header Mappings:**

**Robinhood CSV Format:**
\`\`\`typescript
const robinhoodMapping = {
  "Date": "executed_at",
  "Instrument": "symbol", 
  "Side": "side",
  "Quantity": "quantity",
  "Price": "price",
  "Fees": "fees",
  "State": "status"
};
\`\`\`

**Webull CSV Format:**
\`\`\`typescript
const webullMapping = {
  "Time Executed": "executed_at",
  "Symbol": "symbol",
  "Action": "side", 
  "Quantity": "quantity",
  "Price": "price",
  "Commission": "fees",
  "Type": "instrument"
};
\`\`\`

**Validation Rules:**
\`\`\`typescript
const validationRules = {
  executed_at: {
    required: true,
    formats: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'],
    timezone: 'market' // Convert to market timezone
  },
  symbol: {
    required: true,
    transform: (value: string) => value.toUpperCase().trim(),
    validate: /^[A-Z]{1,5}$/
  },
  side: {
    required: true,
    values: ['BUY', 'SELL', 'Buy', 'Sell'],
    transform: (value: string) => value.toUpperCase()
  },
  quantity: {
    required: true,
    type: 'number',
    min: 0.00000001
  },
  price: {
    required: true,
    type: 'number',
    min: 0.01
  },
  fees: {
    required: false,
    type: 'number',
    min: 0,
    default: 0
  }
};
\`\`\`

### Per-Page Implementation Checklists

**Dashboard Page (`/dashboard`):**
\`\`\`typescript
// TODO: Wire these endpoints
// GET /api/dashboard/overview -> DashboardOverview
// GET /api/dashboard/alerts -> Alert[]

// Required state management:
// - Loading states for each data section
// - Error handling with retry functionality  
// - Real-time updates via WebSocket (optional)
// - Empty state when no trades exist

// Auth requirements:
// - Redirect to /auth/login if not authenticated
// - Show onboarding modal for new users
\`\`\`

**Trades Page (`/trades`):**
\`\`\`typescript
// TODO: Wire these endpoints
// GET /api/trades?filters -> TradesListResponse
// POST /api/trades/export -> CSV download
// DELETE /api/trades/:id -> success/error

// Required features:
// - Virtualized table for 10k+ rows performance
// - Advanced filtering with URL state persistence
// - CSV export respecting current filters
// - Bulk operations (delete, tag, etc.)
// - Real-time updates when new trades added
\`\`\`

**Analytics Page (`/analytics`):**
\`\`\`typescript
// TODO: Wire these endpoints  
// GET /api/analytics/performance?range=30d -> PerformanceData
// GET /api/analytics/attribution -> AttributionData
// GET /api/analytics/correlation -> CorrelationMatrix
// GET /api/analytics/drawdown -> DrawdownData

// Required features:
// - Interactive charts with zoom/brush
// - Benchmark overlay (SPY, QQQ, custom)
// - Filter drawer with date ranges
// - Export chart data functionality
\`\`\`

**Import Page (`/import`):**
\`\`\`typescript
// TODO: Wire these endpoints
// POST /api/import/analyze (multipart) -> ImportAnalysisResponse  
// POST /api/import/map-columns -> MappingResponse
// POST /api/import/validate -> ValidationResponse
// POST /api/import/execute -> ImportExecutionResponse
// GET /api/import/templates/:broker -> CSV download

// Required features:
// - 4-step wizard with progress tracking
// - File drag-and-drop with validation
// - Real-time validation feedback
// - Progress polling during import
// - Toast notifications for status updates
\`\`\`

### Authentication Flow (Supabase Auth)

**Client-Side Auth Setup:**
\`\`\`typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: { username }
    }
  })
  return { data, error }
}
\`\`\`

**Server-Side Auth:**
\`\`\`typescript
// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  return createServerComponentClient({ cookies })
}

// Middleware for protected routes
export const requireAuth = async () => {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/login')
  }
  
  return session
}
\`\`\`

### Vercel Deployment Configuration

**Build Settings:**
\`\`\`json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
\`\`\`

**next.config.js:**
\`\`\`javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
\`\`\`

**Vercel Functions (API Routes):**
\`\`\`typescript
// app/api/dashboard/overview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  
  // Get authenticated user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch dashboard data
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', session.user.id)
    .order('executed_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    portfolioValue: 125000,
    dayPnL: 2500,
    recentTrades: trades || []
  })
}
\`\`\`

### Local Development Setup

**Installation:**
\`\`\`bash
# Clone and install dependencies
git clone <your-repo>
cd riskr-platform
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
\`\`\`

**Development Scripts:**
\`\`\`json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate-types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts"
  }
}
\`\`\`

**Demo Mode (Mock Data):**
\`\`\`typescript
// lib/demo-data.ts - For showcasing without backend
export const DEMO_MODE = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SUPABASE_URL

export const mockDashboardData = {
  portfolioValue: 125000,
  dayPnL: 2500,
  equityCurve: generateMockEquityCurve(),
  recentTrades: generateMockTrades(10)
}
\`\`\`

This implementation guide provides everything needed to transform the UI into a fully functional trading platform with Supabase backend and Vercel deployment.
