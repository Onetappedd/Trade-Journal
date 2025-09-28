# Secure Subscription System

## Overview
A bulletproof subscription system that never trusts client-only flags for premium access, ensuring all premium features are gated by server-side verification with real-time updates.

## Key Features

### 🔒 **Server-Side Verification**
- **Never Trust Client Flags**: All premium access verified server-side
- **Real-time Status**: Subscription status fetched from `/api/me/subscription`
- **Cache Invalidation**: UI updates immediately after subscription changes
- **Webhook Security**: Stripe webhook signature verification + idempotency

### 🛡️ **Security Features**
- **Signature Verification**: All webhook events verified with Stripe signatures
- **Idempotency Protection**: Prevents duplicate webhook processing
- **Server-side Gates**: Premium features gated by server verification
- **No Client Spoofing**: Local flags cannot bypass premium checks

### 🔄 **Real-time Updates**
- **Webhook Processing**: Automatic subscription updates from Stripe
- **Cache Invalidation**: Immediate UI updates after changes
- **Status Synchronization**: Server and client always in sync
- **Feature Toggles**: Premium features enable/disable automatically

## Architecture

### 1. **Subscription API** (`/api/me/subscription`)

**Features:**
- Server-side subscription lookup
- Cached results for performance
- Feature-based access control
- Real-time status updates

**Response Format:**
```typescript
{
  entitled: boolean;
  tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  features?: string[];
  limits?: {
    maxTrades?: number;
    maxImports?: number;
    maxStorage?: number;
  };
}
```

### 2. **Webhook Handler** (`/api/webhooks/stripe`)

**Security Features:**
- Stripe signature verification
- Idempotency protection
- Event deduplication
- Database updates with cache invalidation

**Supported Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. **Premium Gate Components**

**Server Component:**
```typescript
<PremiumGate feature="advanced_analytics" tier="pro">
  <AdvancedAnalytics />
</PremiumGate>
```

**Client Component:**
```typescript
<PremiumGateClient feature="unlimited_imports" tier="basic">
  <UnlimitedImports />
</PremiumGateClient>
```

## Database Schema

### **Subscriptions Table**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tier TEXT CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Webhook Events Table**
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **User Entitlements Table**
```sql
CREATE TABLE user_entitlements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  is_premium BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Subscription Tiers

### **Free Tier**
- **Features**: Basic features only
- **Limits**: 100 trades, 3 imports, 100MB storage
- **Access**: Basic dashboard, limited analytics

### **Basic Tier**
- **Features**: Limited trades, basic imports, standard analytics, email support
- **Limits**: 1,000 trades, 10 imports, 1GB storage
- **Access**: Enhanced dashboard, basic reporting

### **Pro Tier**
- **Features**: Unlimited trades, unlimited imports, advanced analytics, custom reports, API access, priority support, data export, real-time data
- **Limits**: Unlimited trades, unlimited imports, 10GB storage
- **Access**: Full feature set, advanced analytics, API access

### **Enterprise Tier**
- **Features**: All Pro features + white label, custom integrations, dedicated support, SLA guarantee
- **Limits**: Unlimited everything
- **Access**: White-label solution, custom integrations, dedicated support

## Security Implementation

### **Webhook Security**
```typescript
// Signature verification
const event = stripe.webhooks.constructEvent(
  body, 
  signature, 
  webhookSecret
);

// Idempotency check
const existingEvent = await supabase
  .from('webhook_events')
  .select('id')
  .eq('event_id', eventId)
  .single();

if (existingEvent) {
  return; // Skip duplicate event
}
```

### **Premium Feature Gating**
```typescript
// Server-side verification
const subscription = await getSubscriptionStatus(userId);
const hasAccess = checkFeatureAccess(subscription, feature, requiredTier);

if (!hasAccess) {
  return <UpgradePrompt tier={requiredTier} />;
}
```

### **Cache Invalidation**
```typescript
// After subscription update
revalidateTag('subscription');
revalidateTag('user');
revalidateTag('kpi');
```

## Testing

### **E2E Tests**
- **Subscription Status**: Verifies server-side status loading
- **Premium Gating**: Tests feature access based on subscription
- **Webhook Processing**: Simulates Stripe webhook events
- **Security**: Ensures client flags cannot spoof access

### **Security Tests**
- **Client Spoofing**: Verifies local flags cannot bypass checks
- **Webhook Verification**: Tests signature validation
- **Idempotency**: Ensures duplicate events are handled
- **Cache Invalidation**: Verifies UI updates after changes

## Usage Examples

### **Server Component Gating**
```typescript
// In a server component
import { PremiumGate } from '@/src/components/premium/PremiumGate';

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      
      <PremiumGate feature="basic_analytics" tier="basic">
        <BasicAnalytics />
      </PremiumGate>
      
      <PremiumGate feature="advanced_analytics" tier="pro">
        <AdvancedAnalytics />
      </PremiumGate>
    </div>
  );
}
```

### **Client Component Gating**
```typescript
// In a client component
import { PremiumGateClient } from '@/src/components/premium/PremiumGate';

export function TradingDashboard() {
  return (
    <div>
      <PremiumGateClient feature="unlimited_trades" tier="pro">
        <UnlimitedTrades />
      </PremiumGateClient>
    </div>
  );
}
```

### **API Usage**
```typescript
// Fetch subscription status
const response = await fetch('/api/me/subscription', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const subscription = await response.json();
if (subscription.entitled && subscription.tier === 'pro') {
  // Show pro features
}
```

## Performance Optimizations

### **Caching Strategy**
- **Subscription Status**: 1-minute cache TTL
- **Feature Checks**: Cached per user session
- **Webhook Processing**: Idempotency prevents duplicate work
- **Database Queries**: Indexed lookups for fast access

### **Real-time Updates**
- **Webhook Processing**: Immediate database updates
- **Cache Invalidation**: Automatic UI refresh
- **Status Synchronization**: Server and client always in sync
- **Feature Toggles**: Premium features enable/disable automatically

## Monitoring

### **Metrics Tracked**
- Subscription status requests
- Webhook processing success/failure rates
- Premium feature access patterns
- Cache hit/miss rates
- Security violations

### **Alerts**
- Webhook processing failures
- Subscription sync issues
- Security violations
- Performance degradation

## Troubleshooting

### **Common Issues**
1. **Premium features not showing**: Check subscription status API
2. **Webhook not processing**: Verify Stripe signature
3. **Cache not updating**: Check invalidation tags
4. **Security violations**: Review client-side checks

### **Debug Steps**
1. Check subscription status in database
2. Verify webhook event processing
3. Test cache invalidation
4. Review security logs

---

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install stripe
   ```

2. **Run Database Migrations**
   ```bash
   npx supabase db push
   ```

3. **Configure Environment Variables**
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_BASIC=price_...
   STRIPE_PRICE_PRO=price_...
   ```

4. **Test Subscription System**
   - Navigate to `/test-subscription`
   - Verify subscription status loading
   - Test premium feature gating
   - Check security measures

## Support

For issues or questions:
- Check the troubleshooting guide
- Review webhook logs
- Contact support team
- Submit bug reports

---

*Last updated: 2025-09-27*
*Version: 1.0.0*

