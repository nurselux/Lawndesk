import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }

    const { userId, returnPath } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_id, payouts_enabled')
      .eq('id', userId)
      .single()

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    let connectId = profile?.stripe_connect_id as string | undefined

    if (!connectId) {
      const account = await stripe.accounts.create({ type: 'express' })
      connectId = account.id

      const { error } = await supabase
        .from('profiles')
        .update({ stripe_connect_id: connectId })
        .eq('id', userId)

      if (error) throw new Error(error.message)
    }

    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.lawndesk.pro'
    const returnUrl = returnPath
      ? `${base}${returnPath}`
      : `${base}/settings?tab=billing&connect=success`
    const refreshUrl = returnPath
      ? `${base}${returnPath}&connect=refresh`
      : `${base}/settings?tab=billing&connect=refresh`

    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('create-connect-account error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
