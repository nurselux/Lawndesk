import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const { quoteId, token } = await req.json()
  if (!quoteId || !token) {
    return NextResponse.json({ error: 'Missing quoteId or token' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: quote, error } = await supabase
    .from('Quotes')
    .select('id, title, client_name, amount, status, share_token, require_payment, deposit_amount')
    .eq('id', quoteId)
    .eq('share_token', token)
    .single()

  if (error || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  if (!quote.require_payment) {
    return NextResponse.json({ error: 'This quote does not require payment' }, { status: 400 })
  }

  if (quote.status === 'approved' || quote.status === 'declined' || quote.status === 'converted') {
    return NextResponse.json({ error: 'Quote is no longer pending' }, { status: 400 })
  }

  // Deposit amount, or full amount if no deposit specified
  const chargeAmount = quote.deposit_amount ?? quote.amount
  const isDeposit = !!quote.deposit_amount && quote.deposit_amount < quote.amount
  const label = isDeposit
    ? `Deposit for "${quote.title}" (${((quote.deposit_amount! / quote.amount) * 100).toFixed(0)}%)`
    : `Full payment for "${quote.title}"`

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const origin = req.headers.get('origin') || 'https://lawndesk.pro'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(chargeAmount * 100),
          product_data: {
            name: label,
            description: `Client: ${quote.client_name}`,
          },
        },
      },
    ],
    metadata: {
      type: 'quote_payment',
      quoteId: quote.id,
      token,
    },
    success_url: `${origin}/quote/${token}?paid=true`,
    cancel_url: `${origin}/quote/${token}`,
  })

  return NextResponse.json({ url: session.url })
}
