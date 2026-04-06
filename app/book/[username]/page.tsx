'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import AdminViewBanner from '../../../components/AdminViewBanner'
import { CheckCircle, ChevronLeft, Leaf } from 'lucide-react'

interface BusinessProfile {
  id: string
  business_name: string | null
  booking_welcome_message: string | null
  booking_enabled: boolean | null
  booking_notify_sms: boolean | null
  booking_notify_email: boolean | null
  phone: string | null
}

const QUIZ_SERVICE_OPTIONS = [
  { value: 'lawn_mowing',           label: 'Lawn Mowing' },
  { value: 'mulch_bed_work',        label: 'Mulch & Bed Work' },
  { value: 'general_cleanup',       label: 'Cleanup' },
  { value: 'irrigation_system_check', label: 'Irrigation' },
  { value: 'other',                 label: 'Something Else' },
]

const PROPERTY_SIZE_OPTIONS = [
  { value: 'Under ¼ acre',  label: 'Under ¼ acre' },
  { value: '¼–½ acre',      label: '¼–½ acre' },
  { value: '½–1 acre',      label: '½–1 acre' },
  { value: '1 acre+',       label: '1 acre+' },
]

const TIMING_OPTIONS = [
  { value: 'As soon as possible', label: 'As soon as possible' },
  { value: 'This week',           label: 'This week' },
  { value: 'This month',          label: 'This month' },
  { value: 'Just getting a price', label: 'Just getting a price' },
]

