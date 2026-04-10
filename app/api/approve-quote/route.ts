import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { quoteId, token, action } = await req.json()

  if (!quoteId || !token || !['approved', 'declined'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Validate token matches the quote
  const { data: quote } = await supabase
    .from('Quotes')
    .select('id, share_token, user_id, title, description, client_id, client_name, amount')
    .eq('id', quoteId)
    .eq('share_token', token)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // Update quote status
  await supabase.from('Quotes').update({ status: action }).eq('id', quoteId)

  // Fetch owner notification preferences and contact info
  const { data: owner } = await supabase
    .from('profiles')
    .select('email, phone, name, business_name, quote_notify_email, quote_notify_sms')
    .eq('id', quote.user_id)
    .single()

  if (owner) {
    const actionLabel = action === 'approved' ? 'approved' : 'declined'
    const quoteTitle = quote.title || 'Quote'
    const clientName = quote.client_name || 'A client'
    const amount = quote.amount != null
      ? ` for $${Number(quote.amount).toFixed(2)}`
      : ''

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // Send email notification
    if (owner.quote_notify_email && owner.email) {
      await fetch(`${supabaseUrl}/functions/v1/send-quote-status-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: owner.email,
          recipientName: owner.name || owner.business_name || 'there',
          clientName,
          quoteTitle,
          amount,
          action: actionLabel,
          quoteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://lawndesk.pro'}/quotes`,
        }),
      }).catch(() => {/* non-blocking */})
    }

    // Send SMS notification
    if (owner.quote_notify_sms && owner.phone) {
      const message = `LawnDesk: ${clientName} has ${actionLabel} your quote "${quoteTitle}"${amount}. Log in to view details.`
      await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: owner.phone, message }),
      }).catch(() => {/* non-blocking */})
    }
  }

  return NextResponse.json({ ok: true })
}
