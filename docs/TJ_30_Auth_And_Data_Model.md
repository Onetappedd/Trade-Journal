# Trade-Journal Auth & Data Flow

**Document Version**: 1.0  
**Last Updated**: 2025-01-18

---

## 1. Authentication Model

### Technology

- **Provider**: Supabase Auth
- **Session Management**: JWT tokens stored in HTTP-only cookies
- **Client SDK**: `@supabase/supabase-js` for client-side, `@supabase/ssr` for server-side

### Client Creation Patterns

**Browser Client** (`lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
**Used in**: Client components, React hooks

**Server Client** (`lib/supabase/server.ts`):
```typescript
export function getServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value }
      }
    }
  )
}
```
**Used in**: Server Components, middleware

**Admin Client**:
```typescript
export function createSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```
**Used in**: Admin operations, bypassing RLS

### AuthProvider (`providers/auth-provider.tsx`)

**Purpose**: Global authentication state via React Context

**Provides**:
- `user`: Current user object
- `session`: Current session (includes access token)
- `loading`: Boolean for auth state loading
- `supabase`: Supabase client instance

**Initialization**: Calls `supabase.auth.getSession()` on mount, sets up `onAuthStateChange` listener

**Usage**:
```typescript
const { user, session, loading } = useAuth()
```

### Route Protection

**Middleware** (`middleware.ts`):
- Intercepts requests to protected routes
- Checks for valid session via `getServerSupabase().auth.getSession()`
- Redirects unauthenticated users to `/login?redirectTo={path}`
- Protected routes: `/dashboard/*`, `/trades/*`, `/import/*`, `/analytics/*`, `/settings/*`

**Server-Side Guards**:
- `getUserOrRedirect()` helper in pages
- Checks auth before rendering
- Throws redirect if no user

---

## 2. Data Flow Patterns

### Pattern 1: Client → API Route → Supabase

**Flow**:
```
Client Component → fetch('/api/trades') → API Route → Supabase → Database
```

**Example** (Fetching Trades):
1. Client: `fetch('/api/trades', { headers: { Authorization: Bearer ${token} } })`
2. API Route: Validates token, creates Supabase client
3. Supabase: Executes `supabase.from('trades').select().eq('user_id', user.id)`
4. RLS: Filters trades by authenticated user
5. Response: Returns trades to client

**Advantages**:
- Centralized business logic
- Easy to add caching, rate limiting
- Hides database structure from client

### Pattern 2: Client → Direct Supabase

**Flow**:
```
Client Component → Supabase Client → Supabase → Database
```

**Example** (Real-time Subscriptions):
```typescript
const supabase = createSupabaseClient()
const { data, error } = await supabase
  .from('trades')
  .select('*')
  .eq('user_id', user.id)
```

**Used for**:
- Simple queries
- Real-time subscriptions
- Rapid prototyping

**Note**: Less common in this app, most data flows through API routes

### Pattern 3: Server Component → Supabase

**Flow**:
```
Server Component → getServerSupabase() → Supabase → Database
```

**Example** (Dashboard Page):
```typescript
export default async function DashboardPage() {
  const supabase = getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
  
  return <DashboardClient trades={trades} />
}
```

**Advantages**:
- No client-side API call (faster initial render)
- SEO-friendly (data in HTML)
- Reduced client bundle size

---

## 3. State Management Layers

### Server State (API Data)

**React Query** (`@tanstack/react-query`):
- **Purpose**: Fetch, cache, and sync server state
- **Configuration**: Global `QueryClient` in `app/providers.tsx`
- **Usage**:
  ```typescript
  const { data, isLoading } = useQuery({
    queryKey: ['trades', userId],
    queryFn: () => fetch('/api/trades').then(res => res.json())
  })
  ```
- **Cache Invalidation**: `queryClient.invalidateQueries(['trades'])`

**SWR** (legacy):
- **Purpose**: Same as React Query, but older approach
- **Usage**: `const { data } = useSWR('/api/trades', fetcher)`
- **Status**: Being phased out in favor of React Query

### Client State (UI State)

**Zustand**:
- **Purpose**: Global client-side state
- **Example**: `store/analytics-filters.ts` (filter selections)
- **Usage**:
  ```typescript
  const { timeframe, setTimeframe } = useAnalyticsFilters()
  ```

**React Context**:
- **Purpose**: Auth state, theme
- **Examples**: `AuthProvider`, `ThemeProvider`

**Local State**:
- **Purpose**: Component-specific state
- **Usage**: `useState`, `useReducer`

### Form State

**React Hook Form** + **Zod**:
- **Purpose**: Form management with validation
- **Usage**:
  ```typescript
  const form = useForm({
    resolver: zodResolver(TradeSchema)
  })
  ```

---

## 4. Database Access Patterns

### Row Level Security (RLS)

**Enforcement**: Every Supabase query automatically filtered by RLS policies

**User-Scoped Queries**:
```sql
-- RLS Policy Example
CREATE POLICY "Users can view their own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);
```

**Effect**: Even if client tries to fetch all trades, RLS ensures only user's trades returned

### Admin Access

**Bypass RLS**: Use service role key (admin client)
```typescript
const supabaseAdmin = createSupabaseAdmin() // Uses SUPABASE_SERVICE_ROLE_KEY
// Can access all data regardless of user_id
```

**When Used**:
- SnapTrade webhooks (update any user's data)
- Admin operations (user management)
- Cron jobs (daily snapshots for all users)

### Caching Strategy

**API Route Level** (`unstable_cache`):
```typescript
const getCachedTrades = unstable_cache(
  async (userId) => getTrades(userId),
  ['trades'],
  { revalidate: 60, tags: ['trades', 'user'] }
)
```

**Client Level** (React Query/SWR):
- Stale-while-revalidate
- Refetch on window focus
- Manual invalidation on mutations

---

## 5. Data Relationships

### Key Foreign Keys

- `trades.user_id` → `auth.users.id` (ON DELETE CASCADE)
- `trades.ingestion_run_id` → `import_runs.id`
- `import_runs.user_id` → `auth.users.id` (ON DELETE CASCADE)
- `profiles.id` → `auth.users.id` (1:1 relationship)
- `snaptrade_users.user_id` → `auth.users.id` (1:1 relationship)
- `snaptrade_connections.user_id` → `auth.users.id` (1:many)
- `snaptrade_accounts.user_id` → `auth.users.id` (1:many)

### Data Cascade on User Deletion

When user deleted from `auth.users`:
1. Profile deleted (`profiles`)
2. All trades deleted (`trades`)
3. All import runs deleted (`import_runs`)
4. All SnapTrade data deleted (`snaptrade_*`)
5. All settings deleted (`user_prefs`)

---

## 6. Environment Variables

**Client-Safe** (prefixed with `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_E2E_TEST`
- `NEXT_PUBLIC_IMPORT_V2_ENABLED`

**Server-Only** (NEVER exposed to client):
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SNAPTRADE_CLIENT_ID`
- `SNAPTRADE_CONSUMER_KEY`

**Validation**: `scripts/check-client-secrets.js` runs during build to prevent leaks

---

**End of Document**