export default function BookingPage() {
  const { username } = useParams<{ username: string }>()
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  // Quiz navigation
  const [step, setStep] = useState(1)
  const [animClass, setAnimClass] = useState('quiz-step-enter')
  const dirRef = useRef<'forward' | 'back'>('forward')

  // Step 1–3 selections
  const [serviceType, setServiceType] = useState('')
  const [propertySize, setPropertySize] = useState('')
  const [timing, setTiming] = useState('')

  // Step 4 contact fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [address, setAddress] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [message, setMessage] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from URL params (used by AI receptionist SMS link) — jump straight to step 4
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const name = p.get('name')
    if (!name) return
    const [first, ...rest] = name.split(' ')
    setFirstName(first)
    setLastName(rest.join(' '))
    const phone = p.get('phone'); if (phone) setClientPhone(phone)
    const email = p.get('email'); if (email) setClientEmail(email)
    const addr = p.get('address'); if (addr) setAddress(addr)
    const date = p.get('date'); if (date) setPreferredDate(date)
    const msg = p.get('message'); if (msg) setMessage(msg)
    const service = p.get('service')
    if (service) {
      const match = QUIZ_SERVICE_OPTIONS.find(o =>
        o.label.toLowerCase().includes(service.toLowerCase()) ||
        o.value.toLowerCase().includes(service.toLowerCase())
      )
      if (match) setServiceType(match.value)
    }
    setStep(4)
  }, [])

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data } = await (supabase.from('profiles') as any)
        .select('id, business_name, booking_welcome_message, booking_enabled, booking_notify_sms, booking_notify_email, phone')
        .eq('booking_username', username)
        .single()
      if (!data || data.booking_enabled === false) {
        setNotFound(true)
      } else {
        setBusiness(data)
      }
      setLoading(false)
    }
    fetchBusiness()
  }, [username])

  const goToStep = (next: number) => {
    dirRef.current = next > step ? 'forward' : 'back'
    setAnimClass(next > step ? 'quiz-step-enter' : 'quiz-step-back')
    setStep(next)
  }

  const selectAndAdvance = (setter: (v: string) => void, value: string, nextStep: number) => {
    setter(value)
    setTimeout(() => goToStep(nextStep), 300)
  }

  const handleSubmit = async () => {
    if (!firstName.trim() || !clientPhone.trim() || !address.trim()) {
      setError('First name, phone number, and address are required.')
      return
    }
    setSubmitting(true)
    setError('')

    const clientName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

    const { error: insertError } = await supabase.from('booking_requests' as any).insert([{
      owner_id: business!.id,
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone,
      address: address || null,
      service_type: serviceType || 'other',
      property_size: propertySize || null,
      timing: timing || null,
      preferred_date: preferredDate || null,
      preferred_time: null,
      message: message || null,
      status: 'pending',
    }])

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    if (business?.booking_notify_sms) {
      const serviceLabel = QUIZ_SERVICE_OPTIONS.find(o => o.value === serviceType)?.label ?? serviceType
      fetch('https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: business.phone,
          message: `🌿 New booking request from ${clientName}! Service: ${serviceLabel}${preferredDate ? ` on ${preferredDate}` : ''}. Check your LawnDesk Requests.`,
        }),
      })
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <>
      <AdminViewBanner view="Client Booking" />
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <p className="text-green-700 font-bold text-lg">Loading...</p>
      </div>
    </>
  )

  if (notFound) return (
    <>
      <AdminViewBanner view="Client Booking" />
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Leaf className="w-14 h-14 text-green-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking page not found</h1>
        <p className="text-gray-500">This booking link is inactive or doesn't exist.</p>
      </div>
    </>
  )

  const progressPct = (step / 4) * 100

  const pageName = business?.business_name || 'the business'

  return (
    <>
      <AdminViewBanner view="Client Booking" />
      <div className="min-h-dvh bg-gradient-to-br from-green-50 to-emerald-50">

        {/* Header */}
        <div className="bg-green-700 text-white px-6 py-8 text-center">
          <Leaf className="w-10 h-10 text-green-300 mb-2 mx-auto" />
          <h1 className="text-2xl font-bold">{business?.business_name || 'Request a Service'}</h1>
          <p className="text-green-200 text-sm mt-1 max-w-sm mx-auto">
            {business?.booking_welcome_message || "Answer a few quick questions and we'll get back to you within 24 hours with a free estimate."}
          </p>
        </div>

        {/* Quiz card */}
        <div className="max-w-lg mx-auto p-4 mt-4 pb-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div
                className="h-full bg-green-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {submitted ? (
              /* Confirmation state */
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-14 h-14 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Request sent!</h2>
                <p className="text-gray-500 text-sm mb-5">
                  {pageName} will reach out within 1 business day with your free estimate.
                </p>
                {/* Summary pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {serviceType && (
                    <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {QUIZ_SERVICE_OPTIONS.find(o => o.value === serviceType)?.label ?? serviceType}
                    </span>
                  )}
                  {propertySize && (
                    <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {propertySize}
                    </span>
                  )}
                  {timing && (
                    <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {timing}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div key={step} className={`p-6 ${animClass}`}>

                {/* Back button */}
                {step > 1 && (
                  <button
                    onClick={() => goToStep(step - 1)}
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4 -ml-1 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {/* Step 1 — Service */}
                {step === 1 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">What service are you looking for?</h2>
                    <p className="text-gray-400 text-sm mb-5">Step 1 of 4</p>
                    <div className="space-y-3">
                      {QUIZ_SERVICE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => selectAndAdvance(setServiceType, opt.value, 2)}
                          className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 text-sm font-medium min-h-[52px] cursor-pointer ${
                            serviceType === opt.value
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Step 2 — Property size */}
                {step === 2 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">How big is your property?</h2>
                    <p className="text-gray-400 text-sm mb-5">Step 2 of 4</p>
                    <div className="space-y-3">
                      {PROPERTY_SIZE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => selectAndAdvance(setPropertySize, opt.value, 3)}
                          className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 text-sm font-medium min-h-[52px] cursor-pointer ${
                            propertySize === opt.value
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Step 3 — Timing */}
                {step === 3 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">When do you need this done?</h2>
                    <p className="text-gray-400 text-sm mb-5">Step 3 of 4</p>
                    <div className="space-y-3">
                      {TIMING_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => selectAndAdvance(setTiming, opt.value, 4)}
                          className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 text-sm font-medium min-h-[52px] cursor-pointer ${
                            timing === opt.value
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Step 4 — Contact form */}
                {step === 4 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Almost done — how do we reach you?</h2>
                    <p className="text-gray-400 text-sm mb-5">Step 4 of 4</p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          placeholder="First name *"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="border border-gray-300 rounded-xl p-3 text-gray-800 w-full"
                        />
                        <input
                          placeholder="Last name"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          className="border border-gray-300 rounded-xl p-3 text-gray-800 w-full"
                        />
                      </div>
                      <input
                        type="tel"
                        placeholder="Phone number *"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
                      />
                      <input
                        placeholder="Property address *"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
                      />
                      <div>
                        <label className="block text-xs text-gray-400 mb-1 ml-1">Preferred date (optional)</label>
                        <input
                          type="date"
                          value={preferredDate}
                          onChange={e => setPreferredDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
                        />
                      </div>
                      <textarea
                        placeholder="Additional notes (optional)"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 resize-none"
                      />

                      {/* SMS consent — required for A2P 10DLC compliance */}
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
                        By submitting this form, I agree to receive automated SMS text messages from{' '}
                        <span className="font-semibold">LawnDesk</span> and the service provider regarding my
                        appointment, quote, and service updates. Message frequency varies. Msg &amp; data rates
                        may apply. Reply <span className="font-semibold">STOP</span> to opt out,{' '}
                        <span className="font-semibold">HELP</span> for help.
                      </div>

                      {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}

                      <button
                        onClick={handleSubmit}
                        disabled={!firstName.trim() || !clientPhone.trim() || submitting}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-2xl text-lg hover:scale-[1.02] transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {submitting ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-5">
            Powered by <span className="font-semibold text-green-600">LawnDesk</span>
          </p>
        </div>
      </div>
    </>
  )
}
