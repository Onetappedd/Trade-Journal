# Stripe Environment Variables Setup

Add the following environment variables to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://www.riskr.net

# Stripe Price IDs
PRICE_MONTHLY_ID=prod_T0RRLLgvaVG63N
PRICE_ANNUAL_ID=prod_T0RRv32hEoV3xN
```

## Required Actions:

1. **Get your Stripe webhook secret:**
   - Go to your Stripe Dashboard → Webhooks
   - Create a new webhook endpoint pointing to: `https://www.riskr.net/api/stripe/webhook`
   - Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET`

2. **Get your Supabase credentials:**
   - Go to your Supabase project → Settings → API
   - Copy the Project URL to `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the service_role key to `SUPABASE_SERVICE_ROLE_KEY`

3. **Apply the database migration:**
   ```bash
   supabase db push
   ```

## Vercel Deployment:

Make sure to add all these environment variables to your Vercel project settings as well.
