'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import { useAuth } from './useAuth'

interface GateProfile {
  role: string
  subscription_status: string | null
  stripe_customer_id: string | null
  subscription_plan: string | null
  trial_ends_at: string | null
}

export function useSubscriptionGate() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [profile, setProfile] = useState<GateProfile | null>(null)

  useEffect(() => {
    if (loading || !user) return

    supabase
      .from('profiles')
      .select('role, subscription_status, stripe_customer_id, subscription_plan, trial_ends_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) { setChecking(false); return }

        // Workers go to /worker, not admin pages
        if (data.role === 'worker') {
          router.replace('/worker')
          return
        }

        // No role set — user signed up without an invite link; send to join page
        if (!data.role) {
          router.replace('/join')
          return
        }

        // Allow active/past_due Stripe subscribers
        const hasPaidSub =
          ['active', 'past_due'].includes(data.subscription_status ?? '') &&
          !!data.stripe_customer_id

        // Allow users in a valid trial window
        const inTrial =
          data.subscription_status === 'trialing' &&
          !!data.trial_ends_at &&
          new Date(data.trial_ends_at) > new Date()

        if (!hasPaidSub && !inTrial) {
          router.replace('/pricing')
          return
        }

        setProfile(data as GateProfile)
        setChecking(false)
      })
  }, [user, loading, router])

  return { checking: checking || loading, profile }
}
