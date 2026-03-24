import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


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

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId
        const customerId = session.customer as string

        if (!userId) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id
        const plan = getPlan(priceId)
        const status = subscription.status
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId, subscription_status: status, subscription_plan: plan, trial_ends_at: trialEnd })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0].price.id
        const plan = getPlan(priceId)

        await supabase
          .from('profiles')
          .update({ subscription_status: subscription.status, subscription_plan: plan })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from('profiles')
          .update({ subscription_status: 'cancelled', subscription_plan: null })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Reactivate if it was past_due
        await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId)
          .eq('subscription_status', 'past_due')
        break
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
