# SnapTrade CLI Guide

## 🚀 Quick Start

The SnapTrade CLI allows you to quickly test integration flows from the command line without needing to build UI first.

---

## 📦 Installation

Dependencies are already installed if you ran:
```bash
npm install
```

Additional CLI tools:
- `ts-node` - TypeScript execution
- `open` - Cross-platform URL opener

---

## 🔧 Available Commands

### 1. Register User

Register a new SnapTrade user (or verify existing registration).

```bash
npm run snaptrade:register <userId>
```

**Example:**
```bash
npm run snaptrade:register abc-123-def
```

**Output:**
```
🚀 SnapTrade CLI

📝 Registering user: abc-123-def
✅ User registered successfully!

SnapTrade User ID: riskr_abc-123-def
User Secret: dt8sK3j9mP2nQ4rL...
```

---

### 2. Open Connection Portal

Generate a connection portal URL and open it in your browser.

```bash
npm run snaptrade:portal <userId>
```

**Example:**
```bash
npm run snaptrade:portal abc-123-def
```

**Output:**
```
🚀 SnapTrade CLI

🔗 Generating connection portal URL for: abc-123-def

✅ Portal URL generated (expires in 5 minutes):

   https://trade.snaptrade.com/login?...

📋 Opening in browser...

💡 After connecting, run: npm run snaptrade:sync abc-123-def
```

**What happens:**
1. Generates a short-lived portal URL
2. Opens in your default browser
3. You authenticate with a broker (use SnapTrade sandbox for testing)
4. SnapTrade sends a webhook when complete

---

### 3. Sync Connections & Accounts

Fetch connections and accounts from SnapTrade and store in database.

```bash
npm run snaptrade:sync <userId>
```

**Example:**
```bash
npm run snaptrade:sync abc-123-def
```

**Output:**
```
🚀 SnapTrade CLI

🔄 Syncing connections for: abc-123-def

✅ Found 1 connection(s):

   • Robinhood
     ID: auth-uuid-here
     Status: ✅ Active

✅ Found 1 account(s):

   • Robinhood Individual (***1234)
     ID: account-uuid-here
     Balance: $50,250.00
     Last Sync: 2025-01-15T12:00:00Z

✅ Sync complete!

💡 Next: npm run snaptrade:accounts abc-123-def
```

---

### 4. List Connections

View all broker connections for a user.

```bash
npm run snaptrade:connections <userId>
```

**Example:**
```bash
npm run snaptrade:connections abc-123-def
```

**Output:**
```
🚀 SnapTrade CLI

📋 Listing connections for: abc-123-def

✅ Found 2 connection(s):

   • ROBINHOOD
     Authorization ID: auth-uuid-1
     Status: ✅ Active
     Last Sync: 2025-01-15T12:00:00Z

   • SCHWAB
     Authorization ID: auth-uuid-2
     Status: ✅ Active
     Last Sync: 2025-01-15T11:30:00Z
```

---

### 5. List Accounts

View all brokerage accounts for a user with balances.

```bash
npm run snaptrade:accounts <userId>
```

**Example:**
```bash
npm run snaptrade:accounts abc-123-def
```

**Output:**
```
🚀 SnapTrade CLI

📋 Listing accounts for: abc-123-def

✅ Found 2 account(s):

   • Robinhood Individual (Robinhood)
     Account ID: account-uuid-1
     Number: ***1234
     Balance: $50,250.00
     Currency: USD
     Last Sync: 2025-01-15T12:00:00Z

   • Schwab Brokerage (Charles Schwab)
     Account ID: account-uuid-2
     Number: ***5678
     Balance: $125,750.50
     Currency: USD
     Last Sync: 2025-01-15T11:30:00Z

💰 Total Portfolio Value: $176,000.50

💡 View positions: npm run snaptrade:positions abc-123-def <accountId>
```

---

### 6. List Positions

View positions for a specific account.

```bash
npm run snaptrade:positions <userId> <accountId>
```

**Example:**
```bash
npm run snaptrade:positions abc-123-def account-uuid-1
```

**Output:**
```
🚀 SnapTrade CLI

📊 Fetching positions for account: account-uuid-1

✅ Found 5 position(s):

   AAPL
     Name: Apple Inc.
     Type: Stock
     Quantity: 100
     Avg Price: $150.00
     Market Value: $17,500.00
     P&L: +$2,500.00 (+16.67%)

   TSLA
     Name: Tesla, Inc.
     Type: Stock
     Quantity: 50
     Avg Price: $200.00
     Market Value: $12,000.00
     P&L: +$2,000.00 (+20.00%)

   SPY
     Name: SPDR S&P 500 ETF Trust
     Type: ETF
     Quantity: 200
     Avg Price: $400.00
     Market Value: $82,000.00
     P&L: +$2,000.00 (+2.50%)
```

---

### 7. Take Account Snapshot

Manually create a daily snapshot for equity curve analytics.

```bash
npm run snaptrade:snapshot <userId>
```

**Example:**
```bash
npm run snaptrade:snapshot abc-123-def
```

**Output:**
```
🚀 SnapTrade CLI

📸 Taking account snapshot for: abc-123-def

✅ Snapshot taken successfully!
   Date: 2025-01-15T00:00:00Z
   Total Value: $176,000.50
   Accounts: 2
```

---

## 🧪 Complete Test Flow

Run an interactive walkthrough of the entire integration:

```bash
npm run snaptrade:test-flow
```

