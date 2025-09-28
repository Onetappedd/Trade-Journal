# Canonical KPI System

## Overview
A robust, server-side KPI calculation system that provides stable DTOs for frontend consumption, eliminating client-side computations and ensuring data consistency.

## Key Features

### 🎯 **Canonical DTOs**
- **Stable Types**: `src/types/kpi.ts` defines immutable KPI interfaces
- **Versioned Schema**: Backward-compatible type definitions
- **Type Safety**: Full TypeScript support for all KPI fields

### 🖥️ **Server-Side Calculation**
- **No Client Computation**: All KPIs calculated server-side
- **Single Source of Truth**: `/api/kpi/summary` endpoint
- **Cached Results**: Performance optimization with Next.js cache
- **Real-time Updates**: Cache invalidation after data changes

### 🔄 **Cache Management**
- **Tag-based Invalidation**: `revalidateTag('kpi')` after imports
- **Automatic Refresh**: KPIs update after import completion
- **Performance**: 5-minute cache TTL with stale-while-revalidate

## Architecture

### 1. **Type Definitions** (`src/types/kpi.ts`)

```typescript
interface KPISummary {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  sharpe: number;
  period: { start: string; end: string };
  realizedPnl: number;
  unrealizedPnl: number;
  maxDrawdown: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalVolume: number;
  lastUpdated: string;
  calculationMethod: 'server';
}
```

### 2. **KPI API** (`/api/kpi/summary`)

**Features:**
- Server-side KPI calculation
- Cached results with tag-based invalidation
- Support for different time periods
- Filtering by asset type and symbol
- Comprehensive error handling

**Query Parameters:**
- `period`: 'all' | 'ytd' | 'mtd' | '30d' | '90d' | '1y'
- `assetType`: 'all' | 'equity' | 'option' | 'crypto' | 'forex'
- `symbol`: Specific symbol filter

### 3. **Dashboard Integration**

**Before (Client-side computation):**
```typescript
// ❌ Old way - client-side calculation
const analytics = await fetch('/api/portfolio/analytics');
// Heavy computation in browser
```

**After (Server-side DTOs):**
```typescript
// ✅ New way - canonical DTOs
const kpiData = await fetch('/api/kpi/summary');
// Pre-calculated server-side KPIs
```

## KPI Calculations

### **Total P&L**
```typescript
const totalPnl = realizedPnl + unrealizedPnl;
```

### **Win Rate**
```typescript
const winRate = (winningTrades / totalClosedTrades) * 100;
```

### **Sharpe Ratio**
```typescript
const sharpe = avgReturn / stdDeviation;
```

### **Max Drawdown**
```typescript
const maxDrawdown = Math.max(peak - currentValue);
```

### **Profit Factor**
```typescript
const profitFactor = totalWins / totalLosses;
```

## Cache Strategy

### **Cache Tags**
- `kpi`: Main KPI cache tag
- Invalidated after import completion
- Invalidated after matching completion

### **Cache Configuration**
```typescript
{
  tags: ['kpi'],
  revalidate: 300, // 5 minutes
  swr: true // Stale-while-revalidate
}
```

### **Invalidation Points**
1. **Import Completion**: `revalidateTag('kpi')` in CSV import
2. **Matching Completion**: `revalidateTag('kpi')` in matching process
3. **Manual Refresh**: Dashboard refresh button

## Database Schema

### **Required Tables**
- `trades`: Core trade data
- `executions_normalized`: Matched executions
- `import_runs`: Import tracking
- `matching_jobs`: Matching job tracking

### **Required Fields**
```sql
-- Trades table
ALTER TABLE trades ADD COLUMN pnl DECIMAL;
ALTER TABLE trades ADD COLUMN status TEXT;
ALTER TABLE trades ADD COLUMN opened_at TIMESTAMP;
ALTER TABLE trades ADD COLUMN closed_at TIMESTAMP;

-- Executions table
CREATE TABLE executions_normalized (
  user_id UUID,
  symbol TEXT,
  side TEXT,
  quantity DECIMAL,
  price DECIMAL,
  executed_at TIMESTAMP
);
```

## Performance Optimizations

### **Server-Side**
- **Cached Calculations**: 5-minute cache TTL
- **Efficient Queries**: Indexed database queries
- **Batch Processing**: Chunked data processing
- **Memory Management**: Streaming for large datasets

### **Client-Side**
- **No Computation**: Zero client-side calculations
- **Fast Loading**: Pre-calculated server data
- **Type Safety**: TypeScript interfaces
- **Error Handling**: Graceful fallbacks

## Error Handling

### **API Errors**
- **Authentication**: 401 for invalid tokens
- **Authorization**: 403 for insufficient permissions
- **Validation**: 400 for invalid parameters
- **Server Errors**: 500 with detailed messages

### **Client Errors**
- **Network Issues**: Retry with exponential backoff
- **Data Validation**: Type checking and fallbacks
- **UI States**: Loading, error, and success states

## Testing

### **Unit Tests**
- KPI calculation functions
- Cache invalidation logic
- Error handling scenarios
- Type validation

### **Integration Tests**
- API endpoint testing
- Database integration
- Cache behavior
- Import flow integration

### **E2E Tests**
- Dashboard KPI display
- Import-triggered refresh
- Error state handling
- Performance validation

## Migration Guide

### **From Client-Side to Server-Side**

1. **Remove Client Calculations**
   ```typescript
   // ❌ Remove this
   const calculatedPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
   ```

2. **Use Canonical API**
   ```typescript
   // ✅ Use this
   const response = await fetch('/api/kpi/summary');
   const kpiData = await response.json();
   ```

3. **Update Type Definitions**
   ```typescript
   // ❌ Old interface
   interface TradeAnalytics { totalPnL: number; }
   
   // ✅ New interface
   import { KPISummary } from '@/src/types/kpi';
   ```

### **Database Changes**
- No breaking changes required
- Existing data remains compatible
- New fields are optional

## Monitoring

### **Metrics Tracked**
- KPI calculation time
- Cache hit/miss rates
- API response times
- Error frequencies
- Data freshness

### **Alerts**
- KPI calculation failures
- Cache invalidation issues
- Performance degradation
- Data inconsistencies

## Future Enhancements

### **Planned Features**
- **Real-time Updates**: WebSocket-based KPI updates
- **Advanced Caching**: Redis-based distributed cache
- **ML Integration**: AI-powered KPI insights
- **Custom Periods**: User-defined time ranges
- **Export Functionality**: KPI data export

### **Scalability**
- **Horizontal Scaling**: Multi-instance KPI calculation
- **Database Sharding**: Partitioned KPI data
- **CDN Integration**: Global KPI data distribution
- **Background Jobs**: Async KPI processing

---

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Database Migrations**
   ```bash
   npx supabase db push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Test KPI System**
   - Navigate to `/dashboard`
   - Verify KPI data loads
   - Test import-triggered refresh
   - Check error handling

## Support

For issues or questions:
- Check the troubleshooting guide
- Review error logs
- Contact support team
- Submit bug reports

---

*Last updated: 2025-09-27*
*Version: 1.0.0*

