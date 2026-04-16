import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_connect_id) {
      return NextResponse.json({ error: 'No connected Stripe account found.' }, { status: 404 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_connect_id)

    return NextResponse.json({ url: loginLink.url })
  } catch (error: any) {
    console.error('create-connect-dashboard-link error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
