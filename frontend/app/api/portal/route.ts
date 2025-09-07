export const runtime = 'nodejs'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Initialize Stripe client only when needed to avoid build-time errors
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })
}

export async function POST(req: NextRequest) {
  // Get user from request headers or JWT token
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // For now, we'll need to extract user ID from the request
  // This is a simplified approach - in production you'd validate the JWT
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 401 })

  const { data: row, error } = await supabaseAdmin
    .from('billing_customers').select('stripe_customer_id').eq('user_id', userId).single()
  if (error || !row) return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })
  return NextResponse.json({ url: session.url })
}
