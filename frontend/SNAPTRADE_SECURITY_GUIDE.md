# SnapTrade Security & Best Practices

## 🔒 Critical Security Rules

### 1. **NEVER Expose Secrets to Browser**

❌ **NEVER DO THIS:**
```typescript
// ❌ BAD - Sending secrets to client
export async function getClient() {
  return {
    clientId: process.env.SNAPTRADE_CLIENT_ID,
    consumerKey: process.env.SNAPTRADE_CONSUMER_KEY  // ❌ EXPOSED!
  };
}

// ❌ BAD - Client-side API call
const response = await fetch('https://api.snaptrade.com', {
  headers: {
    'ClientId': clientId,
    'ConsumerKey': consumerKey  // ❌ VISIBLE IN NETWORK TAB!
  }
});
```

✅ **ALWAYS DO THIS:**
```typescript
// ✅ GOOD - Server-only
import { snaptrade } from '@/lib/snaptrade';

export async function GET(req: Request) {
  // Runs on server, secrets never leave
  const response = await snaptrade.authentication.loginSnapTradeUser({
    userId: user.st_user_id,
    userSecret: user.st_user_secret  // ✅ Server-only
  });
  
  // Only return public data
  return NextResponse.json({ 
    redirectURI: response.data.redirectURI  // ✅ Safe to expose
  });
}
```

---

### 2. **Never Store Secrets in Client State**

❌ **NEVER DO THIS:**
```typescript
// ❌ BAD - Client component
const [userSecret, setUserSecret] = useState('');

useEffect(() => {
  fetch('/api/snaptrade/user')
    .then(res => res.json())
    .then(data => setUserSecret(data.userSecret)); // ❌ EXPOSED!
}, []);
```

✅ **ALWAYS DO THIS:**
```typescript
// ✅ GOOD - Only expose non-sensitive data
const [userId, setUserId] = useState('');

useEffect(() => {
  fetch('/api/snaptrade/verification')
    .then(res => res.json())
    .then(data => setUserId(data.userId)); // ✅ Safe
}, []);
```

---

### 3. **Database Security**

✅ **GOOD - RLS on `snaptrade_users`:**
```sql
-- Never expose st_user_secret to client
ALTER TABLE public.snaptrade_users ENABLE ROW LEVEL SECURITY;

-- Deny ALL client access
CREATE POLICY "Deny all client access"
  ON public.snaptrade_users
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Only service role can access
-- Access via server routes with SUPABASE_SERVICE_ROLE_KEY only
```

✅ **GOOD - Safe client access:**
```sql
-- Client can view own connections (no secrets)
ALTER TABLE public.snaptrade_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON public.snaptrade_connections
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## ⏰ Portal URL Expiration

### The Problem

Portal URLs expire in **~5 minutes**. If you generate too early, users get an error.

❌ **NEVER DO THIS:**
```typescript
// ❌ BAD - Generate once, reuse
const [portalUrl, setPortalUrl] = useState('');

useEffect(() => {
  generatePortalUrl().then(setPortalUrl);
}, []);

// 10 minutes later...
<a href={portalUrl}>Connect Broker</a>  // ❌ EXPIRED!
```

✅ **ALWAYS DO THIS:**
```typescript
// ✅ GOOD - Generate on-demand
async function handleConnect() {
  // Generate fresh URL right before opening
  const { redirectURI } = await fetch('/api/snaptrade/login-link', {
    method: 'POST',
    body: JSON.stringify({ riskrUserId: user.id })
  }).then(r => r.json());
  
  // Open immediately
  window.open(redirectURI, '_blank');
}

<button onClick={handleConnect}>
  Connect Broker
</button>
```

✅ **GOOD - Store expiration time:**
```typescript
interface PortalSession {
  url: string;
  expiresAt: number;
}

const [portal, setPortal] = useState<PortalSession | null>(null);

async function getPortalUrl() {
  const now = Date.now();
  
  // Check if cached URL is still valid (with 1min buffer)
  if (portal && portal.expiresAt > now + 60000) {
    return portal.url;
  }
  
  // Generate fresh URL
  const { redirectURI } = await fetch('/api/snaptrade/login-link', {
    method: 'POST',
    body: JSON.stringify({ riskrUserId: user.id })
  }).then(r => r.json());
  
  setPortal({
    url: redirectURI,
    expiresAt: now + (5 * 60 * 1000) // 5 minutes
  });
  
  return redirectURI;
}
```

---

## ✅ Broker-Verified Badge Logic

### The Rule

**Badge should ONLY appear if:**
1. ✅ At least one active connection exists
2. ✅ Connection is NOT disabled
3. ✅ Last sync was within **72 hours**

### Implementation

```sql
-- View that calculates verification status
CREATE VIEW public.user_broker_verification AS
SELECT
  u.user_id,
  EXISTS (
    SELECT 1
    FROM public.snaptrade_connections c
    WHERE c.user_id = u.user_id
      AND c.disabled = false  -- Active connection
      AND COALESCE(
        c.last_holdings_sync_at, 
        now() - interval '100 years'
      ) > now() - interval '72 hours'  -- Synced recently
  ) AS is_broker_verified,
  MAX(c.last_holdings_sync_at) AS last_verified_at
