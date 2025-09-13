# RiskR - Trading Journal & Analytics Platform

A comprehensive trading journal and analytics platform built with Next.js 14, TypeScript, and Tailwind CSS. Track your trades, analyze performance, and improve your trading strategy with advanced analytics and risk management tools.

## ✨ Features

### 📊 Core Trading Features
- **Portfolio Management** - Multiple portfolio support with real-time tracking
- **Trade Journal** - Comprehensive trade logging with notes and screenshots
- **Performance Analytics** - Advanced metrics including Sharpe ratio, max drawdown, and risk analysis
- **P&L Calendar** - Visual calendar view of daily profits and losses
- **Import System** - 4-step CSV import wizard with broker detection and validation

### 🎯 Advanced Analytics
- **Risk Metrics** - VaR, beta, correlation analysis, and volatility tracking
- **Performance Attribution** - Sector and strategy-based performance breakdown
- **Benchmark Comparison** - Compare against S&P 500 and custom benchmarks
- **Drawdown Analysis** - Detailed drawdown periods and recovery tracking

### 🏆 Community Features
- **Leaderboard** - Weekly, monthly, and annual rankings
- **Social Trading** - Share insights and learn from top performers
- **Achievement System** - Unlock badges and milestones

### 🔧 User Experience
- **Dark/Light Theme** - Customizable interface themes
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Real-time Updates** - Live portfolio values and market data
- **Advanced Filtering** - Powerful search and filter capabilities

## 🤖 AI Assistant Implementation Guide

This section provides specific guidance for AI assistants working with the RiskR codebase.

#### Architecture Patterns
- **Next.js 14 App Router** - All routes use the new app directory structure
- **Server/Client Components** - Clear separation with 'use client' directives
- **TypeScript First** - Strict typing throughout the application
- **Component Composition** - Reusable components in `/components` directory

#### Key Implementation Details

