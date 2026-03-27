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

/**
 * Background job to process pending Stripe webhooks
 * This runs every 5 minutes via Vercel cron
 * Protected by CRON_SECRET bearer token
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Get all unprocessed webhooks
    const { data: webhooks, error: fetchError } = await supabase
      .from('stripe_webhooks')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(100) // Process max 100 per run to avoid timeout

    if (fetchError) {
      console.error('Failed to fetch webhooks:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
    }

    if (!webhooks || webhooks.length === 0) {
      return NextResponse.json({ processed: 0, skipped: 0 })
    }

    let processed = 0
    let skipped = 0

    for (const webhook of webhooks) {
      // Skip if already retried too many times
      if (webhook.retry_count >= 3) {
        console.warn(`Webhook ${webhook.event_id} exceeded max retries, marking as processed with error`)
        await supabase
          .from('stripe_webhooks')
          .update({
            processed: true,
            processing_error: 'Max retries exceeded',
            processed_at: new Date().toISOString(),
          })
          .eq('id', webhook.id)
        skipped++
        continue
      }

      const event = webhook.event_data as Stripe.Event['data']
      const eventType = webhook.event_type as string
      const webhookId = webhook.id

      try {
        // Process based on event type
        let processResult = false

        switch (eventType) {
          case 'checkout.session.completed': {
            const session = event.object as Stripe.Checkout.Session
            processResult = await processCheckoutSession(supabase, stripe, session)
            break
          }

          case 'customer.subscription.updated': {
            const subscription = event.object as Stripe.Subscription
            processResult = await processSubscriptionUpdated(supabase, subscription)
            break
          }

          case 'customer.subscription.deleted': {
            const subscription = event.object as Stripe.Subscription
            processResult = await processSubscriptionDeleted(supabase, subscription)
            break
          }

          case 'invoice.payment_failed': {
            const invoice = event.object as Stripe.Invoice
            processResult = await processPaymentFailed(supabase, invoice)
            break
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.object as Stripe.Invoice
            processResult = await processPaymentSucceeded(supabase, invoice)
            break
          }

          default:
            console.log(`Unknown event type: ${eventType}`)
            processResult = true // Mark unknown events as processed
        }

        if (processResult) {
          // Success — mark as processed
          await supabase
            .from('stripe_webhooks')
            .update({
              processed: true,
              processing_error: null,
              processed_at: new Date().toISOString(),
            })
            .eq('id', webhookId)
          processed++
        } else {
          // Failed — increment retry count
          await supabase
            .from('stripe_webhooks')
            .update({
              retry_count: webhook.retry_count + 1,
              processing_error: 'Processing failed',
            })
            .eq('id', webhookId)
          skipped++
        }
      } catch (err: any) {
        console.error(`Failed to process webhook ${webhook.event_id}:`, err.message)

        // Increment retry count on error
        await supabase
          .from('stripe_webhooks')
          .update({
            retry_count: webhook.retry_count + 1,
            processing_error: err.message || 'Unknown error',
          })
          .eq('id', webhookId)
        skipped++
      }
    }

    return NextResponse.json({ processed, skipped, total: webhooks.length })
  } catch (err: any) {
    console.error('Webhook processor error:', err.message)
    return NextResponse.json({ error: 'Processor error' }, { status: 500 })
  }
}

// ─── Event Handlers ───

async function processCheckoutSession(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<boolean> {
  // Invoice payment (one-time)
  if (session.metadata?.type === 'invoice_payment') {
    const { invoiceId } = session.metadata
    const { error } = await supabase
      .from('Invoices')
      .update({ status: '🟢 Paid', stripe_payment_id: session.payment_intent as string })
      .eq('id', invoiceId)
    return !error
  }

  // Subscription checkout
  const userId = session.client_reference_id || session.metadata?.userId
  const customerId = session.customer as string
  if (!userId) return true // Skip silently

  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0].price.id
    const plan = getPlan(priceId)
    const status = subscription.status
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null

    const { error } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId, subscription_status: status, subscription_plan: plan, trial_ends_at: trialEnd })
      .eq('id', userId)

    return !error
  } catch (err) {
    throw err
  }
}

async function processSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription): Promise<boolean> {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0].price.id
  const plan = getPlan(priceId)

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: subscription.status, subscription_plan: plan })
    .eq('stripe_customer_id', customerId)

  return !error
}

async function processSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription): Promise<boolean> {
  const customerId = subscription.customer as string

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'cancelled', subscription_plan: null })
    .eq('stripe_customer_id', customerId)

  return !error
}

async function processPaymentFailed(supabase: any, invoice: Stripe.Invoice): Promise<boolean> {
  const customerId = invoice.customer as string

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId)

  return !error
}

async function processPaymentSucceeded(supabase: any, invoice: Stripe.Invoice): Promise<boolean> {
  const customerId = invoice.customer as string

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'active' })
    .eq('stripe_customer_id', customerId)
    .eq('subscription_status', 'past_due')

  return !error
}
