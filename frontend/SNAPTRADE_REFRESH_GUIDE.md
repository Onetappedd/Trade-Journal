# SnapTrade Refresh & Daily Sync Guide

## 🔄 How SnapTrade Syncs Data

### Daily Automatic Sync
SnapTrade automatically syncs your broker data **once per day**:
- Runs overnight (typically between 12 AM - 6 AM EST)
- Pulls fresh positions, balances, and activities
- Sends `ACCOUNT_HOLDINGS_UPDATED` webhook on completion
- Updates `last_holdings_sync_at` in your database

### Manual Refresh (On-Demand)
Users can trigger manual refresh for instant updates:
- Forces SnapTrade to pull data immediately from broker
- Useful for intraday trading or important decisions
- **⚠️ May incur per-refresh cost** on pay-as-you-go pricing
- Should be used sparingly

---

## 📦 Components Created

### 1. **RefreshConnectionButton**
**File:** `components/snaptrade/RefreshConnectionButton.tsx`

Triggers manual refresh with cost warning dialog.

**Props:**
```typescript
interface RefreshConnectionButtonProps {
  userId: string;              // Current user's UUID
  authorizationId: string;     // Connection UUID
  brokerName?: string;         // For display in dialog
  lastSync?: string;           // Last sync timestamp
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showWarning?: boolean;       // Show cost warning dialog
  className?: string;
}
```

**Usage:**
```tsx
<RefreshConnectionButton
  userId={user.id}
  authorizationId="auth-uuid"
  brokerName="Robinhood"
  lastSync="2025-01-15T12:00:00Z"
  onSuccess={() => refetchData()}
  showWarning={true}
/>
```

**Features:**
- ✅ Shows warning dialog before refresh
- ✅ Displays last sync time
- ✅ Smart warnings (if synced < 1 hour ago)
- ✅ Cost disclaimer in dialog
- ✅ Loading state with spinning icon
- ✅ Rate limit handling (429 errors)
- ✅ Toast notifications
- ✅ Auto-refetch after 2 seconds

---

### 2. **SyncStatusIndicator**
**File:** `components/snaptrade/SyncStatusIndicator.tsx`

Visual indicator of sync freshness with color-coded status.

**Props:**
```typescript
interface SyncStatusIndicatorProps {
  lastSync?: string | null;
  showText?: boolean;          // Show time text
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

**Freshness Levels:**
- **Fresh (< 6 hours)** - Green ✅
  - CheckCircle2 icon
  - "Data synced within last 6 hours"
  
- **Recent (6-24 hours)** - Blue 🔵
  - Clock icon
  - "Data synced within last 24 hours"
  
- **Stale (24-72 hours)** - Orange ⚠️
  - AlertTriangle icon
  - "Consider refreshing"
  
- **Expired (> 72 hours)** - Red ❌
  - XCircle icon
  - "Verification lost"
  
- **Never** - Gray
  - "No sync data available"

**Usage:**
```tsx
<SyncStatusIndicator
  lastSync="2025-01-15T12:00:00Z"
  showText={true}
  size="md"
/>

// Compact badge version (no text)
<SyncStatusBadge lastSync={lastSync} />
```

**Features:**
- ✅ Color-coded status icons
- ✅ Tooltip with detailed info
- ✅ Friendly time formatting ("2h ago", "1d ago")
- ✅ Helpful tips in tooltip
- ✅ Accessible (screen reader support)

---

### 3. **Refresh API Endpoint**
**File:** `app/api/snaptrade/refresh/route.ts`

Triggers manual refresh via SnapTrade API.

**Request:**
```
POST /api/snaptrade/refresh
Body: { riskrUserId: string, authorizationId: string }
```

**Response:**
```json
{
  "ok": true,
  "status": "pending",
  "message": "Refresh initiated. Data will update shortly via webhook."
}
```

**Error Handling:**
- **429 Rate Limit:** Returns "Please wait before refreshing again"
- **404 Not Found:** "User not registered with SnapTrade"
- **500 Server Error:** Generic failure message

**Features:**
- ✅ Zod validation
- ✅ Service role database access
- ✅ Calls SnapTrade `refreshBrokerageAuthorization`
- ✅ Rate limit detection
- ✅ Error handling with details

---

## 🎯 Integration Examples

### Basic Refresh Button

```tsx
import RefreshConnectionButton from '@/components/snaptrade/RefreshConnectionButton';

