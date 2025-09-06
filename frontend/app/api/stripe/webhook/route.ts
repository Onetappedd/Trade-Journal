export const runtime = 'nodejs'
export const preferredRegion = 'home'

import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    const raw = await req.text()
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Invalid signature', err?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    // Idempotency
    await supabaseAdmin.from('billing_events')
      .insert({ stripe_event_id: event.id, type: event.type, payload: event as any })

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const customerId = s.customer as string
        const userId = (s.client_reference_id || s.metadata?.user_id) as string | undefined
        const email = s.customer_details?.email || s.customer_email || undefined
        if (customerId && userId) {
          await supabaseAdmin.from('billing_customers')
            .upsert({ user_id: userId, stripe_customer_id: customerId, email })
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: cust } = await supabaseAdmin
          .from('billing_customers').select('user_id').eq('stripe_customer_id', customerId).maybeSingle()
        if (!cust?.user_id) break

        await supabaseAdmin.from('billing_subscriptions').upsert({
          stripe_subscription_id: sub.id,
          user_id: cust.user_id,
          price_id: (sub.items.data[0]?.price?.id ?? 'unknown'),
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        break
      }
      default:
        // stored in billing_events
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error', err)
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }
}
