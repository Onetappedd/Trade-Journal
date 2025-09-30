# SnapTrade Frontend UX Guide

## 🎨 Components Overview

This guide covers all the frontend components for the SnapTrade broker connection integration.

---

## 📦 Components Created

### 1. **ConnectBrokerButton** (New Window Approach)
**File:** `components/snaptrade/ConnectBrokerButton.tsx`

Opens SnapTrade portal in a new window and listens for success/error messages.

**Props:**
```typescript
interface ConnectBrokerButtonProps {
  userId: string;              // Current user's UUID
  onSuccess?: () => void;      // Called after successful connection
  onError?: (error: string) => void;  // Called on error
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}
```

**Usage:**
```tsx
<ConnectBrokerButton
  userId={user.id}
  onSuccess={() => {
    // Refetch connections, update UI, etc.
    router.refresh();
  }}
  onError={(error) => {
    console.error('Connection failed:', error);
  }}
/>
```

**Features:**
- ✅ Auto-registers user if not already registered
- ✅ Opens portal in popup window (480x760)
- ✅ Listens for window messages (SUCCESS/ERROR)
- ✅ Auto-syncs data after successful connection
- ✅ Shows toast notifications
- ✅ Handles popup blockers gracefully
- ✅ Detects when user cancels connection

---

### 2. **ConnectBrokerModal** (Iframe Approach)
**File:** `components/snaptrade/ConnectBrokerModal.tsx`

Embeds SnapTrade portal in a modal using iframe (keeps user in-app).

**Props:**
```typescript
interface ConnectBrokerModalProps {
  userId: string;
  open?: boolean;                    // Controlled state
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  trigger?: React.ReactNode;         // Custom trigger element
}
```

**Usage (Uncontrolled):**
```tsx
<ConnectBrokerModal
  userId={user.id}
  trigger={
    <Button>
      <Shield className="h-4 w-4 mr-2" />
      Connect Broker
    </Button>
  }
  onSuccess={() => router.refresh()}
/>
```

**Usage (Controlled):**
```tsx
const [isOpen, setIsOpen] = useState(false);

<ConnectBrokerModal
  userId={user.id}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => {
    setIsOpen(false);
    router.refresh();
  }}
/>
```

**Features:**
- ✅ Embeds portal in 80vh modal
- ✅ Loads portal URL dynamically
- ✅ Shows loading state
- ✅ Controlled or uncontrolled state
- ✅ Custom trigger support
- ✅ Auto-syncs on success

---

### 3. **BrokerVerifiedBadge**
**File:** `components/snaptrade/BrokerVerifiedBadge.tsx`

Displays a green shield check badge for verified users with tooltip.

**Props:**
```typescript
interface BrokerVerifiedBadgeProps {
  verified: boolean;           // From user_broker_verification view
  lastSync?: string;           // ISO timestamp
  brokers?: string[];          // Display names (e.g., ["Robinhood", "Schwab"])
  showLabel?: boolean;         // Show "Verified" text
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

**Usage:**
```tsx
<BrokerVerifiedBadge
  verified={true}
  lastSync="2025-01-15T12:00:00Z"
  brokers={["Robinhood", "Charles Schwab"]}
  size="md"
  showLabel={true}
/>
```

**Features:**
- ✅ Green shield check icon (lucide-react)
- ✅ Tooltip with broker details on hover
- ✅ Shows last sync time (formatted: "2h ago", "1d ago")
- ✅ Lists connected brokers as pills
- ✅ "Read-only access" disclaimer
- ✅ Three sizes (sm, md, lg)
- ✅ Optional label text
- ✅ Accessible (screen reader support)

**Hook:**
```tsx
const { verified, lastSync, brokers } = useBrokerVerification(user.id);

<BrokerVerifiedBadge 
  verified={verified}
  lastSync={lastSync}
  brokers={brokers}
