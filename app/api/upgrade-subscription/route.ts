import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PRO_PRICE_ID = 'price_1TDXsmC4da9Jmue93UnMFCbZ'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { userId } = await req.json()
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // Get the user's Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_plan, subscription_status')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!profile.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
  }

  if (profile.subscription_plan === 'pro') {
    return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 })
  }

  // Find the user's active or trialing subscription in Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    limit: 5,
  })

  const activeSub = subscriptions.data.find(
    (s) => s.status === 'active' || s.status === 'trialing'
  )

  if (!activeSub) {
    return NextResponse.json({ error: 'No active subscription to upgrade' }, { status: 400 })
  }

  const existingItem = activeSub.items.data[0]
  if (!existingItem) {
    return NextResponse.json({ error: 'Subscription has no items' }, { status: 400 })
  }

  // Already on Pro price
  if (existingItem.price.id === PRO_PRICE_ID) {
    return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 })
  }

  // Upgrade the subscription to Pro.
  // proration_behavior: 'none' means no immediate charge — user pays $39 at next renewal.
  await stripe.subscriptions.update(activeSub.id, {
    items: [{ id: existingItem.id, price: PRO_PRICE_ID }],
    proration_behavior: 'none',
  })

  // Update the profile immediately so Pro access is granted without waiting for the webhook
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ subscription_plan: 'pro' })
    .eq('id', userId)

  if (updateError) {
    // Stripe update already succeeded — log but don't fail (webhook will also update)
    console.error('Failed to update profile plan:', updateError.message)
  }

  return NextResponse.json({ ok: true })
}
