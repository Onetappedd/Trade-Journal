# SnapTrade Integration - Complete Guide

## 📚 Documentation Index

Welcome to the complete SnapTrade broker integration documentation. This guide covers everything from setup to production deployment.

---

## 🚀 Quick Start

1. **[Setup Guide](./SNAPTRADE_COMPLETE_SETUP.md)** - Environment setup, database schema, API routes
2. **[Security Guide](./SNAPTRADE_SECURITY_GUIDE.md)** - ⚠️ **READ THIS FIRST** - Critical security rules
3. **[CLI Guide](./SNAPTRADE_CLI_GUIDE.md)** - Quick testing without UI

---

## 📖 Complete Documentation

### Core Integration
- **[Complete Setup](./SNAPTRADE_COMPLETE_SETUP.md)** - Installation, database, API routes, webhooks
- **[Security & Best Practices](./SNAPTRADE_SECURITY_GUIDE.md)** - Critical security rules, gotchas, common mistakes

### Frontend Components
- **[UX Guide](./SNAPTRADE_UX_GUIDE.md)** - Connection flow, badge, UI components
- **[Refresh Guide](./SNAPTRADE_REFRESH_GUIDE.md)** - Daily sync, manual refresh, status indicators

### Analytics
- **[Analytics Guide](./SNAPTRADE_ANALYTICS_GUIDE.md)** - Equity curve, allocation, performance metrics

### Development
- **[CLI Guide](./SNAPTRADE_CLI_GUIDE.md)** - Command-line tools for testing
- **[Complete Integration Summary](./SNAPTRADE_COMPLETE_INTEGRATION.md)** - Full feature overview

---

## ⚡ 5-Minute Quickstart

### 1. Install Dependencies

```bash
npm install snaptrade-typescript-sdk snaptrade-react zod
```

### 2. Set Environment Variables

```env
SNAPTRADE_CLIENT_ID=your_client_id
SNAPTRADE_CONSUMER_KEY=your_consumer_key  # ⚠️ NEVER expose to browser
SNAPTRADE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ NEVER expose to browser
```

### 3. Run Database Migrations

```sql
-- In Supabase SQL editor:
-- 1. Run setup-snaptrade-schema-final.sql
-- 2. Run setup-analytics-tables.sql
-- 3. Run add-sync-helper-function.sql
```

### 4. Test with CLI

```bash
# Register user
npm run snaptrade:register test-user-123

# Open connection portal
npm run snaptrade:portal test-user-123

# Sync data
npm run snaptrade:sync test-user-123

# View accounts
npm run snaptrade:accounts test-user-123
```

### 5. Add to UI

```tsx
import ConnectBrokerButton from '@/components/snaptrade/ConnectBrokerButton';
import { BrokerVerifiedBadge } from '@/components/snaptrade/BrokerVerifiedBadge';

<ConnectBrokerButton userId={user.id} />
<BrokerVerifiedBadge userId={user.id} />
```

---

## 🔒 Critical Security Rules

⚠️ **MUST READ:** [Security Guide](./SNAPTRADE_SECURITY_GUIDE.md)

### Never Do This

❌ **NEVER expose secrets to browser:**
```typescript
// ❌ WRONG
const { consumerKey, userSecret } = await getSecrets();
```

❌ **NEVER cache portal URLs:**
```typescript
// ❌ WRONG - URLs expire in 5 minutes
const [portalUrl] = useState(url);
```

❌ **NEVER show badge without 72-hour check:**
```typescript
// ❌ WRONG - Must check sync age
{hasConnection && <Badge />}
```

### Always Do This

✅ **Keep secrets server-only:**
```typescript
// ✅ CORRECT - Server route only
const response = await snaptrade.authentication.loginSnapTradeUser({
  userId, userSecret
});
```

✅ **Generate portal URLs on-demand:**
```typescript
// ✅ CORRECT - Fresh URL every time
async function handleConnect() {
  const { redirectURI } = await fetch('/api/snaptrade/login-link', {
    method: 'POST',
    body: JSON.stringify({ riskrUserId: user.id })
  }).then(r => r.json());
  
  window.open(redirectURI, '_blank');
}
```

✅ **Verify badge logic:**
```typescript
// ✅ CORRECT - Check active + recent sync
is_verified = connection.active && 
              connection.last_sync > (now - 72 hours)
```

---

## 📦 What's Included

