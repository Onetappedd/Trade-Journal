# SnapTrade Integration - Complete Setup Guide

## 🎯 Overview

This guide covers the complete SnapTrade broker connection integration for Riskr, including:
- User registration
- Connection portal (login link)
- Sync connections & accounts
- Webhook for real-time updates
- Broker-Verified badge logic
- Optional data endpoints (positions, balances, orders, activities)

---

## 📋 Prerequisites

1. **SnapTrade Account** - Sign up at https://snaptrade.com
2. **API Credentials** - Get from SnapTrade dashboard:
   - `SNAPTRADE_CLIENT_ID`
   - `SNAPTRADE_CONSUMER_KEY`
   - `SNAPTRADE_WEBHOOK_SECRET`
3. **Supabase Project** - With service role key

---

## 🔧 Step 1: Environment Variables

Add to `.env.local`:

```env
# SnapTrade API Credentials
SNAPTRADE_CLIENT_ID=your_client_id_here
SNAPTRADE_CONSUMER_KEY=your_consumer_key_here
SNAPTRADE_ENV=production
SNAPTRADE_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (for service role access)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Run Main Schema Migration

Execute `setup-snaptrade-schema-final.sql` in Supabase SQL Editor:

```sql
-- Creates tables:
-- - snaptrade_users (with st_user_id, st_user_secret)
-- - snaptrade_connections (with authorization_id, broker_slug, disabled, last_holdings_sync_at)
-- - snaptrade_accounts (with account snapshots)
-- - user_broker_verification VIEW (for badge logic)
-- - RLS policies (server-only access to secrets)
-- - Indexes & triggers
```

### 2.2 Add Sync Helper Function

Execute `add-sync-helper-function.sql`:

```sql
-- Creates function:
-- public.set_connection_last_sync(p_user_id, p_auth_id, p_sync_time)
-- Used during account sync to update connection's last_holdings_sync_at
```

---

## 🌐 Step 3: Configure Webhook

### 3.1 In SnapTrade Dashboard

1. Go to **Settings** → **Webhooks**
2. Set webhook URL: `https://riskr.app/api/snaptrade/webhook`
3. Enable these events:
   - `CONNECTION_ADDED`
   - `ACCOUNT_HOLDINGS_UPDATED`
   - `CONNECTION_BROKEN`
   - `CONNECTION_DELETED`
4. Copy the **Webhook Secret** and add to `.env.local`

### 3.2 Test Webhook (Optional)

```bash
curl -X POST https://riskr.app/api/snaptrade/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookSecret": "your_secret",
    "eventType": "CONNECTION_ADDED",
    "userId": "riskr_user-uuid",
    "brokerageAuthorizationId": "auth-uuid",
    "brokerageId": "ROBINHOOD",
    "eventTimestamp": "2025-01-15T12:00:00Z"
  }'
```

---

## 🔄 Step 4: Integration Flow

### 4.1 Register User (One-Time)

When user signs up or first accesses broker connections:

```typescript
// Client-side
const response = await fetch('/api/snaptrade/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    riskrUserId: user.id  // Current logged-in user's UUID
  })
});

const { ok } = await response.json();
// Returns: { ok: true }
```

**What happens:**
- Creates `riskr_<uuid>` SnapTrade user ID
- Registers with SnapTrade API
- Stores `st_user_id` and `st_user_secret` in `snaptrade_users` table
- Secrets are **server-only**, never exposed to client

---

### 4.2 Generate Login Link

When user clicks "Connect Broker":

```typescript
const response = await fetch('/api/snaptrade/login-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    riskrUserId: user.id,
    connectionType: 'read',  // read-only mode
    // Optional:
    // broker: 'SCHWAB',  // Pre-select broker
    // customRedirect: 'https://riskr.app/dashboard/brokers/success'
  })
});

const { redirectURI } = await response.json();
// redirectURI expires in ~5 minutes

// Open in popup or new tab
window.open(redirectURI, 'snaptrade-connection', 'width=800,height=600');
```

**What happens:**
- Generates short-lived connection portal URL
- User authenticates with their broker
- SnapTrade handles OAuth flow
- Webhook `CONNECTION_ADDED` fires when complete

---

### 4.3 Sync Connections & Accounts

