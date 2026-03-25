'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'

interface Profile {
  subscription_status: string | null
  subscription_plan: string | null
  stripe_customer_id: string | null
  google_review_link: string | null
}

function subLabel(status: string | null, plan: string | null) {
  if (!status || status === 'cancelled') return { text: 'No active subscription', color: 'bg-red-100 text-red-700' }
  if (status === 'trialing') return { text: `Free trial — ${plan === 'pro' ? 'Pro' : 'Starter'} plan`, color: 'bg-blue-100 text-blue-700' }
  if (status === 'active') return { text: `Active — ${plan === 'pro' ? 'Pro' : 'Starter'} plan`, color: 'bg-green-100 text-green-700' }
  if (status === 'past_due') return { text: 'Payment failed — update billing', color: 'bg-red-100 text-red-700' }
  return { text: status, color: 'bg-gray-100 text-gray-700' }
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const { checking } = useSubscriptionGate()
  const [userEmail, setUserEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')
  const [reviewLink, setReviewLink] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '')
      supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, stripe_customer_id, google_review_link')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data as Profile)
            setReviewLink(data.google_review_link || '')
          }
        })
    }
  }, [user])

  const handleChangePassword = async () => {
    setPwError('')
    setPwMessage('')
    if (!pwCurrent || !pwNew || !pwConfirm) { setPwError('All fields are required.'); return }
    if (pwNew.length < 6) { setPwError('New password must be at least 6 characters.'); return }
    if (pwNew !== pwConfirm) { setPwError('New passwords do not match.'); return }

    setPwSaving(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: pwCurrent })
    if (signInError) { setPwError('Current password is incorrect.'); setPwSaving(false); return }

    const { error } = await supabase.auth.updateUser({ password: pwNew })
    if (error) {
      setPwError(error.message)
    } else {
      setPwMessage('Password updated successfully!')
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
    }
    setPwSaving(false)
  }

  const handleSaveReviewLink = async () => {
    setReviewSaving(true)
    const { error } = await (supabase.from('profiles') as any)
      .update({ google_review_link: reviewLink || null })
      .eq('id', user?.id)
    if (!error) {
      setReviewMessage('Saved!')
      setTimeout(() => setReviewMessage(''), 3000)
    }
    setReviewSaving(false)
  }

  const handleManageBilling = async () => {
    setPortalError('')
    setPortalLoading(true)
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError(data.error || 'Could not open billing portal.')
      }
    } catch {
      setPortalError('Something went wrong. Please try again.')
    }
    setPortalLoading(false)
  }

  if (checking) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  const sub = subLabel(profile?.subscription_status ?? null, profile?.subscription_plan ?? null)
  const hasStripe = !!profile?.stripe_customer_id

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Settings</h2>

      {/* Account */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Account</h3>
        <div className="flex items-center gap-4">
          <div className="bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800">{userEmail}</p>
            <p className="text-gray-500 text-sm">LawnDesk Account</p>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Subscription</h3>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${sub.color}`}>
            {sub.text}
          </span>
        </div>
        {profile?.subscription_status === 'trialing' && (
          <p className="text-gray-500 text-sm mb-4">
            You're on a free trial. Your card will be charged after the trial ends. You can cancel anytime through the billing portal.
          </p>
        )}
        {hasStripe ? (
          <div>
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {portalLoading ? '⏳ Opening...' : '💳 Manage Billing'}
            </button>
            <p className="text-gray-400 text-xs mt-2">Update payment method, view invoices, or cancel — all in one place.</p>
            {portalError && <p className="text-red-500 text-sm mt-2">{portalError}</p>}
          </div>
        ) : (
          <Link href="/pricing">
            <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              View Plans
            </button>
          </Link>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Change Password</h3>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={pwCurrent}
            onChange={e => setPwCurrent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
          />
          <input
            type="password"
            placeholder="New password (min. 6 characters)"
            value={pwNew}
            onChange={e => setPwNew(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={pwConfirm}
            onChange={e => setPwConfirm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
          />
          {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
          {pwMessage && <p className="text-green-600 text-sm font-semibold">{pwMessage}</p>}
          <button
            onClick={handleChangePassword}
            disabled={pwSaving}
            className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {pwSaving ? '⏳ Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Google Review Link */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">⭐ Google Review Link</h3>
        <p className="text-gray-500 text-sm mb-4">When a job is marked complete, your client automatically receives a text asking for a Google review. Paste your Google Business review link below.</p>
        <input
          type="url"
          placeholder="https://g.page/r/your-business/review"
          value={reviewLink}
          onChange={e => setReviewLink(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm mb-3"
        />
        {reviewMessage && <p className="text-green-600 text-sm font-semibold mb-2">{reviewMessage}</p>}
        <button
          onClick={handleSaveReviewLink}
          disabled={reviewSaving}
          className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {reviewSaving ? '⏳ Saving...' : '💾 Save'}
        </button>
      </div>

      {/* Need Help */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h3>
        <p className="text-gray-500 mb-4">Our support team is here to help you get the most out of LawnDesk.</p>
        <a href="mailto:support@lawndesk.pro">
          <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            📧 Contact Support
          </button>
        </a>
      </div>
    </div>
  )
}
