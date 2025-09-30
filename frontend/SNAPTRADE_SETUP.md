# SnapTrade Integration Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

All required packages have been installed:
- `snaptrade-typescript-sdk` - Official SnapTrade TypeScript SDK
- `snaptrade-react` - React components for SnapTrade integration
- `zod` - Schema validation

### 2. Environment Variables

Add these to your `.env.local` file (server-side only):

```env
# SnapTrade API Credentials
SNAPTRADE_CLIENT_ID=your_client_id_here
SNAPTRADE_CONSUMER_KEY=your_consumer_key_here

# Environment (production or sandbox)
SNAPTRADE_ENV=production

# Webhook Secret (from SnapTrade dashboard)
SNAPTRADE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```bash
# File: setup-snaptrade-schema.sql
```

This creates:
- `snaptrade_users` - User registrations and secrets
- `snaptrade_connections` - Broker connections
- `snaptrade_accounts` - Account data and holdings
- `snaptrade_sessions` - Connection portal sessions

### 4. Configure Webhooks in SnapTrade Dashboard

1. Go to your SnapTrade dashboard
2. Navigate to Webhooks settings
3. Add webhook URL: `https://your-domain.com/api/snaptrade/webhook`
4. Enable these events:
   - `CONNECTION_ADDED`
   - `ACCOUNT_HOLDINGS_UPDATED`
   - `CONNECTION_REMOVED`
   - `ACCOUNT_SYNC_COMPLETED`
5. Copy the webhook secret and add it to your `.env.local`

## 📚 API Endpoints

### User Registration
**POST** `/api/snaptrade/register`
- Registers user with SnapTrade
- Returns `userSecret` for API calls
- Stores credentials in database

### Connection Portal
**POST** `/api/snaptrade/portal`
- Generates connection portal URL (5-minute expiry)
- Opens in popup window for broker connection
- Returns `redirectUri` and `sessionId`

### List Connections
**GET** `/api/snaptrade/connections`
- Lists all broker connections
- Returns sync status and account info
- Includes `brokerVerified` badge status

### Account Data
**GET** `/api/snaptrade/accounts/[accountId]`
- Gets account balance and holdings
- Returns cached data if recent (< 1 hour)
- Auto-triggers sync if stale

**POST** `/api/snaptrade/accounts/[accountId]`
- Forces immediate account sync
- Updates cached data
- Returns fresh account data

### Broker List
**GET** `/api/snaptrade/brokers`
- Lists all supported brokers
- Returns names, logos, and slugs
- Filters to active brokers only

### Webhooks
**POST** `/api/snaptrade/webhook`
- Receives real-time updates from SnapTrade
- Verifies HMAC-SHA256 signature
- Updates database with new data

## 🎯 Usage in Your App

### Connect a Broker

```typescript
// In your component
const handleConnectBroker = async () => {
  // Register user (if not already)
  const registerRes = await fetch('/api/snaptrade/register', {
    method: 'POST'
  });
  
  // Get connection portal URL
  const portalRes = await fetch('/api/snaptrade/portal', {
    method: 'POST'
  });
  const { data } = await portalRes.json();
  
  // Open in popup
  window.open(data.portalUrl, 'snaptrade', 'width=800,height=600');
};
```

### Display Connections

```typescript
// Use the BrokerConnection component
import BrokerConnection from '@/components/snaptrade/BrokerConnection';

<BrokerConnection userId={user.id} />
```

### Check Broker-Verified Badge

```typescript
const { data } = await fetch('/api/snaptrade/connections');
const isBrokerVerified = data.brokerVerified;

// Badge shows when:
// 1. At least one active connection exists
// 2. Holdings synced in last 72 hours
```

## 🔐 Security Notes

1. **Environment Variables**: Keep `SNAPTRADE_CONSUMER_KEY` and `SNAPTRADE_WEBHOOK_SECRET` server-side only
2. **User Secrets**: Stored encrypted in database with RLS policies
3. **Webhook Verification**: All webhooks verified with HMAC-SHA256 signature
4. **Read-Only Access**: Integration is read-only (no order placement)

## 🎨 Components

### BrokerConnection Component
Full-featured broker connection interface with:
- Broker list with logos
- Connection status tracking
- Account sync controls
- Broker-Verified badge display

### Location
`frontend/components/snaptrade/BrokerConnection.tsx`

### Page
`frontend/app/dashboard/brokers/page.tsx`

## 📊 Data Flow

1. **User Registration**
   - User clicks "Connect Broker"
   - System registers with SnapTrade
   - Stores `userSecret` in database

2. **Broker Connection**
   - Generate connection portal URL
   - Open portal in popup
   - User authenticates with broker
   - Webhook notifies of connection

3. **Data Sync**
   - SnapTrade syncs account data
   - Webhook updates our database
   - UI reflects latest holdings
   - Badge status updated

4. **Ongoing Updates**
   - Webhooks push real-time updates
   - Periodic sync via API calls
   - Cached data for performance

## 🐛 Troubleshooting

### Connection Portal Not Opening
- Check `SNAPTRADE_CLIENT_ID` and `SNAPTRADE_CONSUMER_KEY`
- Verify user is registered (`snaptrade_users` table)
- Check browser popup blocker

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible
- Check `SNAPTRADE_WEBHOOK_SECRET` matches dashboard
- Review webhook signature verification

### Data Not Syncing
- Check connection status in database
- Verify account sync status
- Review API error logs
- Ensure RLS policies are correct

## 📖 SnapTrade SDK Documentation

- [SnapTrade API Docs](https://snaptrade.com/docs)
- [TypeScript SDK](https://github.com/passiv/snaptrade-typescript-sdk)
- [React Components](https://github.com/passiv/snaptrade-react)

## ✅ Next Steps

1. ✅ Get SnapTrade API credentials
2. ✅ Add environment variables to `.env.local`
3. ✅ Run database migration
4. ✅ Configure webhooks in SnapTrade dashboard
5. ✅ Test broker connection flow
6. ✅ Verify data sync and webhooks
7. ✅ Add broker connections page to navigation

## 🎉 You're Ready!

Users can now:
- Connect multiple broker accounts
- View real-time holdings and balances
- Get Broker-Verified badge
- Sync data automatically
- Manage connections from dashboard