After connection or periodically:

```typescript
const response = await fetch('/api/snaptrade/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    riskrUserId: user.id
  })
});

const { ok, connections, accounts } = await response.json();
// Returns: { ok: true, connections: 2, accounts: 3 }
```

**What happens:**
- Fetches all connections from SnapTrade
- Fetches all accounts with sync status
- Updates `snaptrade_connections` table
- Updates `snaptrade_accounts` table
- Calls `set_connection_last_sync` to update verification status

---

### 4.4 Check Broker-Verified Status

```typescript
const { data } = await supabase
  .from('user_broker_verification')
  .select('is_broker_verified, last_verified_at')
  .eq('user_id', userId)
  .single();

if (data.is_broker_verified) {
  // Show Broker-Verified badge ✅
  // Badge requires:
  // 1. At least one active connection (disabled = false)
  // 2. last_holdings_sync_at within 72 hours
}
```

---

## 📊 Step 5: Optional Data Endpoints

### Get Account Positions (Holdings)

```typescript
const { positions } = await fetch('/api/snaptrade/positions', {
  method: 'POST',
  body: JSON.stringify({ 
    riskrUserId: user.id,
    accountId: 'account-uuid'
  })
}).then(r => r.json());

// positions includes stocks, options, ETFs, etc.
```

### Get Account Balances

```typescript
const { account, balance } = await fetch('/api/snaptrade/balances', {
  method: 'POST',
  body: JSON.stringify({ 
    riskrUserId: user.id,
    accountId: 'account-uuid'
  })
}).then(r => r.json());

// balance.total, balance.cash, balance.currency
```

### Get Intraday Orders

```typescript
const { orders } = await fetch('/api/snaptrade/orders', {
  method: 'POST',
  body: JSON.stringify({ 
    riskrUserId: user.id,
    accountId: 'account-uuid'
  })
}).then(r => r.json());
```

### Get Historical Activities

```typescript
const { activities } = await fetch('/api/snaptrade/activities', {
  method: 'POST',
  body: JSON.stringify({ 
    riskrUserId: user.id,
    accountId: 'account-uuid',
    startDate: '2025-01-01',  // Optional: YYYY-MM-DD
    endDate: '2025-01-31'      // Optional: YYYY-MM-DD
  })
}).then(r => r.json());

// Activities: trades, dividends, transfers, etc.
```

---

## 🔔 Step 6: Webhook Events

Webhooks keep your data fresh without polling.

### EVENT: CONNECTION_ADDED

```json
{
  "webhookSecret": "your_secret",
  "eventType": "CONNECTION_ADDED",
  "userId": "riskr_user-uuid",
  "brokerageAuthorizationId": "auth-uuid",
  "brokerageId": "ROBINHOOD",
  "eventTimestamp": "2025-01-15T12:00:00Z"
}
```

**Handler:**
- Creates/updates connection in `snaptrade_connections`
- Sets `disabled = false`
- User can now fetch accounts

### EVENT: ACCOUNT_HOLDINGS_UPDATED

```json
{
  "webhookSecret": "your_secret",
  "eventType": "ACCOUNT_HOLDINGS_UPDATED",
  "userId": "riskr_user-uuid",
  "brokerageAuthorizationId": "auth-uuid",
  "accountId": "account-uuid",
  "eventTimestamp": "2025-01-15T13:30:00Z"
}
```

**Handler:**
- Updates `snaptrade_connections.last_holdings_sync_at`
- Refreshes Broker-Verified badge status
- User maintains verification (if within 72h)

### EVENT: CONNECTION_BROKEN

```json
{
  "webhookSecret": "your_secret",
  "eventType": "CONNECTION_BROKEN",
  "userId": "riskr_user-uuid",
  "brokerageAuthorizationId": "auth-uuid",
  "eventTimestamp": "2025-01-15T14:00:00Z"
}
```

**Handler:**
- Sets `disabled = true`
- User loses Broker-Verified badge
- User must re-authenticate

### EVENT: CONNECTION_DELETED

```json
{
  "webhookSecret": "your_secret",
  "eventType": "CONNECTION_DELETED",
  "userId": "riskr_user-uuid",
  "brokerageAuthorizationId": "auth-uuid",
  "eventTimestamp": "2025-01-15T15:00:00Z"
}
```

