# Riskr - Trading Analytics Platform

A comprehensive trading analytics platform built with Next.js, Supabase, and TypeScript. Features include trade tracking, performance analytics, CSV import, subscription management, and real-time KPI calculations.

## 🔒 Security First

**⚠️ IMPORTANT**: This project uses environment variables for sensitive data. Never commit actual API keys or secrets to version control.

- See [SECURITY.md](./SECURITY.md) for detailed security guidelines
- All environment variable names are defined in `src/lib/env-constants.ts`
- Use `.env.local` for local development (automatically ignored by git)
- The build process validates that no server secrets leak to the client bundle

## 🚀 Quick Start (Under 10 Minutes)

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for subscriptions)

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Environment Variables

Create `.env.local` with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration (for subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_BASIC=your_basic_price_id
STRIPE_PRICE_PRO=your_pro_price_id

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Run database migrations
npx supabase db push

# Or apply migrations manually
psql -h your_host -U your_user -d your_db -f supabase/migrations/20250101000001_initial_schema.sql
psql -h your_host -U your_user -d your_db -f supabase/migrations/20250101000002_bulletproof_import_system.sql
psql -h your_host -U your_user -d your_db -f supabase/migrations/20250101000003_subscription_system.sql
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

### 5. Test the Application

1. **Sign up** for a new account
2. **Import a sample CSV** (see CSV format below)
3. **View KPIs** on the dashboard
4. **Test premium features** (if subscription is configured)

## 📊 Sample CSV Format

Create a file called `sample-trades.csv` with the following format:

```csv
Symbol,Side,Quantity,Price,Date,Commission
AAPL,BUY,100,150.00,2024-01-01,1.00
MSFT,SELL,50,300.00,2024-01-02,1.50
GOOGL,BUY,25,2800.00,2024-01-03,2.00
```

## 🏗️ Architecture Overview

### Core Components

- **Frontend**: Next.js 14 with App Router
- **Backend**: Supabase (Database + Auth)
- **Payments**: Stripe integration
- **Deployment**: Vercel (recommended)

### Key Features

- ✅ **Authentication**: Supabase Auth with RLS
- ✅ **CSV Import**: Streaming parser with idempotency
- ✅ **Trade Matching**: Automated execution matching
- ✅ **KPI Calculation**: Real-time performance metrics
- ✅ **Subscription Management**: Stripe integration
- ✅ **Performance Optimization**: Virtualization for large datasets
- ✅ **Error Handling**: Comprehensive error boundaries

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── import/         # CSV import endpoints
│   │   ├── kpi/           # KPI calculation endpoints
│   │   ├── me/            # User data endpoints
│   │   └── webhooks/      # Webhook handlers
│   ├── dashboard/         # Dashboard pages
│   ├── trades/           # Trades pages
│   └── settings/         # Settings pages
├── src/
│   ├── components/       # React components
│   │   ├── trades/       # Trade-related components
│   │   ├── premium/      # Premium feature gates
│   │   ├── performance/  # Performance monitoring
│   │   └── ui/          # UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   │   ├── cache/       # Caching utilities
│   │   ├── supabase/    # Supabase client/server
│   │   └── auth/        # Authentication utilities
│   └── types/           # TypeScript type definitions
├── supabase/
│   └── migrations/       # Database migrations
├── tests/
│   └── e2e/             # End-to-end tests
└── docs/                # Documentation
```

## 🔧 Development Guide

### Adding a New Broker CSV Preset

1. **Create Preset Configuration**

```typescript
// src/lib/import/presets.ts
export const BROKER_PRESETS = {
  // ... existing presets
  newBroker: {
    name: 'New Broker',
    fields: {
      symbol: 'Ticker',
      side: 'Action',
      quantity: 'Shares',
      price: 'Price',
      date: 'Date',
      commission: 'Commission'
    },
    mappings: {
      side: {
        'Buy': 'BUY',
        'Sell': 'SELL'
      }
    },
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York'
  }
};
```

2. **Update Import Logic**

```typescript
// app/api/import/csv/route.ts
const preset = BROKER_PRESETS[brokerName];
if (preset) {
  const normalizedRow = normalizeWithPreset(row, preset);
  // ... rest of logic
}
```

3. **Add UI Selection**

```typescript
// src/components/import/CSVImporter.tsx
<Select value={selectedPreset} onValueChange={setSelectedPreset}>
  <SelectItem value="newBroker">New Broker</SelectItem>
</Select>
```

4. **Test the Preset**

```bash
# Create test CSV with new broker format
# Test import functionality
npm run test:e2e -- --grep "CSV import"
```

### Adding a New KPI (via DTO)

1. **Update KPI Types**

```typescript
// src/types/kpi.ts
export interface KPISummary {
  // ... existing fields
  newKpi: number;
  newKpiDescription: string;
}
```

2. **Update Server Calculation**

```typescript
// app/api/kpi/summary/route.ts
function calculateKPIs(trades: any[]): KPISummary {
  // ... existing calculations
  const newKpi = calculateNewKPI(trades);
  
  return {
    // ... existing fields
    newKpi,
    newKpiDescription: 'Description of new KPI'
  };
}

function calculateNewKPI(trades: any[]): number {
  // Implementation of new KPI calculation
  return trades.reduce((sum, trade) => sum + trade.newKpiValue, 0);
}
```

3. **Update Dashboard Display**

```typescript
// app/dashboard/dashboard-client.tsx
<Card>
  <CardHeader>
    <CardTitle>New KPI</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {analytics?.newKpi?.toFixed(2) || '0.00'}
    </div>
  </CardContent>
</Card>
```

4. **Update Cache Invalidation**

```typescript
// After any data change that affects KPIs
revalidateTag('kpi');
```

5. **Test the New KPI**

```bash
# Run tests to ensure KPI calculation works
npm run test -- --grep "KPI calculation"
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth.spec.ts       # Authentication tests
│   ├── import.spec.ts     # CSV import tests
│   ├── kpi.spec.ts        # KPI calculation tests
│   └── subscription.spec.ts # Subscription tests
├── unit/                  # Unit tests
│   ├── components/        # Component tests
│   ├── hooks/            # Hook tests
│   └── lib/              # Utility tests
└── fixtures/             # Test data
    ├── sample-trades.csv
    └── test-data.json
```

## 📚 Documentation

### Key Documentation Files

- **[Data Flows](docs/data-flows.md)** - Comprehensive flow diagrams
- **[API Reference](docs/api-reference.md)** - API endpoint documentation
- **[Database Schema](docs/database-schema.md)** - Database structure
- **[Deployment Guide](docs/deployment.md)** - Production deployment

### Understanding the System

1. **Start with [Data Flows](docs/data-flows.md)** to understand the overall architecture
2. **Review the [API Reference](docs/api-reference.md)** for endpoint details
3. **Check [Database Schema](docs/database-schema.md)** for data structure
4. **Follow [Deployment Guide](docs/deployment.md)** for production setup

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Set up Supabase project
   - Configure Stripe webhooks

3. **Database Setup**
   ```bash
   # Run migrations in production
   npx supabase db push --project-ref your-project-ref
   ```

### Other Platforms

- **Netlify**: Similar to Vercel, supports Next.js
- **Railway**: Good for full-stack deployment
- **AWS**: Use Amplify or custom setup

## 🔒 Security

### Authentication
- Supabase Auth with RLS policies
- JWT token validation
- Session management

### Data Protection
- Row Level Security (RLS) enabled
- User-specific data access
- Secure API endpoints

### API Security
- Rate limiting on API routes
- Input validation with Zod
- Error handling without data leakage

## 📈 Performance

### Optimization Features
- **Virtualization**: For large datasets (>200 items)
- **Server-side Processing**: Filtering and sorting
- **Intelligent Caching**: Stable data cached longer
- **Performance Monitoring**: Real-time metrics

### Performance Targets
- **Initial Load**: < 2 seconds
- **Filter Response**: < 500ms
- **Sort Response**: < 300ms
- **Memory Usage**: < 100MB for 10k+ items

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables**
   ```bash
   # Check if all required variables are set
   npm run check-env
   ```

2. **Database Connection**
   ```bash
   # Test Supabase connection
   npm run test:db
   ```

3. **Import Issues**
   ```bash
   # Check CSV format
   npm run test:import
   ```

4. **Performance Issues**
   ```bash
   # Run performance tests
   npm run test:performance
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific components
DEBUG=app:api npm run dev
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new features**
5. **Update documentation**
6. **Submit a pull request**

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Code formatting
- **Testing**: Jest + Playwright

### Pull Request Process

1. **Tests must pass**
2. **Documentation updated**
3. **Code reviewed**
4. **Performance tested**

## 📞 Support

### Getting Help

- **Documentation**: Check the docs folder
- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Email**: support@riskr.net

### Reporting Issues

When reporting issues, please include:

1. **Environment details** (Node.js version, OS)
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Error messages/logs**
5. **Screenshots** (if applicable)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend as a Service
- **Stripe** - Payment processing
- **Vercel** - Deployment platform
- **React Window** - Virtualization library

---

*Last updated: 2025-09-27*
*Version: 1.0.0*

