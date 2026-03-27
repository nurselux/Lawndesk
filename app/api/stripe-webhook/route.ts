import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    console.error('No Stripe signature header')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Log the event to stripe_webhooks for processing
  // Use idempotency by checking event_id
  try {
    const { data: existing } = await supabase
      .from('stripe_webhooks')
      .select('id')
      .eq('event_id', event.id)
      .limit(1)

    if (!existing || existing.length === 0) {
      // New event — log it for processing
      await supabase
        .from('stripe_webhooks')
        .insert({
          event_id: event.id,
          event_type: event.type,
          event_data: event.data,
          processed: false,
        })
    } else {
      console.log(`Webhook ${event.id} already processed, skipping`)
    }
  } catch (err: any) {
    console.error('Failed to log webhook:', err.message)
    // Still return 200 so Stripe doesn't retry; we'll catch it in the next processing run
  }

  // Return 200 immediately — actual processing happens in /api/process-webhooks
  return NextResponse.json({ received: true })
}