/>
```

---

### 4. **BrokerConnectionsExample**
**File:** `components/snaptrade/BrokerConnectionsExample.tsx`

Full reference implementation showing connections list with sync controls.

**Features:**
- ✅ Lists all connections
- ✅ Shows account details (balance, last sync)
- ✅ Sync button for each connection
- ✅ Delete connection button
- ✅ Empty state with connect button
- ✅ Loading states
- ✅ Verification badge in header

---

## 🔗 API Endpoint

### `/api/snaptrade/verification`

**File:** `app/api/snaptrade/verification/route.ts`

Returns broker verification status for badge.

**Request:**
```
GET /api/snaptrade/verification?userId=uuid
```

**Response:**
```json
{
  "verified": true,
  "lastSync": "2025-01-15T12:00:00Z",
  "brokers": ["Robinhood", "Charles Schwab"]
}
```

**Broker Display Names:**
Maps slugs to friendly names:
- `ROBINHOOD` → "Robinhood"
- `SCHWAB` → "Charles Schwab"
- `TD_AMERITRADE` → "TD Ameritrade"
- `E_TRADE` → "E*TRADE"
- `FIDELITY` → "Fidelity"
- etc.

---

## 🎯 Where to Display the Badge

### 1. **Navbar / Profile Header**
```tsx
<div className="flex items-center gap-2">
  <Avatar>
    <AvatarImage src={user.avatar} />
    <AvatarFallback>{user.initials}</AvatarFallback>
  </Avatar>
  <div>
    <div className="flex items-center gap-2">
      <span className="font-medium">{user.name}</span>
      <BrokerVerifiedBadge 
        verified={verified}
        lastSync={lastSync}
        brokers={brokers}
        size="sm"
      />
    </div>
    <span className="text-sm text-muted-foreground">@{user.username}</span>
  </div>
</div>
```

### 2. **Public Profile Card**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-start justify-between">
      <div>
        <CardTitle className="flex items-center gap-2">
          {user.name}
          <BrokerVerifiedBadge 
            verified={verified}
            lastSync={lastSync}
            brokers={brokers}
            showLabel={false}
          />
        </CardTitle>
        <CardDescription>@{user.username}</CardDescription>
      </div>
    </div>
  </CardHeader>
</Card>
```

### 3. **Leaderboard / Player Cards**
```tsx
<div className="flex items-center justify-between p-4">
  <div className="flex items-center gap-3">
    <Avatar />
    <div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{user.name}</span>
        <BrokerVerifiedBadge 
          verified={verified}
          size="sm"
          showLabel={false}
        />
      </div>
    </div>
  </div>
  <div className="text-right">
    <div className="text-2xl font-bold">+24.5%</div>
    <div className="text-sm text-muted-foreground">P&L</div>
  </div>
</div>
```

---

## 🔄 Complete Integration Flow

### Step 1: User Clicks "Connect Broker"

```tsx
// Option A: New Window (Simpler)
<ConnectBrokerButton 
  userId={user.id}
  onSuccess={handleSuccess}
/>

// Option B: Modal (Keeps in-app)
<ConnectBrokerModal 
  userId={user.id}
  onSuccess={handleSuccess}
/>
```

### Step 2: Portal Opens
- User sees SnapTrade portal
- Selects their broker
- Authenticates with broker credentials
- Authorizes read-only access

### Step 3: Connection Success
- SnapTrade sends SUCCESS message
- Component auto-syncs data
- Shows success toast
- Calls `onSuccess` callback

### Step 4: Data Synced
- Connections stored in database
- Accounts synced with balances
- `last_holdings_sync_at` updated
- Verification status calculated

### Step 5: Badge Appears
- `user_broker_verification` view updates
- Badge shows on profile
- Tooltip displays broker names
- User is verified! ✅

---

## 🎨 Design Patterns

### Button Variants

```tsx
// Primary CTA
<ConnectBrokerButton userId={user.id} variant="default" />

// Secondary
<ConnectBrokerButton userId={user.id} variant="outline" />

// Subtle
<ConnectBrokerButton userId={user.id} variant="ghost" />

// Small
<ConnectBrokerButton userId={user.id} size="sm" />
```

### Badge Sizes

```tsx
// Small (for compact spaces)
<BrokerVerifiedBadge verified={true} size="sm" showLabel={false} />

// Medium (default, for profiles)
<BrokerVerifiedBadge verified={true} size="md" />

// Large (for headers)
<BrokerVerifiedBadge verified={true} size="lg" />
```