### Backend (API Routes)
- ✅ `/api/snaptrade/register` - Register SnapTrade user
- ✅ `/api/snaptrade/login-link` - Generate connection portal URL
- ✅ `/api/snaptrade/sync` - Sync connections & accounts
- ✅ `/api/snaptrade/refresh` - Manual refresh connection
- ✅ `/api/snaptrade/webhook` - Handle SnapTrade events
- ✅ `/api/snaptrade/verification` - Check broker verification
- ✅ `/api/snaptrade/analytics/*` - Equity, allocation, performance
- ✅ `/api/cron/snapshots` - Daily snapshot job

### Frontend (Components)
- ✅ `ConnectBrokerButton` - Connection flow (new window)
- ✅ `ConnectBrokerModal` - Connection flow (iframe)
- ✅ `BrokerVerifiedBadge` - Verification status badge
- ✅ `RefreshConnectionButton` - Manual refresh with warning
- ✅ `SyncStatusIndicator` - Freshness indicator
- ✅ `EquityCurveChart` - Portfolio value over time
- ✅ `AllocationPieChart` - Asset distribution
- ✅ `PerformanceMetrics` - Win rate, R:R, P&L
- ✅ `AnalyticsDashboard` - Complete analytics page

### CLI Tools
- ✅ `npm run snaptrade:register` - Register user
- ✅ `npm run snaptrade:portal` - Open portal
- ✅ `npm run snaptrade:sync` - Sync data
- ✅ `npm run snaptrade:connections` - List connections
- ✅ `npm run snaptrade:accounts` - List accounts
- ✅ `npm run snaptrade:positions` - List positions
- ✅ `npm run snaptrade:snapshot` - Take snapshot
- ✅ `npm run snaptrade:test-flow` - Interactive test

### Database
- ✅ `snaptrade_users` - User credentials (server-only)
- ✅ `snaptrade_connections` - Broker connections
- ✅ `snaptrade_accounts` - Brokerage accounts
- ✅ `account_value_snapshots` - Daily snapshots
- ✅ `user_broker_verification` - Verification view

---

## 🔄 Core Flows

### Initial Connection
```
User → Connect Button → Portal URL → Browser → Broker Auth → 
Webhook → Database → Badge Appears ✅
```

### Daily Sync
```
Midnight → Cron Job → SnapTrade Syncs → Webhook → 
Database Update → Snapshot Taken → Analytics Updated
```

### Manual Refresh
```
User → Refresh Button → Warning Dialog → Confirm → 
API Call → SnapTrade Pulls → Webhook → 
Database Update → UI Refreshes
```

### Badge Logic
```
Active Connection? ✅
Not Disabled? ✅
Synced < 72 hours? ✅
→ Show Badge
```

---

## 📊 Analytics Features

### Day 1 MVP
- ✅ **Equity Curve** - Total portfolio value over time
- ✅ **Allocation** - Asset type distribution + top positions
- ✅ **Performance** - Win rate, R:R, profit factor
- ✅ **FIFO Matching** - Accurate P&L calculation
- ✅ **Daily Snapshots** - Automated data collection

### Metrics Calculated
- Win Rate: `(Wins / Total Trades) × 100`
- Avg R:R: `Avg Win / Avg Loss`
- Profit Factor: `Total Wins / Total Losses`
- Unrealized P&L: `Market Value - Cost Basis`

---

## 🧪 Testing

### CLI Testing (No UI Needed)
```bash
npm run snaptrade:test-flow
```

### Component Testing
```tsx
import { BrokerVerifiedBadge } from '@/components/snaptrade/BrokerVerifiedBadge';

// Should show badge
<BrokerVerifiedBadge userId="user-with-active-connection" />

// Should NOT show badge
<BrokerVerifiedBadge userId="user-without-connection" />
```

### Security Testing
```bash
# 1. Open browser DevTools → Network tab
# 2. Connect broker
# 3. Verify NO secrets visible in requests
# 4. Check localStorage - NO secrets stored
```

---

## 🚨 Common Gotchas

### 1. Portal URL Expires

**Problem:** URL expires in ~5 minutes

**Solution:** Generate on-demand, not in advance
```typescript
// ✅ Generate right before opening
async function connect() {
  const url = await generateUrl();
  window.open(url);
}
```

### 2. Badge Shows When It Shouldn't

**Problem:** Badge shows for broken/stale connections

**Solution:** Check 72-hour rule
```sql
-- Use the view
SELECT is_broker_verified 
FROM user_broker_verification 
WHERE user_id = ?
```

### 3. Secrets in Browser

**Problem:** `consumerKey` or `userSecret` visible in Network tab

**Solution:** All SnapTrade calls via server routes
```typescript
// ✅ Server route
export async function POST(req: Request) {
  const { data } = await snaptrade.connections.list({
    userId, userSecret  // Server-only
  });
  return NextResponse.json({ data });
}
```

