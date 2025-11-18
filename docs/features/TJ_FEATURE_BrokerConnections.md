# Trade-Journal Feature Deep Dive: Broker Connections

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Feature**: SnapTrade Broker Integration

---

## Overview

**What Users Can Do**:
- Connect brokerage accounts via SnapTrade OAuth
- Auto-sync holdings, balances, orders, and activity
- Earn "Broker-Verified" badge (visible site-wide)
- Manually refresh synced data
- Disconnect brokers

**Where**: `/connect`, `/dashboard/brokers`

---

## SnapTrade Integration Flow

1. **Registration**: User registered with SnapTrade (one-time, automatic)
   - API: `/api/snaptrade/register`
   - Creates `snaptrade_users` record (stores `st_user_id` and `st_user_secret`)

2. **Connection**: User connects broker
   - API: `/api/snaptrade/login-link` (generates OAuth link)
   - User redirected to SnapTrade portal
   - User authenticates with broker
   - SnapTrade redirects back to app

3. **Sync**: Data synced from broker
   - API: `/api/snaptrade/sync`
   - Fetches connections, accounts, balances, holdings, orders, activities
   - Stores in `snaptrade_connections`, `snaptrade_accounts` tables

4. **Verification**: Broker-Verified badge
   - Criteria: ≥1 active connection + holdings synced within 72 hours
   - View: `user_broker_verification` (database view)
   - Displayed: Badge next to username across all pages

---

## API Endpoints

- `/api/snaptrade/register`: Register user with SnapTrade
- `/api/snaptrade/login-link`: Get OAuth URL for broker connection
- `/api/snaptrade/sync`: Sync all broker data
- `/api/snaptrade/connections`: List user's connections
- `/api/snaptrade/accounts`: List accounts for connection
- `/api/snaptrade/positions`: Fetch current positions
- `/api/snaptrade/activities`: Fetch trade activities
- `/api/snaptrade/webhook`: Handle SnapTrade webhooks (sync triggers)

---

## Database Tables

- `snaptrade_users`: Per-user SnapTrade credentials (`st_user_id`, `st_user_secret`)
- `snaptrade_connections`: Broker connections (authorization IDs, broker slugs)
- `snaptrade_accounts`: Account snapshots (balances, total value)
- `account_value_snapshots`: Daily snapshots for equity curve

---

## Security Considerations

- **Secret Storage**: `st_user_secret` stored in database, NEVER sent to client
- **RLS**: User can only access their own SnapTrade data
- **Webhook Verification**: SnapTrade webhooks validated before processing
- **Read-Only**: SnapTrade has read-only access to broker accounts

---

## Broker-Verified Badge

**Criteria**:
- At least 1 active connection (not disabled)
- Holdings synced within last 72 hours

**Implementation**: `user_broker_verification` view in database

**Display**: `BrokerVerifiedBadge` component shown in:
- User menu
- Profile page
- Connect page
- Leaderboard (if implemented)

---

**End of Document**

