# Trade-Journal Feature Deep Dive: Authentication

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Feature**: User Authentication & Session Management

---

## 1. User Story / Overview

### What Users See and Can Do

**Unauthenticated Users**:
- Access the marketing landing page (`/`)
- Sign up for a new account (`/auth/signup`)
- Log in to existing account (`/auth/login`)
- Reset forgotten password (`/auth/reset-password`)

**Authenticated Users**:
- Automatic session persistence across browser sessions
- Automatic redirect to dashboard after login
- Session-based access to all protected features
- Ability to log out from user menu

**Where It Lives in the UI**:
- Login page: `/auth/login`
- Signup page: `/auth/signup`
- Password reset: `/auth/reset-password`
- User menu: Top-right of AppShell (all protected pages)

### Core Functionality

1. **Email/Password Authentication**: Users can create accounts and log in with email + password
2. **Session Management**: Persistent sessions via Supabase Auth cookies
3. **Route Protection**: Middleware automatically redirects unauthenticated users
4. **Profile Creation**: User profile automatically created in `profiles` table on signup
5. **Password Reset Flow**: Email-based password reset via Supabase
6. **OAuth (Planned)**: Google OAuth marked as TODO

---

## 2. UI Components

### Login Page (`app/auth/login/page.tsx`)

**File Path**: `Trade-Journal/frontend/app/auth/login/page.tsx`

**Component Structure**:
- Client component (`"use client"`)
- Form with email and password fields
- Google OAuth button (placeholder, not implemented)
- "Remember me" checkbox
- "Forgot password?" link → `/auth/reset`
- "Sign up" link → `/auth/signup`

**Key UI Elements**:
- `FormField`: Email input (with validation)
- `FormField`: Password input (masked)
- `SubmitButton`: "Sign In" button (with loading state)
- `Button`: Google OAuth button (placeholder)
- `toast`: Notifications for success/error

**Validation**:
- Email: Required, valid email format
- Password: Required (no complexity check on login)

**User Experience**:
- Real-time field validation on blur
- Error messages displayed inline
- Toast notification on success/failure
- Automatic redirect to `/dashboard` on success
- Disabled submit button if validation errors exist

### Signup Page (`app/auth/signup/page.tsx`)

**File Path**: `Trade-Journal/frontend/app/auth/signup/page.tsx`

**Component Structure**:
- Client component (`"use client"`)
- Form with username, email, password, confirm password
- Google OAuth button (placeholder)
- Terms & Privacy checkbox
- "Sign in" link → `/auth/login`

**Key UI Elements**:
- `FormField`: Username input (3+ characters, alphanumeric + underscore)
- `FormField`: Email input (with validation)
- `FormField`: Password input (8+ chars, mixed case + number)
- `FormField`: Confirm Password input (must match password)
- Checkbox: Accept terms and privacy policy
- `SubmitButton`: "Create Account" button
- Links to `/legal/terms` and `/legal/privacy`

**Validation Rules**:
- **Username**: 
  - Required
  - Minimum 3 characters
  - Only letters, numbers, and underscores
  - Pattern: `/^[a-zA-Z0-9_]+$/`
- **Email**: 
  - Required
  - Valid email format
  - Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password**:
  - Required
  - Minimum 8 characters
  - Must contain uppercase, lowercase, and number
  - Pattern: `/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/`
- **Confirm Password**:
  - Required
  - Must exactly match password
- **Terms Acceptance**:
  - Required
  - Must be checked

**User Experience**:
- Real-time validation feedback
- Helper text under fields ("At least 8 characters with uppercase, lowercase, and number")
- Error messages inline
- Toast notification on success/error
- Redirect to `/auth/login` after successful signup
- Email verification may be required (Supabase config dependent)

### Password Reset Page (`app/auth/reset-password/page.tsx`)

**File Path**: `Trade-Journal/frontend/app/auth/reset-password/page.tsx`

**Functionality**:
- User enters email address
- Backend calls `supabase.auth.resetPasswordForEmail()`
- User receives email with reset link
- Clicking link brings user back to app with token
- User sets new password

---

## 3. State & Data Fetching

### AuthProvider (`providers/auth-provider.tsx`)

**File Path**: `Trade-Journal/frontend/providers/auth-provider.tsx`

**Purpose**: Global authentication state management via React Context

**State Provided**:
- `user`: Current authenticated user object (from Supabase)
- `session`: Current Supabase session (includes access token)
- `loading`: Boolean indicating if auth state is being loaded
- `supabase`: Supabase client instance

**How It Works**:
1. Component mounts and initializes Supabase client
2. Calls `supabase.auth.getSession()` to restore session from cookies
3. Sets up auth state change listener via `supabase.auth.onAuthStateChange()`
4. Updates `user` and `session` state when auth state changes (login, logout, token refresh)
5. Provides context to all child components

