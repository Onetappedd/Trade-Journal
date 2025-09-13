# Stripe local test

## Setup Instructions

1. **Install Stripe CLI and login:**
   ```bash
   stripe login
   ```

2. **Start webhook forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   - Copy the printed `whsec_...` webhook secret and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

3. **Start your development server:**
   ```bash
   npm run dev
   ```

## Testing Webhooks

4. **Trigger test events:**
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.created
   stripe trigger invoice.payment_succeeded
   ```

## Verify Database Changes

5. **Check that data is properly stored:**
   - `billing_events` table should receive all webhook events
   - `billing_customers` table should upsert customer data on checkout completion
   - `billing_subscriptions` table should update on subscription events

## Testing the Billing Flow

6. **Test the complete flow:**
   - Navigate to `/settings/billing`
   - Click "Upgrade – Monthly" or "Upgrade – Annual"
   - Complete the Stripe checkout process
   - Verify the webhook events are received and processed
   - Check that your subscription status updates correctly

## Troubleshooting

- **Webhook signature errors:** Make sure `STRIPE_WEBHOOK_SECRET` matches the one from `stripe listen`
- **Database errors:** Ensure the migration has been applied with `supabase db push`
- **Authentication errors:** Verify your Supabase service role key is correct
- **Stripe errors:** Check that your Stripe keys are valid and have the correct permissions