<RefreshConnectionButton
  userId={user.id}
  authorizationId={connection.id}
  onSuccess={() => router.refresh()}
/>
```

### With Sync Status Indicator

```tsx
import SyncStatusIndicator from '@/components/snaptrade/SyncStatusIndicator';
import RefreshConnectionButton from '@/components/snaptrade/RefreshConnectionButton';

<div className="flex items-center gap-3">
  <SyncStatusIndicator lastSync={connection.lastSync} />
  <RefreshConnectionButton
    userId={user.id}
    authorizationId={connection.id}
    lastSync={connection.lastSync}
  />
</div>
```

### Icon-Only Button (Compact)

```tsx
<RefreshConnectionButton
  userId={user.id}
  authorizationId={connection.id}
  size="icon"
  variant="ghost"
  showWarning={false}
/>
```

### Connection Card Example

```tsx
<Card>
  <CardHeader>
    <div className="flex items-start justify-between">
      <div>
        <CardTitle>{connection.brokerName}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SyncStatusIndicator 
            lastSync={connection.lastSync}
            size="sm"
          />
        </div>
      </div>
      
      <RefreshConnectionButton
        userId={user.id}
        authorizationId={connection.id}
        brokerName={connection.brokerName}
        lastSync={connection.lastSync}
        onSuccess={() => refetchConnections()}
        size="sm"
        variant="ghost"
      />
    </div>
  </CardHeader>
</Card>
```

---

## ⚡ Sync Flow

### Daily Automatic Sync

```
1. SnapTrade runs daily sync (overnight)
   ↓
2. Pulls fresh data from broker
   ↓
3. Sends ACCOUNT_HOLDINGS_UPDATED webhook
   ↓
4. Webhook updates last_holdings_sync_at
   ↓
5. SyncStatusIndicator shows "Fresh" (green)
   ↓
6. Broker-Verified badge maintained
```

### Manual Refresh

```
1. User clicks "Refresh" button
   ↓
2. Warning dialog appears (if recent sync)
   ↓
3. User confirms refresh
   ↓
4. API calls SnapTrade refreshBrokerageAuthorization
   ↓
5. SnapTrade queues refresh request
   ↓
6. Toast: "Refresh initiated"
   ↓
7. SnapTrade pulls data from broker (~30-60 seconds)
   ↓
8. SnapTrade sends ACCOUNT_HOLDINGS_UPDATED webhook
   ↓
9. Database updates last_holdings_sync_at
   ↓
10. UI refetches and shows fresh data
```

---

## 🚨 Cost Warning System

### When to Show Warning

```typescript
// Show warning if last sync was less than 1 hour ago
const shouldShowWarning = () => {
  const syncDate = new Date(lastSync);
  const now = new Date();
  const diffHours = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);
  return diffHours < 1;
};
```

### Warning Dialog Content

The dialog displays:
1. **Broker name** being refreshed
2. **Last sync time** (e.g., "synced 30m ago")
3. **What happens** bullet list
4. **Cost warning** if applicable
5. **Cancel** and **Refresh Now** buttons

### Disabling Warning

For power users or internal tools:
```tsx
<RefreshConnectionButton
  userId={user.id}
  authorizationId={connection.id}
  showWarning={false}  // Skip dialog
