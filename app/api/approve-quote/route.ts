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
    .select('id, share_token, user_id, title, description, client_id, client_name')
    .eq('id', quoteId)
    .eq('share_token', token)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // Update quote status
  await supabase.from('Quotes').update({ status: action }).eq('id', quoteId)

  // If approved, check for linked estimate and auto-create a job
  if (action === 'approved') {
    const { data: estimate } = await supabase
      .from('estimates')
      .select('*')
      .eq('quote_id', quoteId)
      .single()

    if (estimate) {
      const { data: job } = await supabase
        .from('jobs')
        .insert([{
          user_id: estimate.user_id,
          client_id: estimate.client_id,
          client_name: estimate.client_name,
          title: estimate.service_type,
          date: estimate.scheduled_date ?? null,
          time: estimate.scheduled_time ?? null,
          status: '🔵 Scheduled',
          notes: estimate.notes ?? null,
        }])
        .select('id')
        .single()

      await supabase
        .from('estimates')
        .update({ status: 'converted', converted_to_job_id: job?.id ?? null })
        .eq('id', estimate.id)
    }
  }

  return NextResponse.json({ ok: true })
}