FROM public.snaptrade_users u
LEFT JOIN public.snaptrade_connections c ON c.user_id = u.user_id
GROUP BY u.user_id;
```

### Frontend Component

```tsx
export function BrokerVerifiedBadge({ userId }: { userId: string }) {
  const [verified, setVerified] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/snaptrade/verification?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        setVerified(data.isVerified);
        setLastSync(data.lastVerifiedAt);
      });
  }, [userId]);

  // Don't render if not verified
  if (!verified) return null;

  // Check if stale (approaching 72h)
  const syncAge = lastSync 
    ? Date.now() - new Date(lastSync).getTime() 
    : Infinity;
  const hoursOld = syncAge / (1000 * 60 * 60);
  const isStale = hoursOld > 48; // Warning at 48h

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isStale ? "warning" : "success"}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Broker-Verified
      </Badge>
      
      {isStale && (
        <Button size="sm" variant="ghost" onClick={handleRefresh}>
          Refresh
        </Button>
      )}
    </div>
  );
}
```

---

## 🔄 Connection States & Reconnection

### Handle CONNECTION_BROKEN

When webhook receives `CONNECTION_BROKEN`:
1. Set `disabled = true` in database
2. Badge disappears immediately
3. Show "Reconnect" prompt

```typescript
// In webhook handler
case "CONNECTION_BROKEN":
case "CONNECTION_DELETED": {
  await supabase
    .from('snaptrade_connections')
    .update({ disabled: true })
    .eq('authorization_id', payload.brokerageAuthorizationId);
  
  // Optionally notify user
  await notifyUser(userId, 'Your broker connection was lost. Please reconnect.');
  break;
}
```

### Reconnect Flow

```tsx
export function ConnectionStatus({ connection }: { connection: Connection }) {
  if (connection.disabled) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Connection Lost</AlertTitle>
        <AlertDescription>
          Your {connection.brokerName} connection is no longer active.
        </AlertDescription>
        <Button onClick={handleReconnect}>
          Reconnect Now
        </Button>
      </Alert>
    );
  }

  // Check sync age
  const syncAge = connection.lastSync 
    ? Date.now() - new Date(connection.lastSync).getTime()
    : Infinity;
  const hoursOld = syncAge / (1000 * 60 * 60);

  if (hoursOld > 72) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Verification Expired</AlertTitle>
        <AlertDescription>
          Your {connection.brokerName} hasn't synced in {Math.floor(hoursOld / 24)} days.
        </AlertDescription>
        <Button onClick={handleReconnect}>
          Reconnect
        </Button>
      </Alert>
    );
  }

  return <SyncStatusIndicator lastSync={connection.lastSync} />;
}
```

---

## 🎣 Webhooks Are Critical for Scale

### Why Webhooks Matter

**Without webhooks:**
- ❌ Polling every user every minute = expensive
- ❌ 1000 users = 1000 API calls/minute
- ❌ Laggy updates (poll interval delay)
- ❌ Rate limits

**With webhooks:**
- ✅ Instant updates when data changes
- ✅ 1000 users = 0 API calls (until event)
- ✅ Real-time badge updates
- ✅ No polling overhead

### Webhook Setup Priority

```
Priority 1: CONNECTION_ADDED          ← Badge appears instantly
Priority 2: ACCOUNT_HOLDINGS_UPDATED  ← Sync status updates
Priority 3: CONNECTION_BROKEN          ← Badge disappears instantly
Priority 4: CONNECTION_DELETED         ← Cleanup
```

### Polling Fallback (Development Only)

```typescript
// ❌ BAD for production - use webhooks
// ✅ OK for development/testing

let pollInterval: NodeJS.Timeout;

function startPolling(userId: string) {
  pollInterval = setInterval(async () => {
    await fetch(`/api/snaptrade/sync`, {
      method: 'POST',
      body: JSON.stringify({ riskrUserId: userId })
    });
  }, 60000); // Every minute - EXPENSIVE!
}

// ✅ GOOD for production - webhook driven
function setupWebhookListener() {
  // Webhook endpoint handles updates
  // No polling needed
  // Updates happen in < 1 second
}
```

---

## 🛡️ Additional Security Best Practices

### 1. **Environment Variable Security**

```bash
# ✅ GOOD - Server-only secrets
SNAPTRADE_CLIENT_ID=...
SNAPTRADE_CONSUMER_KEY=...  # NEVER expose
SNAPTRADE_WEBHOOK_SECRET=...  # NEVER expose
SUPABASE_SERVICE_ROLE_KEY=...  # NEVER expose

