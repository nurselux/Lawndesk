'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle, Users, Calendar, RefreshCw,
  Star, Zap, ArrowRight, Leaf,
} from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { supabase } from '../../lib/supabase'

const PRO_ONLY_FEATURES = [
  { icon: Users,    text: 'Unlimited team members & worker app' },
  { icon: Calendar, text: 'Online booking page (your custom URL)' },
  { icon: RefreshCw,text: 'Recurring job automation' },
  { icon: Star,     text: 'Automated Google review requests' },
  { icon: Zap,      text: 'AI Receptionist — answers calls & texts 24/7' },
]

export default function UpgradePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login?redirect=/upgrade')
      return
    }

    supabase
      .from('profiles')
      .select('subscription_plan, subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) { setProfileLoading(false); return }

        // Already Pro — nothing to upgrade
        if (data.subscription_plan === 'pro') {
          router.replace('/settings')
          return
        }

        // No active subscription to modify — send to pricing to create a new one
        const hasActiveSub = ['active', 'trialing'].includes(data.subscription_status ?? '')
        if (!hasActiveSub || !data.stripe_customer_id) {
          const reason = data.subscription_status === 'cancelled' ? 'cancelled'
            : data.subscription_status === 'past_due' ? 'past_due'
            : 'no_subscription'
          router.replace(`/pricing?reason=${reason}`)
          return
        }

        setProfileLoading(false)
      })
  }, [user, authLoading, router])

  const handleUpgrade = async () => {
    if (!user) return
    setUpgrading(true)
    setError('')

    try {
      const res = await fetch('/api/upgrade-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setUpgrading(false)
        return
      }

      // Redirect to dashboard with a success flag
      router.push('/dashboard?upgraded=true')
    } catch {
      setError('Something went wrong. Please try again.')
      setUpgrading(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Simple app-style header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg p-1.5">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-base">LawnDesk</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide px-4 py-1.5 rounded-full mb-4">
            Upgrade to Pro
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 leading-tight">
            Unlock the full power of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
              LawnDesk Pro
            </span>
          </h1>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            You're on the Starter plan. Upgrade to Pro and get everything below — no second charge, new price starts your next billing cycle.
          </p>
        </div>

        {/* Pro feature card */}
        <div className="bg-gradient-to-br from-[#0d3320] to-emerald-900 rounded-3xl p-8 mb-6 shadow-2xl">
          <div className="flex items-end gap-2 mb-6">
            <span className="text-5xl font-black text-white">$39</span>
            <span className="text-emerald-300 text-lg mb-1">/mo</span>
            <span className="text-emerald-400 text-sm mb-1 ml-1">· billed monthly</span>
          </div>

          <ul className="space-y-3.5 mb-8">
            <li className="flex items-center gap-3 text-white text-sm font-medium">
              <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
              Everything in your current Starter plan
            </li>
            {PRO_ONLY_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-white text-sm font-medium">
                <f.icon className="w-5 h-5 text-yellow-300 shrink-0" />
                {f.text}
              </li>
            ))}
          </ul>

          {error && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 mb-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 text-green-900 font-black py-4 px-6 rounded-xl hover:from-yellow-300 hover:to-amber-300 transition-all duration-200 shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:translate-y-0 text-base"
          >
            {upgrading ? (
              <span className="animate-pulse">Upgrading…</span>
            ) : (
              <>Upgrade to Pro — $39/mo <ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          <p className="text-center text-emerald-400 text-xs mt-3">
            No double charges · New price starts your next billing cycle · Cancel anytime
          </p>
        </div>

        {/* Reassurance note */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm text-gray-500 leading-relaxed">
          <strong className="text-gray-700">How billing works:</strong> Upgrading to Pro doesn't create a second subscription or charge you immediately. Your current Starter billing cycle continues as normal, and starting your next renewal you'll be charged $39/mo for Pro. You keep your same billing date.
        </div>

      </div>
    </div>
  )
}
