# Quick Start Guide for New Contributors

This guide will get you up and running with the trading journal application in under 10 minutes.

## 🚀 10-Minute Setup

### Step 1: Prerequisites (2 minutes)

```bash
# Check Node.js version (18+ required)
node --version

# Install dependencies
npm install

# Verify installation
npm run check-deps
```

### Step 2: Environment Setup (3 minutes)

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local
```

**Required Environment Variables:**
```bash
# Supabase (get from https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (get from https://stripe.com) - Optional for basic testing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Database Setup (2 minutes)

```bash
# Option 1: Use Supabase CLI (recommended)
npx supabase db push

# Option 2: Manual SQL execution
# Run the SQL files in supabase/migrations/ in order
```

### Step 4: Start Development Server (1 minute)

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

### Step 5: Test the Application (2 minutes)

1. **Sign up** for a new account at http://localhost:3000
2. **Create sample CSV** (see below)
3. **Import CSV** and see KPIs on dashboard

## 📊 Sample CSV for Testing

Create a file called `test-trades.csv`:

```csv
Symbol,Side,Quantity,Price,Date,Commission
AAPL,BUY,100,150.00,2024-01-01,1.00
MSFT,SELL,50,300.00,2024-01-02,1.50
GOOGL,BUY,25,2800.00,2024-01-03,2.00
TSLA,SELL,10,250.00,2024-01-04,1.25
```

## 🧪 Quick Test Scenarios

### Test 1: Basic Import Flow
1. Go to `/import`
2. Upload `test-trades.csv`
3. Verify trades appear in `/trades`
4. Check KPIs on `/dashboard`

### Test 2: Performance with Large Dataset
1. Go to `/test-performance`
2. Enable performance monitoring
3. Test with simulated large dataset
4. Verify virtualization works

### Test 3: Error Handling
1. Go to `/test-errors`
2. Test different error scenarios
3. Verify error boundaries work
4. Check toast notifications

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests
npm run test:all        # Run all tests

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript check
npm run format          # Format code with Prettier

# Database
npm run db:push         # Push migrations
npm run db:reset        # Reset database
npm run db:seed         # Seed with test data
```

## 📁 Key Files to Know

### Configuration
- `.env.local` - Environment variables
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration

### Core Application
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `middleware.ts` - Route protection

### API Routes
- `app/api/import/csv/route.ts` - CSV import
- `app/api/kpi/summary/route.ts` - KPI calculation
- `app/api/me/subscription/route.ts` - Subscription status

### Components
- `src/components/trades/VirtualizedTradesTable.tsx` - Main trades table
- `src/components/premium/PremiumGate.tsx` - Premium feature gating
- `src/components/performance/PerformanceMonitor.tsx` - Performance monitoring

### Utilities
- `src/lib/supabase/client.ts` - Supabase client
- `src/lib/supabase/server.ts` - Supabase server
- `src/lib/cache/apiCache.ts` - Caching utilities

## 🐛 Common Issues & Solutions

### Issue: "Module not found" errors
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection errors
```bash
# Solution: Check environment variables
npm run check-env

# Verify Supabase connection
npm run test:db
```

### Issue: Import not working
```bash
# Solution: Check CSV format
# Ensure headers match expected format
# Check file size (max 50MB)
```

### Issue: Performance issues
```bash
# Solution: Enable performance monitoring
# Go to /test-performance
# Check render times and memory usage
```

## 🎯 Next Steps

### For New Contributors

1. **Read the [Data Flows](data-flows.md)** to understand the system
2. **Check [API Reference](api-reference.md)** for endpoint details
3. **Review [Database Schema](database-schema.md)** for data structure
4. **Follow [Contributing Guide](contributing.md)** for development workflow

### For Feature Development

1. **Create feature branch** from main
2. **Add tests** for new functionality
3. **Update documentation** as needed
4. **Submit pull request** with description

### For Bug Fixes

1. **Reproduce the issue** locally
2. **Write test** that fails
3. **Fix the issue** in code
4. **Verify test passes**
5. **Submit pull request**

## 📚 Additional Resources

- **[Data Flows](data-flows.md)** - System architecture diagrams
- **[API Reference](api-reference.md)** - Endpoint documentation
- **[Database Schema](database-schema.md)** - Data structure
- **[Performance Guide](performance.md)** - Optimization strategies
- **[Testing Guide](testing.md)** - Testing best practices

## 🆘 Getting Help

### Documentation
- Check the `docs/` folder for detailed guides
- Review inline code comments
- Look at existing tests for examples

### Community
- GitHub Issues for bugs
- GitHub Discussions for questions
- Pull requests for code reviews

### Support
- Check troubleshooting section above
- Review error logs in browser console
- Test with minimal setup first

---

*This guide should get you up and running in under 10 minutes. For more detailed information, check the other documentation files.*
