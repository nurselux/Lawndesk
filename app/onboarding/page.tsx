'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Leaf, CheckCircle2, XCircle, Loader2, Star, CreditCard, Building2 } from 'lucide-react'

const STEPS = ['welcome', 'business', 'contact', 'booking', 'payouts', 'done'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('welcome')
  const [saving, setSaving] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [ownerName, setOwnerName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [bookingUsername, setBookingUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [payoutsLinked, setPayoutsLinked] = useState(false)

  // Check if already onboarded, or returning from Stripe Connect
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data } = await (supabase as any)
        .from('profiles')
        .select('onboarding_complete, payouts_enabled')
        .eq('id', session.user.id)
        .single()
      if (data?.onboarding_complete) { router.replace('/dashboard'); return }
      // Returning from Stripe Connect onboarding
      if (searchParams.get('connect') === 'success') {
        setPayoutsLinked(true)
        setStep('payouts')
      }
    }
    check()
  }, [router, searchParams])

  // Slugify booking username as user types
  const handleUsernameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    setBookingUsername(slug)
    setUsernameAvailable(null)
  }

  const checkUsernameAvailability = async () => {
    if (!bookingUsername || bookingUsername.length < 3) return
    setCheckingUsername(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('booking_username', bookingUsername)
      .neq('id', session?.user?.id ?? '')
      .maybeSingle()
    setUsernameAvailable(!data)
    setCheckingUsername(false)
  }

  const handleFinish = async () => {
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14)

    const updates: Record<string, unknown> = {
      onboarding_complete: true,
      subscription_status: 'trialing',
      subscription_plan: 'pro',
      trial_ends_at: trialEnd.toISOString(),
    }
    if (businessName) updates.business_name = businessName
    if (phone) updates.phone = phone
    if (bookingUsername && usernameAvailable !== false) updates.booking_username = bookingUsername

    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)

    if (updateError) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }
    setStep('done')
    setSaving(false)
  }

  const handleLinkBank = async () => {
    setConnectLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/create-connect-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session?.user.id, returnPath: '/onboarding?connect=success' }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError('Could not start bank setup. You can do this later in Settings.')
      setConnectLoading(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)
  const totalSteps = STEPS.length - 2 // exclude 'welcome' and 'done' from progress

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-700 to-emerald-800 flex flex-col items-center justify-center p-5">

      {/* Logo */}
      <div className="mb-8 text-center">
        <Leaf className="w-10 h-10 text-green-300 mb-1 mx-auto" aria-hidden="true" />
        <h1 className="text-white text-2xl font-bold">LawnDesk</h1>
        <p className="text-green-300 text-sm">Less paperwork, more yardwork</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Progress bar (hidden on welcome/done) */}
        {step !== 'welcome' && step !== 'done' && (
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${((stepIndex - 1) / totalSteps) * 100}%` }}
            />
          </div>
        )}

        <div className="p-7">

          {/* ── Step: Welcome ── */}
          {step === 'welcome' && (
            <div className="text-center space-y-4">
              <Leaf className="w-14 h-14 text-green-500 mx-auto" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-800">Welcome to LawnDesk!</h2>
              <p className="text-gray-500">Let's get your business set up in about 2 minutes. We'll start with the basics.</p>
              <button
                onClick={() => setStep('business')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-2xl text-lg mt-4 cursor-pointer hover:scale-[1.02] transition-all"
              >
                Let's Go →
              </button>
            </div>
          )}

          {/* ── Step: Business Name ── */}
          {step === 'business' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Step 1 of 4</p>
                <h2 className="text-xl font-bold text-gray-800">What's your business called?</h2>
                <p className="text-gray-400 text-sm mt-1">This will show on your invoices, estimates, and booking page.</p>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Business Name *"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3.5 text-gray-800 focus:outline-none focus:border-green-500"
                  autoFocus
                />
                <input
                  placeholder="Your Name (optional)"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3.5 text-gray-800 focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep('welcome')}
                  className="px-5 py-3.5 rounded-xl font-semibold text-gray-500 bg-gray-100 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!businessName.trim()) { setError('Please enter your business name.'); return }
                    setError('')
                    setStep('contact')
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3.5 rounded-xl cursor-pointer hover:scale-[1.01] transition-all"
                >
                  Continue →
                </button>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* ── Step: Contact ── */}
          {step === 'contact' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Step 2 of 4</p>
                <h2 className="text-xl font-bold text-gray-800">What's your phone number?</h2>
                <p className="text-gray-400 text-sm mt-1">Used to send you SMS alerts when you get a new booking request.</p>
              </div>
              <input
                type="tel"
                placeholder="Phone Number *"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3.5 text-gray-800 focus:outline-none focus:border-green-500"
                autoFocus
              />
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setError(''); setStep('business') }}
                  className="px-5 py-3.5 rounded-xl font-semibold text-gray-500 bg-gray-100 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!phone.trim()) { setError('Please enter your phone number.'); return }
                    setError('')
                    setStep('booking')
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3.5 rounded-xl cursor-pointer hover:scale-[1.01] transition-all"
                >
                  Continue →
                </button>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* ── Step: Booking Username ── */}
          {step === 'booking' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Step 3 of 4</p>
                <h2 className="text-xl font-bold text-gray-800">Create your booking link</h2>
                <p className="text-gray-400 text-sm mt-1">Clients will use this link to request your services.</p>
              </div>
              <div>
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-green-500">
                  <span className="bg-gray-50 text-gray-400 text-sm px-3 py-3.5 border-r border-gray-300 whitespace-nowrap">lawndesk.pro/book/</span>
                  <input
                    placeholder="your-business"
                    value={bookingUsername}
                    onChange={e => handleUsernameChange(e.target.value)}
                    onBlur={checkUsernameAvailability}
                    className="flex-1 p-3.5 text-gray-800 focus:outline-none bg-white"
                    autoFocus
                  />
                </div>
                {checkingUsername && <p className="text-xs text-gray-400 mt-1.5">Checking availability...</p>}
                {!checkingUsername && usernameAvailable === true && bookingUsername && (
                  <p className="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />Available!</p>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" aria-hidden="true" />That username is taken. Try another.</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">Only lowercase letters, numbers, and hyphens. You can always change this later in Settings.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setError(''); setStep('contact') }}
                  className="px-5 py-3.5 rounded-xl font-semibold text-gray-500 bg-gray-100 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (usernameAvailable === false) { setError('That username is already taken.'); return }
                    if (bookingUsername && bookingUsername.length < 3) { setError('Username must be at least 3 characters.'); return }
                    setError('')
                    setStep('payouts')
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3.5 rounded-xl cursor-pointer hover:scale-[1.01] transition-all"
                >
                  Continue →
                </button>
              </div>
              <button
                onClick={() => { setError(''); setStep('payouts') }}
                className="w-full text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-all py-1"
              >
                Skip for now
              </button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* ── Step: Payouts ── */}
          {step === 'payouts' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Last Step</p>
                <h2 className="text-xl font-bold text-gray-800">Get paid directly to your bank</h2>
                <p className="text-gray-400 text-sm mt-1">Link your bank account so clients can pay invoices online and the money goes straight to you.</p>
              </div>

              {payoutsLinked ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-green-800">Bank account linked!</p>
                    <p className="text-green-700 text-sm mt-0.5">Clients can now pay your invoices online and funds will deposit directly to your bank.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 rounded-xl p-2.5">
                        <CreditCard className="w-5 h-5 text-green-700" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Online invoice payments</p>
                        <p className="text-gray-400 text-xs">Clients pay by card — money goes to your bank</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 rounded-xl p-2.5">
                        <Building2 className="w-5 h-5 text-green-700" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Powered by Stripe</p>
                        <p className="text-gray-400 text-xs">Bank-level security, used by millions of businesses</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLinkBank}
                    disabled={connectLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3.5 rounded-xl cursor-pointer hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {connectLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Opening Stripe...</>
                      : <><CreditCard className="w-4 h-4" aria-hidden="true" />Link Bank Account</>
                    }
                  </button>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {!payoutsLinked && (
                  <button
                    onClick={() => setStep('booking')}
                    className="px-5 py-3.5 rounded-xl font-semibold text-gray-500 bg-gray-100 cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => { setError(''); handleFinish() }}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3.5 rounded-xl cursor-pointer hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" aria-hidden="true" />Saving...</>
                    : payoutsLinked ? 'Go to Dashboard →' : 'Skip for now →'
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Done ── */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-2">
              <Star className="w-14 h-14 text-amber-400 mx-auto" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-800">You're all set{ownerName ? `, ${ownerName.split(' ')[0]}` : ''}!</h2>
              <p className="text-gray-500">
                <strong className="text-gray-700">{businessName}</strong> is ready to go. Start adding clients, scheduling jobs, and sharing your booking link.
              </p>
              {bookingUsername && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-semibold mb-0.5">Your booking link</p>
                  <p className="text-sm text-green-800 font-bold">lawndesk.pro/book/{bookingUsername}</p>
                </div>
              )}
              <button
                onClick={() => router.replace('/dashboard')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-2xl text-lg mt-2 cursor-pointer hover:scale-[1.02] transition-all"
              >
                Go to Dashboard →
              </button>
            </div>
          )}

        </div>
      </div>

      <p className="text-green-400 text-xs mt-6">Powered by LawnDesk</p>
    </div>
  )
}
