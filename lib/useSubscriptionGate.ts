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
      .select('role, subscription_status, stripe_customer_id, subscription_plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) { setChecking(false); return }

        // Workers go to /worker, not admin pages
        if (data.role === 'worker') {
          router.replace('/worker')
          return
        }

        // Block if no stripe customer or cancelled
        const valid =
          ['trialing', 'active', 'past_due'].includes(data.subscription_status ?? '') &&
          !!data.stripe_customer_id

        if (!valid) {
          router.replace('/pricing')
          return
        }

        setProfile(data as GateProfile)
        setChecking(false)
      })
  }, [user, loading, router])

  return { checking: checking || loading, profile }
}
