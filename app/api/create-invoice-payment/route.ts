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
    .select('id, invoice_number, client_name, amount, status, share_token')
    .eq('id', invoiceId)
    .eq('share_token', token)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`
  const origin = req.headers.get('origin') || 'https://lawndesk.pro'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(invoice.amount * 100),
          product_data: {
            name: `${invoiceNum} — Lawn Services`,
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
  })

  return NextResponse.json({ url: session.url })
}
