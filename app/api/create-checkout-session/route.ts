import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe secret key not found' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { priceId, email } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `https://lawndesk.pro/dashboard?success=true`,
      cancel_url: `https://lawndesk.pro/pricing?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
