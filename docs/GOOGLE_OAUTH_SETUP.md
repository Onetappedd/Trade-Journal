# Google OAuth Setup - Change "To continue to" Text

## Problem
When users click "Continue with Google", the Google consent screen shows:
- **Current**: "To continue to lobigrwmngwirucuklmc.supabase.co"
- **Desired**: "To continue to Riskr.net"

## Solution

The text shown in Google's OAuth consent screen is controlled by your **Google Cloud Console OAuth application settings**. Here's how to fix it:

### Step 1: Update Google Cloud Console OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one connected to Supabase)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the following:

   **App Information:**
   - **App name**: `Riskr` or `Riskr.net`
   - **User support email**: Your email
   - **App logo**: Upload your Riskr logo (optional but recommended)

   **App Domain:**
   - **Application home page**: `https://riskr.net`
   - **Authorized domains**: Add `riskr.net` (and `www.riskr.net` if you use it)
   - **Developer contact information**: Your email

5. **Save and Continue** through the scopes and test users screens

### Step 2: Verify OAuth 2.0 Client ID Configuration

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Find your **OAuth 2.0 Client ID** (the one used by Supabase)
3. Click to edit it
4. Under **Authorized redirect URIs**, make sure you have:
   - Your Supabase callback URL: `https://lobigrwmngwirucuklmc.supabase.co/auth/v1/callback`
   - Your custom domain callback (if configured): `https://riskr.net/auth/callback`

### Step 3: Update Supabase Auth Settings (Optional but Recommended)

If you want to use a custom domain for auth callbacks:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to: `https://riskr.net`
4. Add **Redirect URLs**:
   - `https://riskr.net/auth/callback`
   - `https://riskr.net/**` (wildcard for all routes)

### Step 4: Verify Environment Variables

Make sure your `.env.local` (or Vercel environment variables) has:

```env
NEXT_PUBLIC_SITE_URL=https://riskr.net
NEXT_PUBLIC_SUPABASE_URL=https://lobigrwmngwirucuklmc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 5: Test the Changes

1. Clear your browser cache and cookies
2. Go to your login page
3. Click "Continue with Google"
4. You should now see "To continue to Riskr.net" (or your app name) instead of the Supabase URL

## Important Notes

- **The redirect URI must still point to Supabase** - Google OAuth requires the callback to go through Supabase's auth endpoint
- **The domain shown is from Google Cloud Console**, not from your code
- **Changes may take a few minutes** to propagate through Google's systems
- **If you're in testing mode**, only test users will see the consent screen

## Troubleshooting

If you still see the Supabase URL:

1. **Check OAuth Consent Screen Status**: Make sure it's published (not in testing mode) or add your email as a test user
2. **Verify Authorized Domains**: Make sure `riskr.net` is listed in authorized domains
3. **Clear Browser Cache**: Google may cache the old consent screen
4. **Check App Name**: The app name in OAuth consent screen should be "Riskr" or "Riskr.net"
5. **Wait a Few Minutes**: Google's changes can take 5-10 minutes to propagate

## Code Changes Made

The code has been updated to include the `hd` (hosted domain) parameter as a hint to Google:

```typescript
queryParams: {
  hd: 'riskr.net', // Hint to Google about the domain
}
```

This helps Google identify your domain, but the main fix is in Google Cloud Console settings.

