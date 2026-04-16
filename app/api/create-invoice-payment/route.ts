import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const { invoiceId, token } = await req.json()
  if (!invoiceId || !token) {
    return NextResponse.json({ error: 'Missing invoiceId or token' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: invoice, error } = await supabase
    .from('Invoices')
    .select('id, invoice_number, client_name, amount, amount_paid, status, share_token, user_id')
    .eq('id', invoiceId)
    .eq('share_token', token)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status === '🟢 Paid') {
    return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
  }

  // Charge only the remaining balance (full amount if no partial payments yet)
  const amountPaid = invoice.amount_paid ?? 0
  const remaining = Math.max(0, invoice.amount - amountPaid)
  if (remaining <= 0) {
    return NextResponse.json({ error: 'Invoice already paid in full' }, { status: 400 })
  }

  // Look up the landscaper's Stripe Connect account (if they've linked one)
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('stripe_connect_id, payouts_enabled')
    .eq('id', invoice.user_id)
    .single()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`
  const origin = req.headers.get('origin') || 'https://www.lawndesk.pro'
  const label = amountPaid > 0
    ? `${invoiceNum} — Balance due ($${amountPaid.toFixed(2)} already paid)`
    : `${invoiceNum} — Lawn Services`

  // Route payment to landscaper's Connect account if they've completed onboarding,
  // otherwise fall back to platform account (money stays in your Stripe account)
  const connectId = ownerProfile?.stripe_connect_id && ownerProfile?.payouts_enabled
    ? ownerProfile.stripe_connect_id
    : null

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(remaining * 100),
          product_data: {
            name: label,
            description: `Bill to: ${invoice.client_name}`,
          },
        },
      },
    ],
    metadata: {
      type: 'invoice_payment',
      invoiceId: invoice.id,
      token,
    },
    success_url: `${origin}/invoice/${token}?paid=true`,
    cancel_url: `${origin}/invoice/${token}`,
    ...(connectId && {
      transfer_data: { destination: connectId },
    }),
  })

  return NextResponse.json({ url: session.url })
}