### 4. Polling Instead of Webhooks

**Problem:** Polling 1000 users every minute = 1000 API calls

**Solution:** Use webhooks for instant updates
```typescript
// ❌ Don't poll in production
setInterval(() => sync(), 60000);

// ✅ Use webhooks
// Webhook endpoint handles updates automatically
```

---

## 📈 Scaling Considerations

### Phase 1: MVP (0-100 users)
- ✅ Webhooks for real-time updates
- ✅ Daily snapshots via cron
- ✅ Client queries protected by RLS

### Phase 2: Growth (100-1K users)
- ✅ Cache performance metrics in database
- ✅ Use Redis for verification status
- ✅ Paginate account/position lists

### Phase 3: Scale (1K+ users)
- ✅ Background jobs for heavy calculations
- ✅ CDN for analytics charts
- ✅ Batch webhook processing
- ✅ Rate limit API endpoints

---

## 🎯 Production Checklist

### Security
- [ ] ✅ Secrets are server-only (never exposed to browser)
- [ ] ✅ Webhook signature verification enabled
- [ ] ✅ RLS policies on all tables
- [ ] ✅ Cron endpoints require authentication
- [ ] ✅ API routes verify user ownership

### Functionality
- [ ] ✅ Portal URLs generated on-demand
- [ ] ✅ Badge checks 72-hour rule
- [ ] ✅ CONNECTION_BROKEN handled correctly
- [ ] ✅ Reconnection flow works
- [ ] ✅ Daily snapshots running

### Testing
- [ ] ✅ Test expired portal URL
- [ ] ✅ Test CONNECTION_BROKEN webhook
- [ ] ✅ Test badge with stale sync
- [ ] ✅ Verify no secrets in browser
- [ ] ✅ Test reconnection flow

### Monitoring
- [ ] ✅ Error tracking (Sentry)
- [ ] ✅ Webhook delivery logs
- [ ] ✅ Cron job success rate
- [ ] ✅ API error rates
- [ ] ✅ Connection health metrics

---

## 📚 Additional Resources

### Official SnapTrade Docs
- [SnapTrade API Docs](https://docs.snaptrade.com)
- [TypeScript SDK](https://github.com/passiv/snaptrade-sdks/tree/master/sdks/typescript)
- [React Components](https://www.npmjs.com/package/snaptrade-react)

### Related Docs
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

## 💬 Support

### Issues?

1. **Check Security Guide** - Most issues are security-related
2. **Test with CLI** - Isolate backend issues
3. **Check Webhooks** - Verify delivery in SnapTrade dashboard
4. **Review RLS Policies** - Ensure correct permissions

### Common Issues

**Badge not appearing:**
- Check `user_broker_verification` view
- Verify connection synced < 72 hours ago
- Check connection not disabled

**Portal URL expired:**
- Generate fresh URL on-demand
- Don't cache portal URLs

**Secrets exposed:**
- Use server routes only
- Never send secrets to client

---

## 🎉 Summary

You now have:

- ✅ **Complete broker integration** with SnapTrade
- ✅ **8 API endpoints** for all operations
- ✅ **8 React components** for UI
- ✅ **7 CLI commands** for testing
- ✅ **3 analytics charts** for insights
- ✅ **Database schema** with RLS
- ✅ **Webhook handler** for real-time updates
- ✅ **Daily snapshots** for equity curve
- ✅ **Broker-Verified badge** with 72h rule
- ✅ **Security best practices** documented

**Ship it!** 🚀

Everything is production-ready and fully documented. Your users can now connect real brokers and see live portfolio analytics!

---

## 📋 Documentation Files

| Guide | Purpose |
|-------|---------|
| [README](./SNAPTRADE_README.md) | This file - Overview & quick start |
| [Complete Setup](./SNAPTRADE_COMPLETE_SETUP.md) | Installation, schema, API routes |
| [Security Guide](./SNAPTRADE_SECURITY_GUIDE.md) | **⚠️ Critical security rules** |
| [UX Guide](./SNAPTRADE_UX_GUIDE.md) | Frontend components & flows |
| [Refresh Guide](./SNAPTRADE_REFRESH_GUIDE.md) | Daily sync & manual refresh |
| [Analytics Guide](./SNAPTRADE_ANALYTICS_GUIDE.md) | Charts & metrics |
| [CLI Guide](./SNAPTRADE_CLI_GUIDE.md) | Command-line tools |
| [Integration Summary](./SNAPTRADE_COMPLETE_INTEGRATION.md) | Complete feature list |

Start with **[Security Guide](./SNAPTRADE_SECURITY_GUIDE.md)** to avoid common mistakes! 🔒
