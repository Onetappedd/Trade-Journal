export function stripeCustomerUrl(id: string) {
  const live = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
  return `https://dashboard.stripe.com/${live ? '' : 'test/'}customers/${id}`
}
