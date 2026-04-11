import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRetry } from '@/lib/webhookRetry'
import { releaseTwilioNumber } from '@/lib/releaseTwilioNumber'

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
    const { error: insertError } = await supabase.from('stripe_webhooks').insert({
      event_id: event.id,
      event_type: event.type,
      event_data: event.data,
      processed: false,
    })
    if (insertError) {
      console.error('stripe_webhooks insert failed:', insertError.message, insertError.code)
    }
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

        if (session.metadata?.type === 'quote_payment') {
          const { quoteId } = session.metadata
          const { error } = await supabase
            .from('Quotes')
            .update({ status: 'approved' })
            .eq('id', quoteId)
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

        // Fetch the profile so we can release the Twilio number if one was provisioned
        const { data: profile } = await supabase
          .from('profiles')
          .select('twilio_number_sid')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        const updates: Record<string, unknown> = { subscription_status: 'cancelled', subscription_plan: null }

        if (profile?.twilio_number_sid) {
          try {
            await releaseTwilioNumber(profile.twilio_number_sid)
            updates.twilio_number = null
            updates.twilio_number_sid = null
            updates.ai_receptionist_enabled = false
          } catch (err) {
            // Log but don't block the webhook — the daily cron will catch it
            console.error('Failed to release Twilio number on subscription delete:', err)
          }
        }

        const { error } = await supabase
          .from('profiles')
          .update(updates)
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
  const { error: updateError } = await supabase
    .from('stripe_webhooks')
    .update({
      processed: success,
      processing_error: processingError ?? null,
      processed_at: success ? new Date().toISOString() : null,
      retry_count: attemptCount - 1,
    })
    .eq('event_id', event.id)
  if (updateError) {
    console.error('stripe_webhooks update failed:', updateError.message, updateError.code)
  }

  if (!success) {
    console.error(`Webhook ${event.id} failed after ${attemptCount} attempts:`, processingError)
  }

  // Always return 200 so Stripe doesn't retry
  return NextResponse.json({ received: true, success })
}