**Usage in Components**:
```typescript
import { useAuth } from '@/providers/auth-provider'

function MyComponent() {
  const { user, session, loading, supabase } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <LoginPrompt />
  
  return <AuthenticatedContent />
}
```

**Key Methods**:
- `supabase.auth.signInWithPassword()`: Email/password login
- `supabase.auth.signUp()`: Create new account
- `supabase.auth.signOut()`: Log out
- `supabase.auth.resetPasswordForEmail()`: Password reset
- `supabase.auth.getSession()`: Get current session
- `supabase.auth.onAuthStateChange()`: Listen for auth events

### Supabase Client Creation

#### Client-Side (`lib/supabase/client.ts`)

**File Path**: `Trade-Journal/frontend/lib/supabase/client.ts`

**Purpose**: Browser-side Supabase client for client components

**Implementation**:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createSupabaseClient()
```

**Used In**:
- Client components (`'use client'`)
- React hooks
- `AuthProvider`

#### Server-Side (`lib/supabase/server.ts`)

**File Path**: `Trade-Journal/frontend/lib/supabase/server.ts`

**Purpose**: Server-side Supabase clients for Server Components, API routes, and middleware

**Key Functions**:

1. **`getServerSupabase()`**: For Server Components
   ```typescript
   export function getServerSupabase() {
     const cookieStore = cookies()
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get(name: string) {
             return cookieStore.get(name)?.value
           }
         }
       }
     )
   }
   ```

2. **`createSupabaseWithToken()`**: For API routes with Bearer token
   ```typescript
   export function createSupabaseWithToken(request: NextRequest) {
     const authHeader = request.headers.get('authorization')
     const token = authHeader?.replace('Bearer ', '')
     
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         global: {
           headers: {
             Authorization: `Bearer ${token}`
           }
         }
       }
     )
   }
   ```

3. **`createSupabaseAdmin()`**: For admin operations (bypasses RLS)
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

**Used In**:
- Server Components
- API Routes (`/api/*`)
- Middleware (`middleware.ts`)
- Server Actions

### getUserOrRedirect Helper

**File Path**: `Trade-Journal/frontend/lib/auth/getUserOrThrow.ts`

**Purpose**: Server-side helper to get authenticated user or redirect to login

**Usage**:
```typescript
export default async function TradesPage() {
  const user = await getUserOrRedirect('/trades')
  return <TradesClient />
}
```

**Behavior**:
- Gets Supabase server client
- Calls `supabase.auth.getUser()`
- If user exists: returns user object
- If no user: throws redirect to `/login?redirectTo={path}`

---

## 4. API Routes

### No Dedicated Auth API Routes

**Note**: The Trade-Journal app does **not** have dedicated auth API routes like `/api/auth/login` or `/api/auth/signup`. Instead, authentication is handled **directly** by Supabase Auth from the client or server components.

**Why?**
- Supabase Auth provides a complete auth solution
- Client SDKs (`@supabase/supabase-js`, `@supabase/ssr`) handle all auth operations
- No need for custom backend auth logic

**Exception**:
- OAuth callback handling may use Next.js API routes if implemented

---

## 5. Database / Supabase

### Tables Used

#### `auth.users` (Supabase Auth Table)

**Managed By**: Supabase Auth service

**Columns (Key Ones)**:
- `id` (UUID): Unique user ID
- `email` (TEXT): User's email
- `encrypted_password` (TEXT): Hashed password
- `email_confirmed_at` (TIMESTAMPTZ): Email verification timestamp
- `created_at` (TIMESTAMPTZ): Account creation time
- `updated_at` (TIMESTAMPTZ): Last update time
- `last_sign_in_at` (TIMESTAMPTZ): Last login time

**Access**:
- Not directly accessed by application code
- Managed entirely by Supabase Auth
- User data exposed via `supabase.auth.getUser()` and session tokens

#### `profiles` (Application Table)

**File Reference**: Schema defined in Supabase migration

**Columns**:
- `id` (UUID, PK, FK to `auth.users.id`): User ID
- `email` (TEXT, NOT NULL): User's email
- `username` (TEXT, UNIQUE): Unique username
- `full_name` (TEXT): User's full name
- `avatar_url` (TEXT): URL to user's avatar
- `created_at` (TIMESTAMPTZ): Profile creation time
- `updated_at` (TIMESTAMPTZ): Last update time
- `role` (ENUM: 'free', 'pro', 'admin'): User's role
- `subscription_status` (ENUM: 'trial', 'active', 'cancelled', 'expired'): Subscription state
- `trial_ends_at` (TIMESTAMPTZ): Trial expiration
- `subscription_ends_at` (TIMESTAMPTZ): Subscription expiration
- `stripe_customer_id` (TEXT): Stripe customer ID
- `stripe_subscription_id` (TEXT): Stripe subscription ID

**Purpose**:
- Extends Supabase Auth user with application-specific data
- Stores subscription and role information
- Linked 1:1 with `auth.users` via `id` foreign key

**Creation**:
- Automatically created when user signs up (via trigger or application logic)
- Initial values:
  - `role`: 'free'
  - `subscription_status`: 'trial'
  - `trial_ends_at`: Set by trigger (`trigger_set_user_trial`)

**RLS Policies**:
- Users can view their own profile
- Users can update their own profile
- Admins can view and update all profiles
- Service role can insert profiles (for signup flow)

### Triggers

#### `trigger_set_user_trial`

**File**: Supabase migration

**Purpose**: Automatically set trial period when profile is created

**Trigger**:
- `BEFORE INSERT` on `profiles` table

**Behavior**:
- Sets `trial_ends_at` to 14 days from signup
- Sets initial `subscription_status` to 'trial'

### Row Level Security (RLS)

**Profiles Table**:
- **INSERT**: 
  - Users can insert their own profile (on signup)
  - Admins can insert any profile
- **SELECT**: 
  - Users can select their own profile (`auth.uid() = id`)
  - Admins can select all profiles
- **UPDATE**: 
  - Users can update their own profile
  - Admins can update all profiles
- **DELETE**: 
  - Typically restricted (not allowed by users)
  - Admins may have delete permission

**Implementation Example** (RLS Policy):
```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## 6. Edge Cases & TODOs

### Known TODOs

1. **Google OAuth Not Implemented**
   - **Location**: `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`
   - **Comment**: `// TODO: Implement Google OAuth`
   - **Current Behavior**: Button is visible but shows placeholder toast when clicked
   - **Priority**: Medium (nice-to-have, email/password works)

2. **Email Verification**
   - **Status**: Dependent on Supabase project configuration
   - **Behavior**: 
     - If email verification is enabled in Supabase: user must verify email before logging in
     - If disabled: user can log in immediately after signup
   - **Current Code**: Does not explicitly enforce email verification in UI

3. **2FA / MFA**
   - **Status**: Not implemented
   - **Supabase Support**: Supabase Auth supports MFA
   - **Integration**: Would require adding MFA setup flow in settings

4. **Session Expiration Handling**
   - **Current Behavior**: Supabase Auth automatically refreshes tokens
   - **Edge Case**: If refresh fails (network issue, revoked session), user sees API errors
   - **Improvement**: Add global error handler to detect expired session and redirect to login

### Edge Cases

1. **User Deletes Account on Supabase**
   - **Behavior**: If user is deleted from `auth.users`, profile and all related data cascade deleted (due to `ON DELETE CASCADE`)
   - **UI Impact**: User immediately logged out, all data removed

2. **Profile Creation Failure**
   - **Scenario**: User signs up via Supabase Auth, but profile insertion fails
   - **Result**: User exists in `auth.users` but not in `profiles`
   - **Impact**: User can log in but app may break when querying `profiles`
   - **Mitigation**: Should have application-level check to create profile if missing

3. **Concurrent Logins**
   - **Behavior**: User can log in from multiple devices simultaneously
   - **Session Management**: Each device gets its own session token
   - **Logout**: Logging out on one device does not affect other sessions (unless global logout implemented)

4. **Password Reset Race Condition**
   - **Scenario**: User requests password reset, then logs in with old password before email arrives
   - **Behavior**: Password reset link may still be valid (depending on Supabase config)

5. **Middleware Bypass in E2E Tests**
   - **Code**: `if (process.env.NEXT_PUBLIC_E2E_TEST === 'true') { return NextResponse.next() }`
   - **Risk**: If this env var is accidentally set in production, auth is bypassed
   - **Mitigation**: Ensure `NEXT_PUBLIC_E2E_TEST` is never set in production deployments

---

## 7. Authentication Flow Diagrams

### Login Flow

```
User visits /auth/login
  │
  ├─→ Enters email/password
  │
  ├─→ Client-side validation (email format, password presence)
  │
  ├─→ Calls supabase.auth.signInWithPassword()
  │     │
  │     ├─→ [SUCCESS] Supabase returns session + user
  │     │     │
  │     │     ├─→ Session stored in cookies
  │     │     │
  │     │     ├─→ AuthProvider updates context
  │     │     │
  │     │     ├─→ Toast: "Login Successful"
  │     │     │
  │     │     └─→ Redirect to /dashboard (or redirectTo param)
  │     │
  │     └─→ [FAILURE] Supabase returns error
  │           │
  │           ├─→ Toast: "Invalid email or password"
  │           │
  │           └─→ User remains on login page
```

### Signup Flow

```
User visits /auth/signup
  │
  ├─→ Enters username, email, password, confirm password
  │
  ├─→ Checks "Accept Terms" checkbox
  │
  ├─→ Client-side validation (all fields, password complexity, terms acceptance)
  │
  ├─→ Calls supabase.auth.signUp()
  │     │
  │     ├─→ [SUCCESS] Supabase creates user in auth.users
  │     │     │
  │     │     ├─→ (Trigger or app logic) Creates profile in profiles table
  │     │     │
  │     │     ├─→ (If email verification enabled) Sends verification email
  │     │     │
  │     │     ├─→ Toast: "Account Created. Please check your email to verify."
  │     │     │
  │     │     └─→ Redirect to /auth/login
  │     │
  │     └─→ [FAILURE] Supabase returns error (e.g., email already exists)
  │           │
  │           ├─→ Toast: "Signup Failed. An account with this email already exists."
  │           │
  │           └─→ User remains on signup page
```

### Middleware Auth Check (Protected Routes)

```
User navigates to /dashboard (or any protected route)
  │
  ├─→ Middleware intercepts request
  │
  ├─→ Checks if route is protected (matches config.matcher)
  │
  ├─→ Calls getServerSupabase().auth.getSession()
  │     │
  │     ├─→ [VALID SESSION] Session exists and not expired
  │     │     │
  │     │     └─→ Middleware allows request to proceed
  │     │           │
  │     │           └─→ Page renders with authenticated content
  │     │
  │     └─→ [NO SESSION] No session or expired
  │           │
  │           ├─→ Middleware creates redirect response
  │           │     │
  │           │     └─→ Redirect to /login?redirectTo=/dashboard
  │           │
  │           └─→ User sees login page
```

---

## 8. Security Considerations

### Password Security
- **Storage**: Passwords hashed by Supabase Auth (bcrypt)
- **Transmission**: HTTPS only (enforced in production)
- **Complexity**: Enforced on signup (8+ chars, mixed case + number)

### Session Management
- **Storage**: Cookies (HTTP-only, secure in production)
- **Token Refresh**: Automatic via Supabase SDK
- **Expiration**: Configurable in Supabase (default: 1 hour access token, 7 days refresh token)

### XSS Protection
- **Client-Side**: React escapes all user-generated content by default
- **Cookies**: HTTP-only flag prevents JavaScript access

### CSRF Protection
- **Supabase Auth**: Uses PKCE flow for OAuth (CSRF-resistant)
- **API Routes**: Should validate origin/referrer headers (implementation TBD)

### RLS (Row Level Security)
- **Enforcement**: All database access filtered by user ID
- **Bypass**: Only service role key can bypass RLS (never exposed to client)

---

## 9. Integration with Other Features

### Profile Management
- **Location**: `/settings` or `/dashboard/profile`
- **Uses**: `profiles` table
- **Auth Context**: Uses `useAuth()` to get current user ID
- **API**: Updates profile via `/api/profiles/[id]/route.ts`

### Subscription Management
- **Location**: `/subscriptions`
- **Uses**: `profiles.subscription_status`, `profiles.stripe_customer_id`
- **Auth Context**: User must be authenticated to view/manage subscription
- **Webhook**: `/api/stripe/webhook` updates subscription status (uses admin client to bypass RLS)

### Admin Features
- **Location**: `/admin/*`
- **Auth Check**: Pages check `user.role === 'admin'`
- **RLS**: Admin users have elevated permissions in RLS policies

### Broker Connections (SnapTrade)
- **Auth Required**: Yes
- **User Context**: SnapTrade connections linked to `user_id`
- **Integration**: `snaptrade_users` table stores per-user SnapTrade credentials

---

## 10. Testing Considerations

### E2E Test Auth Bypass

**Code** (`middleware.ts`):
```typescript
if (process.env.NEXT_PUBLIC_E2E_TEST === 'true') {
  return NextResponse.next()
}
```

**Purpose**: Allows E2E tests to bypass auth middleware

**Usage**: 
- Set `NEXT_PUBLIC_E2E_TEST=true` in test environment
- Tests can navigate directly to protected routes without logging in

**Risk**: Must ensure this is NEVER set in production

### Test User Creation

**Recommended Approach**:
- Use Supabase Admin API to create test users
- Clean up test users after test suite completes
- Use unique email addresses per test run (e.g., `test-{uuid}@example.com`)

---

**End of Document**

