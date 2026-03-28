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
  booking_username: string | null
  business_name: string | null
  booking_enabled: boolean | null
  booking_notify_sms: boolean | null
  booking_notify_email: boolean | null
  booking_welcome_message: string | null
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
  const [bookingUsername, setBookingUsername] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [bookingEnabled, setBookingEnabled] = useState(true)
  const [bookingNotifySms, setBookingNotifySms] = useState(false)
  const [bookingNotifyEmail, setBookingNotifyEmail] = useState(true)
  const [bookingWelcome, setBookingWelcome] = useState('')
  const [bookingSaving, setBookingSaving] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingCopied, setBookingCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteCountdown, setDeleteCountdown] = useState(30)
  const [deleteDeleting, setDeleteDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteExpanded, setDeleteExpanded] = useState(false)

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '')
      supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, stripe_customer_id, google_review_link, booking_username, business_name, booking_enabled, booking_notify_sms, booking_notify_email, booking_welcome_message')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data as Profile)
            setReviewLink(data.google_review_link || '')
            setBookingUsername(data.booking_username || '')
            setBusinessName(data.business_name || '')
            setBookingEnabled(data.booking_enabled ?? true)
            setBookingNotifySms(data.booking_notify_sms ?? false)
            setBookingNotifyEmail(data.booking_notify_email ?? true)
            setBookingWelcome(data.booking_welcome_message || '')
          }
        })
    }
  }, [user])

  useEffect(() => {
    if (!showDeleteModal) return
    if (deleteCountdown <= 0) return

    const timer = setTimeout(() => {
      setDeleteCountdown(deleteCountdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [showDeleteModal, deleteCountdown])

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

  const handleSaveBooking = async () => {
    setBookingError('')
    const slug = bookingUsername.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (!slug) { setBookingError('Please enter a booking username.'); return }
    if (!businessName) { setBookingError('Please enter your business name.'); return }
    setBookingSaving(true)
    const { error } = await (supabase.from('profiles') as any).update({
      booking_username: slug,
      business_name: businessName,
      booking_enabled: bookingEnabled,
      booking_notify_sms: bookingNotifySms,
      booking_notify_email: bookingNotifyEmail,
      booking_welcome_message: bookingWelcome || null,
    }).eq('id', user?.id)
    if (error) {
      setBookingError(error.message.includes('unique') ? 'That username is already taken. Try another.' : error.message)
    } else {
      setBookingUsername(slug)
      setBookingMessage('Booking page saved!')
      setTimeout(() => setBookingMessage(''), 3000)
    }
    setBookingSaving(false)
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

  const handleDeleteAccount = async () => {
    setDeleteError('')
    if (!deletePassword || !deleteEmail) {
      setDeleteError('Please enter your password and email')
      return
    }
    if (deleteEmail !== userEmail) {
      setDeleteError('Email does not match your account')
      return
    }

    setDeleteDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setDeleteError('Session expired. Please log in again.')
        setDeleteDeleting(false)
        return
      }

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: deleteEmail,
          password: deletePassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete account')
        setDeleteDeleting(false)
        return
      }

      // Account successfully deleted - redirect to login
      await new Promise(resolve => setTimeout(resolve, 1500))
      window.location.href = '/login'
    } catch (error: any) {
      setDeleteError(error.message || 'Something went wrong')
      setDeleteDeleting(false)
    }
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

      {/* Online Booking */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-800">📋 Online Booking Page</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-500">Active</span>
            <div
              onClick={() => setBookingEnabled(!bookingEnabled)}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${bookingEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${bookingEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
        <p className="text-gray-500 text-sm mb-4">Clients can book jobs directly from your unique link. Share it on your website, Instagram, or anywhere.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Business Name</label>
            <input
              placeholder="e.g. Green Thumb Lawn Care"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Booking Username</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <span className="bg-gray-50 text-gray-400 text-sm px-3 py-3 border-r border-gray-300 whitespace-nowrap">lawndesk.pro/book/</span>
              <input
                placeholder="your-business"
                value={bookingUsername}
                onChange={e => setBookingUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="flex-1 p-3 text-gray-800 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Welcome Message <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
            <textarea
              placeholder="e.g. Thanks for choosing us! Fill out the form and we'll get back to you within 24 hours."
              value={bookingWelcome}
              onChange={e => setBookingWelcome(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Notify me when a request comes in</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setBookingNotifyEmail(!bookingNotifyEmail)} className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${bookingNotifyEmail ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${bookingNotifyEmail ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">📧 Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setBookingNotifySms(!bookingNotifySms)} className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${bookingNotifySms ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${bookingNotifySms ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">📱 SMS</span>
              </label>
            </div>
          </div>
        </div>
        {bookingError && <p className="text-red-500 text-sm mt-3">{bookingError}</p>}
        {bookingMessage && <p className="text-green-600 text-sm font-semibold mt-3">{bookingMessage}</p>}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSaveBooking}
            disabled={bookingSaving}
            className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {bookingSaving ? '⏳ Saving...' : '💾 Save'}
          </button>
          {bookingUsername && (
            <button
              onClick={() => { navigator.clipboard.writeText(`https://lawndesk.pro/book/${bookingUsername}`); setBookingCopied(true); setTimeout(() => setBookingCopied(false), 2000) }}
              className="border-2 border-green-700 text-green-700 font-bold py-3 px-6 rounded-lg hover:bg-green-50 transition cursor-pointer"
            >
              {bookingCopied ? '✅ Copied!' : '🔗 Copy Link'}
            </button>
          )}
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

      {/* Danger Zone */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-red-700 mb-2">⚠️ Danger Zone</h3>
        <p className="text-gray-600 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>

        <button
          onClick={() => setDeleteExpanded(!deleteExpanded)}
          className="text-red-700 text-sm font-semibold mb-3 hover:underline"
        >
          {deleteExpanded ? '▼ Hide' : '▶ Show'} what gets deleted
        </button>

        {deleteExpanded && (
          <div className="bg-white rounded p-3 mb-4 text-sm text-gray-600 border border-red-100">
            <p className="font-semibold text-gray-700 mb-2">Your account deletion will remove:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Your profile and personal information</li>
              <li>All clients and contact information</li>
              <li>All jobs and job history</li>
              <li>All invoices and payment records</li>
              <li>All quotes and booking requests</li>
              <li>Your online booking page</li>
            </ul>
            <p className="font-semibold text-gray-700 mt-3 mb-2">What happens to linked workers:</p>
            <ul className="list-disc list-inside text-gray-600">
              <li>Workers will be unlinked from your account</li>
              <li>They will become independent accounts</li>
              <li>They can create their own business account if needed</li>
            </ul>
            {profile?.subscription_status === 'active' && (
              <p className="font-semibold text-gray-700 mt-3 mb-1">Your active Stripe subscription will be cancelled.</p>
            )}
          </div>
        )}

        <button
          onClick={() => {
            setShowDeleteModal(true)
            setDeleteCountdown(30)
            setDeletePassword('')
            setDeleteEmail('')
            setDeleteError('')
          }}
          className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-all duration-200 cursor-pointer"
        >
          🗑️ Delete Account Permanently
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-xl font-bold text-red-700 mb-2">Delete Account?</h4>
            <p className="text-gray-600 text-sm mb-4">This action cannot be undone. All your data will be permanently deleted.</p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Confirm your email</label>
                <input
                  type="email"
                  placeholder={userEmail}
                  value={deleteEmail}
                  onChange={e => setDeleteEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Enter your password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
                />
              </div>
            </div>

            {deleteError && <p className="text-red-600 text-sm font-semibold mb-3">{deleteError}</p>}

            <p className="text-red-600 text-sm font-semibold mb-4">
              ⏱️ Account deletion in {deleteCountdown}s
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteDeleting}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteDeleting || deleteCountdown > 0}
                className="flex-1 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {deleteDeleting ? '⏳ Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