/>
```

---

## 📊 Sync Status Colors

### Visual Guide

```
Green (Fresh)       ✅  0-6 hours    "Just now", "2h ago"
Blue (Recent)       🔵  6-24 hours   "12h ago"
Orange (Stale)      ⚠️  24-72 hours  "2d ago"
Red (Expired)       ❌  > 72 hours   "5d ago" (loses badge)
Gray (Never)        ⚪  null         "Never synced"
```

### Usage in UI

```tsx
// Show status in connection cards
<div className="flex items-center gap-2">
  <SyncStatusIndicator lastSync={lastSync} />
  <span className="text-sm">Last synced</span>
</div>

// Compact badge in lists
<div className="flex items-center justify-between">
  <span>{broker.name}</span>
  <SyncStatusBadge lastSync={lastSync} />
</div>
```

---

## 🎨 UX Best Practices

### 1. **Show Sync Status Prominently**

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      Robinhood
      <SyncStatusBadge lastSync={lastSync} />
    </CardTitle>
  </CardHeader>
</Card>
```

### 2. **Educate Users About Daily Sync**

```tsx
<div className="bg-blue-50 p-3 rounded-lg">
  <p className="text-sm text-blue-900">
    💡 SnapTrade automatically syncs your data daily. 
    Manual refresh is available if you need instant updates.
  </p>
</div>
```

### 3. **Prevent Excessive Refreshes**

```tsx
// Show warning for recent syncs
if (lastSyncAge < 1 hour) {
  // Show dialog with "Note: synced 30m ago"
}

// Rate limit handling
if (response.status === 429) {
  toast.error('Please wait before refreshing again');
}
```

### 4. **Indicate Stale Data**

```tsx
{status === 'stale' && (
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Your data hasn't synced in {diffDays} days. 
      Consider refreshing for latest positions.
    </AlertDescription>
  </Alert>
)}
```

---

## ⏰ Webhook Updates

When data refreshes (daily or manual), you'll receive:

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

**Webhook Handler:**
- Updates `last_holdings_sync_at` in `snaptrade_connections`
- Maintains Broker-Verified badge status
- Triggers UI updates (via real-time or polling)

---

## 🧪 Testing Checklist

- [ ] Daily sync updates database correctly
- [ ] Webhook receives ACCOUNT_HOLDINGS_UPDATED
- [ ] SyncStatusIndicator shows correct color
- [ ] SyncStatusIndicator updates after refresh
- [ ] Refresh button shows warning dialog
- [ ] Warning dialog displays correct last sync time
- [ ] Refresh button handles loading state
- [ ] Refresh API returns success
- [ ] Rate limiting works (429 errors)
- [ ] Toast notifications appear
- [ ] UI refetches after refresh completes
- [ ] Badge status updates after sync
- [ ] Expired status (> 72h) removes badge

---

## 💰 Pricing Considerations

### SnapTrade Pricing Tiers

1. **Free Tier**
   - Daily automatic sync included
   - Limited manual refreshes per month
   
2. **Pay-as-you-go**
   - $X per manual refresh
   - Daily sync included
   - Show cost warning dialog
   
3. **Enterprise**
   - Unlimited refreshes
   - Can disable warning dialog

### Recommended Approach

```tsx
// For free/pay-as-you-go users
<RefreshConnectionButton showWarning={true} />

// For enterprise users
<RefreshConnectionButton showWarning={false} />
```

---

## 📚 Documentation

All functionality documented in:
- `SNAPTRADE_COMPLETE_SETUP.md` - Overall integration
- `SNAPTRADE_UX_GUIDE.md` - Frontend components
- `SNAPTRADE_REFRESH_GUIDE.md` - This file (refresh features)

---

## 🎉 Summary

You now have:
- ✅ **Automatic daily sync** via SnapTrade
- ✅ **Manual refresh** with cost warnings
- ✅ **Visual sync status** indicators
- ✅ **Smart warnings** for recent syncs
- ✅ **Webhook integration** for real-time updates
- ✅ **Professional UX** with proper feedback
- ✅ **Rate limit handling** and error recovery

Users can confidently manage their broker data with clear visibility into sync status and control over when to refresh! 🚀
