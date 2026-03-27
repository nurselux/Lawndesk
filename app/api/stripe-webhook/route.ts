import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRetry } from '@/lib/webhookRetry'

const STARTER_PRICE_ID = 'price_1TDXflC4da9Jmue97LkfChat'
const PRO_PRICE_ID = 'price_1TDXsmC4da9Jmue93UnMFCbZ'

function getPlan(priceId: string) {
  if (priceId === PRO_PRICE_ID) return 'pro'
  if (priceId === STARTER_PRICE_ID) return 'starter'
  return 'starter'
}

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

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Idempotency check — skip if already processed
  const { data: existing } = await supabase
    .from('stripe_webhooks')
    .select('id, processed')
    .eq('event_id', event.id)
    .limit(1)

  if (existing && existing.length > 0 && existing[0].processed) {
    return NextResponse.json({ received: true, skipped: true })
  }

  // Log the event if not already in the table
  if (!existing || existing.length === 0) {
    await supabase.from('stripe_webhooks').insert({
      event_id: event.id,
      event_type: event.type,
      event_data: event.data,
      processed: false,
    })
  }

  // Process the event synchronously with retry logic
  const { success, error: processingError, attemptCount } = await withRetry(async () => {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.metadata?.type === 'invoice_payment') {
          const { invoiceId } = session.metadata
          const { error } = await supabase
            .from('Invoices')
            .update({ status: '🟢 Paid', stripe_payment_id: session.payment_intent as string })
            .eq('id', invoiceId)
          if (error) throw new Error(error.message)
          break
        }

        const userId = session.client_reference_id || session.metadata?.userId
        const customerId = session.customer as string
        if (!userId) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        const { error } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId, subscription_status: subscription.status, subscription_plan: getPlan(priceId), trial_ends_at: trialEnd })
          .eq('id', userId)
        if (error) throw new Error(error.message)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0].price.id
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: subscription.status, subscription_plan: getPlan(priceId) })
          .eq('stripe_customer_id', subscription.customer as string)
        if (error) throw new Error(error.message)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'cancelled', subscription_plan: null })
          .eq('stripe_customer_id', subscription.customer as string)
        if (error) throw new Error(error.message)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)
        if (error) throw new Error(error.message)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', invoice.customer as string)
          .eq('subscription_status', 'past_due')
        if (error) throw new Error(error.message)
        break
      }
    }
  }, 3)

  // Update audit log with result
  await supabase
    .from('stripe_webhooks')
    .update({
      processed: success,
      processing_error: processingError ?? null,
      processed_at: success ? new Date().toISOString() : null,
      retry_count: attemptCount - 1,
    })
    .eq('event_id', event.id)

  if (!success) {
    console.error(`Webhook ${event.id} failed after ${attemptCount} attempts:`, processingError)
  }

  // Always return 200 so Stripe doesn't retry
  return NextResponse.json({ received: true, success })
}