**Interactive Steps:**
1. Enter test user ID
2. Register user
3. Open connection portal
4. Wait for broker connection
5. Sync connections & accounts
6. View connections
7. View accounts
8. View positions
9. Take snapshot

---

## 📋 Common Workflows

### Testing New User Flow

```bash
# 1. Register user
npm run snaptrade:register my-test-user

# 2. Open portal to connect broker
npm run snaptrade:portal my-test-user

# 3. (Complete authentication in browser)

# 4. Sync data
npm run snaptrade:sync my-test-user

# 5. Verify connections
npm run snaptrade:connections my-test-user

# 6. Check accounts
npm run snaptrade:accounts my-test-user
```

---

### Testing Broker-Verified Badge

```bash
# 1. Connect broker
npm run snaptrade:portal user-id

# 2. Sync after connection
npm run snaptrade:sync user-id

# 3. Check last sync time
npm run snaptrade:connections user-id

# If last_holdings_sync_at is within 72 hours, badge should appear
```

---

### Testing Analytics

```bash
# 1. Take initial snapshot
npm run snaptrade:snapshot user-id

# 2. Wait 24 hours or manually advance date in database

# 3. Take another snapshot
npm run snaptrade:snapshot user-id

# 4. View equity curve in UI
# Should show 2 data points
```

---

### Testing Webhook Processing

```bash
# 1. Connect broker via portal
npm run snaptrade:portal user-id

# 2. Check database for webhook updates
# snaptrade_connections.last_holdings_sync_at should be populated

# 3. Manually trigger refresh (if implemented)
# Webhook should update sync timestamp
```

---

## 🔐 Environment Setup

Required environment variables in `.env.local`:

```env
# SnapTrade API
SNAPTRADE_CLIENT_ID=your_client_id
SNAPTRADE_CONSUMER_KEY=your_consumer_key
SNAPTRADE_ENV=production  # or sandbox
SNAPTRADE_WEBHOOK_SECRET=your_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🐛 Troubleshooting

### Error: Missing SnapTrade credentials

```
❌ Missing SnapTrade credentials. Set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY
```

**Fix:** Set environment variables in `.env.local`

---

### Error: User not registered

```
❌ User not registered. Run: npm run snaptrade:register <userId>
```

**Fix:** Register the user first before other operations

---

### Error: No connections found

```
❌ No connections found. Run: npm run snaptrade:portal <userId>
```

**Fix:** Open connection portal and authenticate with a broker

---

### Portal URL expires

Portal URLs expire in **5 minutes**. If expired:

```bash
# Generate a new one
npm run snaptrade:portal user-id
```

---

### Sync returns empty accounts

**Possible causes:**
1. Broker connection not complete
2. SnapTrade still processing
3. Connection disabled

**Fix:**
```bash
# Check connection status
npm run snaptrade:connections user-id

# Re-sync
npm run snaptrade:sync user-id
```

---

## 📝 Testing with SnapTrade Sandbox

SnapTrade provides sandbox brokers for testing:

1. **Open portal:**
   ```bash
   npm run snaptrade:portal test-user
   ```

2. **Select "SnapTrade Sandbox" broker**

3. **Use sandbox credentials:**
   - Username: `sandbox`
   - Password: `sandbox123`

4. **Complete flow as normal**

Sandbox provides fake data but follows the same flow as production.

---

## 🎯 CLI Implementation Details

### Technology Stack

- **`ts-node`** - Run TypeScript directly
- **`open`** - Cross-platform URL opener
- **`readline`** - Interactive CLI prompts
- **`@supabase/supabase-js`** - Database access
- **`snaptrade-typescript-sdk`** - SnapTrade API

### CLI Architecture

```
scripts/snaptrade-cli.ts
├── Command Parser (process.argv)
├── Environment Validator
├── Helper Functions
│   ├── getOrCreateSnapTradeUser()
│   ├── registerUser()
│   ├── generatePortalUrl()
│   ├── syncUser()
│   ├── listConnections()
│   ├── listAccounts()
│   ├── listPositions()
│   └── takeSnapshot()
└── Error Handling
```

---

## 🔄 Extending the CLI

### Adding New Commands

1. **Add command handler in `snaptrade-cli.ts`:**

```typescript
async function myCommand(userId: string) {
  console.log(`Running my command for: ${userId}`);
  // Implementation
}
```

2. **Add to CLI router:**

```typescript
switch (command) {
  case 'mycommand':
    await myCommand(userId);
    break;
}
```

3. **Add npm script in `package.json`:**

```json
{
  "scripts": {
    "snaptrade:mycommand": "ts-node --transpile-only scripts/snaptrade-cli.ts mycommand"
  }
}
```

---

## 📚 Official SnapTrade CLI

SnapTrade also provides an official CLI tool:

```bash
npm install -g @snaptrade/cli
```

**Features:**
- Interactive broker connection
- Account management
- Trade execution (if enabled)
- Webhook testing

**Docs:** https://github.com/passiv/snaptrade-cli

---

## 🎉 Summary

You now have a **complete CLI toolkit** for:

- ✅ **Quick testing** - No UI needed
- ✅ **User registration** - One command
- ✅ **Broker connection** - Auto-open browser
- ✅ **Data syncing** - Instant verification
- ✅ **Connection management** - View status
- ✅ **Account inspection** - Check balances
- ✅ **Position analysis** - See P&L
- ✅ **Snapshot creation** - Test analytics
- ✅ **Interactive flow** - Guided walkthrough

**Perfect for local development and testing!** 🚀

Use these commands to rapidly iterate on your SnapTrade integration before building UI components.