**Handler:**
- Sets `disabled = true`
- User disconnected broker manually
- Can reconnect later

---

## 🎨 Step 7: UI Components

### Example: Broker Connection Page

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function BrokerConnectionPage({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  
  const handleConnect = async () => {
    setLoading(true);
    
    // 1. Register user if needed
    await fetch('/api/snaptrade/register', {
      method: 'POST',
      body: JSON.stringify({ riskrUserId: userId })
    });
    
    // 2. Get login link
    const { redirectURI } = await fetch('/api/snaptrade/login-link', {
      method: 'POST',
      body: JSON.stringify({ 
        riskrUserId: userId,
        connectionType: 'read'
      })
    }).then(r => r.json());
    
    // 3. Open portal
    const popup = window.open(redirectURI, 'snaptrade', 'width=800,height=600');
    
    // 4. Poll for completion
    const interval = setInterval(async () => {
      if (popup?.closed) {
        clearInterval(interval);
        
        // 5. Sync data
        await fetch('/api/snaptrade/sync', {
          method: 'POST',
          body: JSON.stringify({ riskrUserId: userId })
        });
        
        setLoading(false);
        window.location.reload(); // Refresh to show connections
      }
    }, 1000);
  };
  
  return (
    <Button onClick={handleConnect} disabled={loading}>
      {loading ? 'Connecting...' : 'Connect Broker'}
    </Button>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Environment variables set
- [ ] Database schema migrated
- [ ] Sync helper function added
- [ ] Webhook URL configured in SnapTrade dashboard
- [ ] User registration works
- [ ] Login link generates successfully
- [ ] Connection portal opens correctly
- [ ] Webhook receives CONNECTION_ADDED event
- [ ] Sync endpoint fetches connections & accounts
- [ ] Broker-Verified badge shows correctly (after sync within 72h)
- [ ] Positions/balances endpoints work
- [ ] Webhook handles ACCOUNT_HOLDINGS_UPDATED
- [ ] Webhook handles CONNECTION_BROKEN/DELETED

---

## 🐛 Troubleshooting

### Issue: "User not registered with SnapTrade"
**Solution:** Call `/api/snaptrade/register` first

### Issue: Login link expired
**Solution:** Link expires in 5 minutes, generate a new one

### Issue: Webhook not receiving events
**Solution:** 
- Check webhook URL is publicly accessible
- Verify `SNAPTRADE_WEBHOOK_SECRET` matches dashboard
- Check SnapTrade dashboard webhook logs

### Issue: Broker-Verified badge not showing
**Solution:**
- Run `/api/snaptrade/sync` to refresh data
- Check `last_holdings_sync_at` is within 72 hours
- Verify connection is not disabled
- Query `user_broker_verification` view

---

## 📖 API Reference

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/snaptrade/register` | POST | Register user with SnapTrade |
| `/api/snaptrade/login-link` | POST | Generate connection portal URL |
| `/api/snaptrade/sync` | POST | Sync connections & accounts |
| `/api/snaptrade/positions` | POST | Get account positions |
| `/api/snaptrade/balances` | POST | Get account balances |
| `/api/snaptrade/orders` | POST | Get intraday orders |
| `/api/snaptrade/activities` | POST | Get historical activities |
| `/api/snaptrade/webhook` | POST | Receive real-time events |

---

## 🎉 You're All Set!

Users can now:
- ✅ Connect multiple broker accounts (read-only)
- ✅ Get real-time data sync via webhooks
- ✅ Earn Broker-Verified badge (72-hour holdings sync)
- ✅ View positions, balances, orders, activities
- ✅ Maintain fresh data automatically

**Next Steps:**
1. Build UI for broker connections page
2. Display Broker-Verified badge on profile
3. Show portfolio overview from positions
4. Import activities as trades (optional)

---

## 📚 Documentation Links

- [SnapTrade API Docs](https://docs.snaptrade.com)
- [SnapTrade TypeScript SDK](https://www.npmjs.com/package/snaptrade-typescript-sdk)
- [Webhook Events](https://docs.snaptrade.com/webhooks)
- [Broker List](https://docs.snaptrade.com/brokerages)