# ✅ OK - Public values
NEXT_PUBLIC_SUPABASE_URL=...  # OK to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  # OK to expose (has RLS)
```

### 2. **API Route Security**

```typescript
// ✅ GOOD - Verify user owns resource
export async function GET(req: Request) {
  const { userId } = await req.json();
  const { user } = await supabase.auth.getUser();
  
  // Prevent access to other users' data
  if (user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Proceed...
}
```

### 3. **Webhook Signature Verification**

```typescript
// ✅ ALWAYS verify webhook signatures
export async function POST(req: Request) {
  const payload = await req.json();
  const signature = req.headers.get('x-snaptrade-signature');
  
  if (!verifyWebhookSignature(payload, signature)) {
    console.error('Invalid webhook signature');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Process webhook...
}
```

### 4. **Cron Job Authentication**

```typescript
// ✅ Protect cron endpoints
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Run cron job...
}
```

---

## 📋 Security Checklist

### Before Production

- [ ] ✅ All secrets are server-only (never sent to browser)
- [ ] ✅ `snaptrade_users` table has RLS denying client access
- [ ] ✅ Portal URLs generated on-demand (not cached)
- [ ] ✅ Badge logic checks 72-hour rule
- [ ] ✅ Webhook signature verification enabled
- [ ] ✅ CONNECTION_BROKEN updates `disabled` flag
- [ ] ✅ Webhook endpoint configured in SnapTrade dashboard
- [ ] ✅ Cron endpoints require authentication
- [ ] ✅ API routes verify user ownership
- [ ] ✅ No polling in production (webhooks only)
- [ ] ✅ Environment variables validated at startup
- [ ] ✅ Service role key only used in server routes
- [ ] ✅ Client uses anon key (protected by RLS)

### Development Testing

- [ ] ✅ Test with expired portal URL
- [ ] ✅ Test CONNECTION_BROKEN webhook
- [ ] ✅ Test badge with 72+ hour old sync
- [ ] ✅ Test reconnection flow
- [ ] ✅ Verify secrets not in browser DevTools
- [ ] ✅ Test webhook signature rejection
- [ ] ✅ Test unauthorized API access
- [ ] ✅ Test cron job authentication

---

## 🚨 Common Security Mistakes

### 1. **Leaking User Secret**

❌ **WRONG:**
```typescript
// API route returns secret
return NextResponse.json({
  userId: user.st_user_id,
  userSecret: user.st_user_secret  // ❌ EXPOSED TO CLIENT!
});
```

✅ **CORRECT:**
```typescript
// Only return non-sensitive data
return NextResponse.json({
  userId: user.st_user_id  // ✅ Safe (it's just an ID)
  // userSecret intentionally omitted
});
```

---

### 2. **Client-Side SnapTrade Calls**

❌ **WRONG:**
```typescript
// Client component making direct API call
const positions = await fetch('https://api.snaptrade.com/accounts/positions', {
  headers: {
    'Authorization': `Bearer ${userSecret}`  // ❌ EXPOSED!
  }
});
```

✅ **CORRECT:**
```typescript
// Call your server route, which calls SnapTrade
const positions = await fetch('/api/snaptrade/positions', {
  method: 'POST',
  body: JSON.stringify({ 
    riskrUserId: user.id,  // ✅ Your user ID
    accountId: account.id
  })
});

// Server route (route.ts) calls SnapTrade with secrets
```

---

### 3. **Storing Portal URL**

❌ **WRONG:**
```typescript
// Store in localStorage
localStorage.setItem('portalUrl', url);

// Use hours later
const url = localStorage.getItem('portalUrl');
window.open(url);  // ❌ EXPIRED!
```

✅ **CORRECT:**
```typescript
// Generate fresh every time
async function openPortal() {
  const { redirectURI } = await fetch('/api/snaptrade/login-link', {
    method: 'POST',
    body: JSON.stringify({ riskrUserId: user.id })
  }).then(r => r.json());
  
  window.open(redirectURI, '_blank');
}
```

---

### 4. **Forgetting 72-Hour Rule**

❌ **WRONG:**
```tsx
// Show badge if connection exists
{connection && <BrokerVerifiedBadge />}
```

✅ **CORRECT:**
```tsx
// Check active + recent sync
{connection && 
 !connection.disabled && 
 isWithin72Hours(connection.lastSync) && 
 <BrokerVerifiedBadge />}
```

---

## 🎯 Summary

### Critical Security Rules

1. ✅ **NEVER expose secrets to browser**
   - `consumerKey`, `userSecret` are server-only
   
2. ✅ **Generate portal URLs on-demand**
   - They expire in 5 minutes
   
3. ✅ **Verify badge logic**
   - Active connection + synced within 72h
   
4. ✅ **Use webhooks for scale**
   - Polling is expensive and laggy
   
5. ✅ **Verify webhook signatures**
   - Prevent spoofing attacks
   
6. ✅ **Handle connection states**
   - Broken connections disable badge
   
7. ✅ **Protect API routes**
   - Verify user ownership
   
8. ✅ **Secure cron jobs**
   - Require authentication

### Testing Security

```bash
# 1. Check browser Network tab - no secrets visible
# 2. Check localStorage/sessionStorage - no secrets
# 3. Test expired portal URL - shows error
# 4. Test webhook with invalid signature - rejected
# 5. Test API with other user's ID - denied
# 6. Test badge with 72+ hour sync - hidden
```

**Follow these rules and your SnapTrade integration will be secure!** 🔒✅

