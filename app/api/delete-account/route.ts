import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  try {
    const { password, email } = await req.json()

    if (!password || !email) {
      return NextResponse.json(
        { error: 'Password and email are required' },
        { status: 400 }
      )
    }

    // Get auth header to verify user session
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get current session to verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: sessionError } = await supabase.auth.getUser(token)

    if (sessionError || !user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Verify email matches
    if (user.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match account' },
        { status: 400 }
      )
    }

    // Verify password by attempting sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 403 }
      )
    }

    // Fetch user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    let unlinkedWorkers: string[] = []

    // Handle Stripe subscription cancellation
    if (profile.stripe_customer_id) {
      try {
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 100,
        })

        // Cancel each active subscription
        for (const subscription of subscriptions.data) {
          if (subscription.status !== 'canceled') {
            await stripe.subscriptions.cancel(subscription.id)
          }
        }

        // Delete the customer
        await stripe.customers.del(profile.stripe_customer_id)
      } catch (stripeError: any) {
        console.error('Stripe deletion error:', stripeError.message)
        return NextResponse.json(
          { error: `Failed to cancel subscription: ${stripeError.message}` },
          { status: 500 }
        )
      }
    }

    // Get worker emails before deletion (for notifications)
    const { data: workersToNotify, error: workersError } = await supabase
      .from('profiles')
      .select('email')
      .eq('owner_id', user.id)
      .eq('role', 'worker')

    const workerEmails = workersToNotify?.map(w => w.email).filter(Boolean) || []

    // Call RPC function to delete all user data atomically
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('delete_account_data', { user_id_input: user.id })

    if (rpcError || !rpcResult?.success) {
      return NextResponse.json(
        { error: `Failed to delete account data: ${rpcError?.message || rpcResult?.error}` },
        { status: 500 }
      )
    }

    unlinkedWorkers = rpcResult.unlinked_workers || []

    // Delete the auth user (this will cascade to profiles per Supabase rules)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteAuthError) {
      console.error('Auth deletion error:', deleteAuthError.message)
      return NextResponse.json(
        { error: 'Failed to delete authentication record' },
        { status: 500 }
      )
    }

    // Send notifications to unlinked workers
    if (workerEmails.length > 0) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const res = await fetch(`${supabaseUrl}/functions/v1/send-account-deletion-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workerEmails,
          }),
        })

        if (!res.ok) {
          console.warn('Failed to send worker notifications:', await res.text())
        }
      } catch (emailError: any) {
        console.warn('Error sending worker notifications:', emailError.message)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account successfully deleted',
        unlinked_workers_count: unlinkedWorkers.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Delete account error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