**Authentication Flow:**
\`\`\`typescript
// All auth pages use this pattern:
// 1. Form validation with react-hook-form
// 2. Supabase auth integration
// 3. Error handling with toast notifications
// 4. Loading states with disabled buttons
// 5. Redirect handling after success
\`\`\`

**Database Integration:**
\`\`\`typescript
// Supabase client pattern used throughout:
// 1. createBrowserClient for client components
// 2. createServerClient for server components  
// 3. Row Level Security (RLS) enabled on all tables
// 4. TypeScript types generated from database schema
\`\`\`

**Component Structure:**
\`\`\`typescript
// Standard component pattern:
// 1. Import statements (React, Next.js, UI components)
// 2. TypeScript interface definitions
// 3. Component function with proper typing
// 4. Export default at bottom
\`\`\`

**Styling Approach:**
\`\`\`css
/* Tailwind CSS patterns used:
 * 1. Dark theme first (slate-950 backgrounds)
 * 2. Emerald primary colors (emerald-500/600)
 * 3. Consistent spacing (p-4, p-6, p-8)
 * 4. Responsive design (md:, lg: prefixes)
 */
\`\`\`

#### File Naming Conventions
- **Pages**: `page.tsx` in app directory folders
- **Components**: `kebab-case.tsx` (e.g., `trade-history.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatCurrency.ts`)
- **Types**: `PascalCase.ts` (e.g., `TradeTypes.ts`)

#### State Management Patterns
- **React Query** - Server state management with caching
- **React Hook Form** - Form state and validation
- **Local State** - useState for component-specific state
- **Context** - Theme and auth context providers

#### Error Handling
- **Toast Notifications** - Using Sonner for user feedback
- **Error Boundaries** - React error boundaries for crash recovery
- **Form Validation** - Client-side validation with server-side backup
- **API Error Handling** - Consistent error response format

#### Testing Strategy
- **Unit Tests** - Jest and React Testing Library
- **Integration Tests** - API route testing
- **E2E Tests** - Playwright for critical user flows
- **Type Safety** - TypeScript strict mode enabled

#### Performance Optimizations
- **Image Optimization** - Next.js Image component usage
- **Code Splitting** - Dynamic imports for heavy components
- **Caching** - React Query for data caching
- **Bundle Analysis** - Regular bundle size monitoring

#### Security Considerations
- **Row Level Security** - Database-level access control
- **Input Sanitization** - All user inputs validated and sanitized
- **CSRF Protection** - Built-in Next.js CSRF protection
- **Environment Variables** - Sensitive data in environment variables only

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/riskr.git
   cd riskr
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   \`\`\`bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Site Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
   
   # Optional: Third-party Services
   STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ENCRYPTION_KEY=your_32_character_encryption_key
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Supabase Configuration

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database migrations** (SQL scripts provided in `/scripts` folder):
   \`\`\`sql
   -- Users table with profile information
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     username VARCHAR(100) UNIQUE NOT NULL,
     full_name VARCHAR(255),
     avatar_url VARCHAR(500),
     subscription_tier VARCHAR(20) DEFAULT 'free',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Portfolios for multi-portfolio support
   CREATE TABLE portfolios (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Trades table with comprehensive trade data
   CREATE TABLE trades (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
     symbol VARCHAR(20) NOT NULL,
     side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
     quantity DECIMAL(15,8) NOT NULL,
     price DECIMAL(15,8) NOT NULL,
     executed_at TIMESTAMP NOT NULL,
     pnl DECIMAL(15,2),
     fees DECIMAL(15,2) DEFAULT 0,
     notes TEXT,
     tags TEXT[],
     broker VARCHAR(100),
     strategy VARCHAR(100),
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Journal entries for trade notes and analysis
   CREATE TABLE journal_entries (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
     title VARCHAR(255) NOT NULL,
     content TEXT NOT NULL,
     mood VARCHAR(20),
     lessons_learned TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Import sessions for tracking CSV imports
   CREATE TABLE import_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     filename VARCHAR(255) NOT NULL,
     status VARCHAR(20) DEFAULT 'pending',
     total_rows INTEGER,
     processed_rows INTEGER DEFAULT 0,
     errors JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   \`\`\`

3. **Enable Row Level Security (RLS)**
   \`\`\`sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
   ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
   ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
   ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
   
   -- Users can only access their own data
   CREATE POLICY "Users can view own profile" ON users
     FOR ALL USING (auth.uid() = id);
   
   CREATE POLICY "Users can manage own portfolios" ON portfolios
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can manage own trades" ON trades
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can manage own journal entries" ON journal_entries
     FOR ALL USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can manage own import sessions" ON import_sessions
     FOR ALL USING (auth.uid() = user_id);
   \`\`\`

4. **Configure Authentication**
   - Enable Email/Password authentication
   - Configure OAuth providers (Google, GitHub, etc.)
   - Set up email templates for verification and password reset

## 📁 Project Structure

\`\`\`
riskr/
├── app/                          # Next.js 14 App Router
│   ├── auth/                     # Authentication routes
│   │   ├── signin/               # Sign in page with Google OAuth
│   │   ├── signup/               # Sign up page (requires username)
│   │   └── reset/                # Password reset page
│   ├── dashboard/                # Main dashboard with portfolio overview
│   ├── analytics/                # Performance analytics and charts
│   ├── trades/                   # Trade history with filtering
│   ├── import/                   # 4-step CSV import wizard
│   ├── settings/                 # User settings and preferences
│   ├── leaderboard/              # Community rankings and social features
│   ├── journal/                  # Trade journal with notes
│   ├── calendar/                 # P&L calendar visualization
│   ├── subscriptions/            # Billing and subscription management
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page with marketing content
│   ├── globals.css               # Global styles and Tailwind config
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 page
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   ├── charts/                   # Chart components using Recharts
│   ├── forms/                    # Form components with validation
│   ├── layout/                   # Layout components (headers, sidebars)
│   ├── onboarding-modal.tsx      # First-time user onboarding
│   ├── unified-header.tsx        # Main navigation header
│   ├── conditional-layout.tsx    # Layout logic for different pages
│   └── query-provider.tsx        # React Query configuration
├── lib/                          # Utility functions and configurations
│   ├── supabase/                 # Supabase client configuration
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── utils.ts                  # Helper functions (cn, formatters)
│   ├── notifications.ts          # Toast notification system
│   └── validations.ts            # Form validation schemas
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx            # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Supabase generated types
│   └── index.ts                  # Application-specific types
├── scripts/                      # Database scripts and utilities
│   └── migrations/               # SQL migration files
└── public/                       # Static assets
    ├── images/                   # Application images
    └── icons/                    # Icon files
\`\`\`

## 🔧 Implementation Patterns

### Component Development
\`\`\`typescript
// Standard component template:
'use client' // Only if client-side features needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ComponentProps {
  title: string
  data?: any[]
  onAction?: () => void
}

export default function ComponentName({ title, data, onAction }: ComponentProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      await onAction?.()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
        <Button onClick={handleAction} disabled={loading}>
          {loading ? 'Loading...' : 'Action'}
        </Button>
      </CardContent>
    </Card>
  )
}
\`\`\`

### API Route Pattern
\`\`\`typescript
// app/api/example/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // API logic here
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
\`\`\`

### Database Query Pattern
\`\`\`typescript
// Client-side data fetching with React Query
import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'

export function useTradeData() {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('executed_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
\`\`\`

## 🔐 Authentication

The app includes a complete authentication system:

### Sign Up Process
- **Username requirement** - Users must choose a unique username
- **Email verification** - Email confirmation required
- **Password validation** - Strong password requirements
- **OAuth integration** - Google sign-in support
- **Terms acceptance** - Users must accept terms and privacy policy

### Sign In Options
- Email/password authentication
- Google OAuth
- Password reset functionality
- Remember me option

## 📊 Key Components

### Dashboard
- Portfolio overview cards
- Performance charts (equity curve, daily P&L)
- Recent trades table
- Risk metrics summary
- Market alerts

### Analytics
- Performance metrics (returns, Sharpe ratio, max drawdown)
- Risk analysis (VaR, beta, correlation)
- Sector allocation charts
- Strategy performance breakdown
- Benchmark comparison

### Trade Management
- Comprehensive trade logging
- Advanced filtering and search
- Bulk import from CSV files
- Trade notes and screenshots
- P&L calculations

### Import System
- 4-step import wizard
- Automatic broker detection
- Column mapping interface
- Data validation and error handling
- Progress tracking

## 🎨 Design System

### Color Palette
- **Primary**: Emerald (emerald-500, emerald-600)
- **Background**: Slate (slate-950, slate-900)
- **Text**: White, slate-400, slate-300
- **Accents**: Blue, amber for data visualization

### Typography
- **Headings**: Inter font family, various weights
- **Body**: Inter font family, regular weight
- **Code**: JetBrains Mono for monospace text

### Components
- Built with shadcn/ui component library
- Consistent spacing using Tailwind CSS
- Dark theme optimized
- Responsive design patterns

## 🚀 Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployments on push to main branch

### Environment Variables for Production
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
\`\`\`

## 📈 Performance

### Optimization Features
- **Image optimization** - Next.js automatic image optimization
- **Code splitting** - Automatic route-based code splitting
- **Caching** - Aggressive caching for static assets
- **Database indexing** - Optimized database queries
- **Lazy loading** - Components loaded on demand

### Monitoring
- **Core Web Vitals** tracking
- **Error monitoring** with Sentry integration
- **Performance analytics** with Vercel Analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.riskr.app](https://docs.riskr.app)
- **Issues**: [GitHub Issues](https://github.com/yourusername/riskr/issues)
- **Discord**: [Join our community](https://discord.gg/riskr)
- **Email**: support@riskr.app

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Recharts](https://recharts.org/) - Chart library
- [Lucide](https://lucide.dev/) - Icon library

---

**Built with ❤️ by the RiskR team**
