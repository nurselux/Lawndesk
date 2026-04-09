import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe secret key not found' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { priceId, email, userId } = await req.json()

    // Only give a trial to users who have never had a Stripe subscription before
    let isReturningUser = false
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data } = await admin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()
      isReturningUser = !!data?.stripe_customer_id
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      metadata: { userId: userId || '' },
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: isReturningUser ? {} : { trial_period_days: 14 },
      success_url: `https://lawndesk.pro/subscription-success`,
      cancel_url: `https://lawndesk.pro/pricing?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