### Empty States

```tsx
{connections.length === 0 && (
  <Card>
    <CardContent className="py-12 text-center">
      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="font-semibold mb-2">No broker connections</h3>
      <p className="text-muted-foreground mb-4">
        Connect your broker to get verified and auto-import trades
      </p>
      <ConnectBrokerButton userId={user.id} />
    </CardContent>
  </Card>
)}
```

---

## 🔔 Toast Notifications

All components use `sonner` for consistent notifications:

```tsx
// Success
toast.success("Broker connected successfully!", {
  description: "Syncing your account data..."
});

// Error
toast.error("Connection failed", {
  description: "Please try again or contact support"
});

// Info
toast.info("Connection cancelled");

// With action
toast.success("Data synced", {
  description: "2 connections, 3 accounts",
  action: {
    label: "View",
    onClick: () => router.push('/dashboard/brokers')
  }
});
```

---

## 🧪 Testing Checklist

- [ ] Button opens portal correctly
- [ ] Portal authenticates with test broker
- [ ] SUCCESS message received after connection
- [ ] Data auto-syncs after success
- [ ] Toast notifications appear
- [ ] Badge appears after sync
- [ ] Badge tooltip shows correct info
- [ ] Badge shows broker names correctly
- [ ] Badge updates when sync status changes
- [ ] Badge disappears when connection disabled
- [ ] Popup blocker handling works
- [ ] Modal iframe loads correctly
- [ ] Modal close button works
- [ ] Verification API returns correct data

---

## 🎯 Best Practices

### 1. **Always Auto-Sync After Connection**
```tsx
<ConnectBrokerButton
  userId={user.id}
  onSuccess={async () => {
    // Sync is automatic, just refresh UI
    await refetchConnections();
    router.refresh();
  }}
/>
```

### 2. **Show Badge Everywhere User's Name Appears**
- Navbar
- Profile page
- Public profile cards
- Leaderboards
- Comments/posts
- Anywhere reputation matters

### 3. **Explain Verification Clearly**
```tsx
<div className="text-sm text-muted-foreground">
  <Shield className="inline h-4 w-4 text-emerald-600 mr-1" />
  Verified brokers are connected via SnapTrade with read-only access.
  Your credentials are never stored.
</div>
```

### 4. **Handle Edge Cases**
```tsx
// User closes popup without connecting
if (popup?.closed && loading) {
  toast.info("Connection cancelled");
}

// Connection expired (72h)
if (verified && lastSyncAge > 72) {
  toast.warning("Verification expiring soon", {
    description: "Sync your broker to stay verified",
    action: {
      label: "Sync Now",
      onClick: () => syncNow()
    }
  });
}
```

---

## 📚 Component Dependencies

All components require:
- ✅ `@/components/ui/button` (shadcn/ui)
- ✅ `@/components/ui/dialog` (shadcn/ui)
- ✅ `@/components/ui/tooltip` (shadcn/ui)
- ✅ `lucide-react` (icons)
- ✅ `sonner` (toast notifications)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install sonner lucide-react
```

### 2. Add Components
Copy all components to `components/snaptrade/`

### 3. Use in Your App
```tsx
import ConnectBrokerButton from '@/components/snaptrade/ConnectBrokerButton';
import { BrokerVerifiedBadge } from '@/components/snaptrade/BrokerVerifiedBadge';

export default function ProfilePage({ user }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h1>{user.name}</h1>
        <BrokerVerifiedBadge 
          verified={user.brokerVerified}
          lastSync={user.lastSync}
          brokers={user.brokers}
        />
      </div>
      
      <ConnectBrokerButton userId={user.id} />
    </div>
  );
}
```

---

## 🎉 You're Ready!

Your frontend UX is now complete with:
- ✅ Beautiful broker connection flow
- ✅ Professional verified badge
- ✅ Consistent notifications
- ✅ Mobile-responsive design
- ✅ Accessible components
- ✅ TypeScript type safety

Users will love the seamless experience! 🚀
