import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Initialize Stripe only if configured
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe subscription events with signature verification and idempotency.
 * Updates subscription status in database and invalidates caches.
 * 
 * Features:
 * - Signature verification for security
 * - Idempotency handling to prevent duplicate processing
 * - Real-time subscription updates
 * - Cache invalidation for immediate UI updates
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Check for idempotency
    const eventId = event.id;
    const supabase = createSupabaseAdmin();

    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      console.log(`Event ${eventId} already processed, skipping`);
      return NextResponse.json({ received: true });
    }

    // Store event for idempotency
    await supabase
      .from('webhook_events')
      .insert({
        event_id: eventId,
        event_type: event.type,
        processed: false,
        created_at: new Date().toISOString()
      });

    // Process event based on type
    let subscriptionData: any = {};
    let userId: string | null = null;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        userId = await getUserIdFromCustomer(subscription.customer as string, supabase);
        
        if (userId) {
          subscriptionData = {
            tier: getTierFromPriceId(subscription.items.data[0]?.price.id),
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string
          };
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        userId = await getUserIdFromCustomer(deletedSubscription.customer as string, supabase);
        
        if (userId) {
          subscriptionData = {
            tier: 'free',
            status: 'canceled',
            stripe_subscription_id: deletedSubscription.id,
            stripe_customer_id: deletedSubscription.customer as string
          };
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        userId = await getUserIdFromCustomer(invoice.customer as string, supabase);
        
        if (userId && invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          subscriptionData = {
            tier: getTierFromPriceId(subscription.items.data[0]?.price.id),
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string
          };
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        userId = await getUserIdFromCustomer(failedInvoice.customer as string, supabase);
        
        if (userId && failedInvoice.subscription) {
          subscriptionData = {
            status: 'past_due',
            stripe_subscription_id: failedInvoice.subscription as string,
            stripe_customer_id: failedInvoice.customer as string
          };
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }

    // Update subscription in database
    if (userId && Object.keys(subscriptionData).length > 0) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          ...subscriptionData,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // Mark event as processed
      await supabase
        .from('webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('event_id', eventId);

      // Invalidate caches
      revalidateTag('subscription');
      revalidateTag('user');
      revalidateTag('kpi'); // KPIs might change with subscription tier

      console.log(`Successfully processed ${event.type} for user ${userId}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed', 
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Get user ID from Stripe customer ID
 */
async function getUserIdFromCustomer(customerId: string, supabase: any): Promise<string | null> {
  try {
    const { data: customer, error } = await supabase
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !customer) {
      console.error('Error finding user for customer:', error);
      return null;
    }

    return customer.user_id;
  } catch (error) {
    console.error('Error getting user ID from customer:', error);
    return null;
  }
}

/**
 * Get subscription tier from Stripe price ID
 */
function getTierFromPriceId(priceId: string | undefined): string {
  if (!priceId) return 'free';
  
  // Map Stripe price IDs to tiers
  const priceMapping: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASIC!]: 'basic',
    [process.env.STRIPE_PRICE_PRO!]: 'pro',
    // Add more price mappings as needed
  };

  return priceMapping[priceId] || 'free';
}

/**
 * Get Stripe price ID from tier
 */
function getPriceIdFromTier(tier: string): string | null {
  const tierMapping: Record<string, string> = {
    'basic': process.env.STRIPE_PRICE_BASIC!,
    'pro': process.env.STRIPE_PRICE_PRO!,
  };

  return tierMapping[tier] || null;
}

