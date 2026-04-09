'use client'

import { useSubscriptionGate } from './useSubscriptionGate'

/**
 * Returns whether the current user has Pro-level access.
 * Trial users always get full Pro access per the LawnDesk spec.
 */
export function usePlan() {
  const { profile, checking } = useSubscriptionGate()
  const isPro =
    profile?.subscription_plan === 'pro' ||
    profile?.subscription_status === 'trialing'
  return { isPro, checking, plan: profile?.subscription_plan ?? null }
}
