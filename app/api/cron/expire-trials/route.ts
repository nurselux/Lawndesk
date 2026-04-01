import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { releaseTwilioNumber } from '@/lib/releaseTwilioNumber'

export async function POST(req: Request) {
  // Vercel Cron authenticates with CRON_SECRET in the Authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Find expired trial accounts that still have a Twilio number
  const { data: expired, error } = await supabase
    .from('profiles')
    .select('id, twilio_number_sid')
    .eq('subscription_status', 'trialing')
    .lt('trial_ends_at', new Date().toISOString())
    .not('twilio_number_sid', 'is', null)

  if (error) {
    console.error('expire-trials: query failed', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let released = 0
  const errors: string[] = []

  for (const profile of expired ?? []) {
    try {
      await releaseTwilioNumber(profile.twilio_number_sid)
      await supabase
        .from('profiles')
        .update({ twilio_number: null, twilio_number_sid: null, ai_receptionist_enabled: false })
        .eq('id', profile.id)
      released++
    } catch (err: any) {
      errors.push(`${profile.id}: ${err.message}`)
      console.error('expire-trials: release failed for', profile.id, err)
    }
  }

  return NextResponse.json({ released, errors: errors.length ? errors : undefined })
}
