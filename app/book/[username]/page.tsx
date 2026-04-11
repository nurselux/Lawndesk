'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import AdminViewBanner from '../../../components/AdminViewBanner'
import AddressAutocomplete from '../../../components/AddressAutocomplete'
import { CheckCircle, ChevronLeft, Leaf, Scissors, Layers, Wind, Droplets, HelpCircle, Home, TreePine, Maximize2, Map, Zap, CalendarDays, Calendar, Tag, Clock, MapPin, Ban, ExternalLink } from 'lucide-react'

interface BusinessProfile {
  id: string
  business_name: string | null
  booking_welcome_message: string | null
  booking_enabled: boolean | null
  booking_notify_sms: boolean | null
  booking_notify_email: boolean | null
  phone: string | null
  booking_photo_url: string | null
  booking_min_lead_hours: number | null
  booking_ask_fence: boolean | null
  booking_ask_pets: boolean | null
  booking_allow_frequency: boolean | null
  booking_arrival_windows: string[] | null
  booking_service_zip: string | null
  booking_service_radius: number | null
  booking_cancellation_policy: string | null
}

const QUIZ_SERVICE_OPTIONS = [
  { value: 'lawn_mowing',             label: 'Lawn Mowing',     Icon: Scissors },
  { value: 'mulch_bed_work',          label: 'Mulch & Bed Work', Icon: Layers },
  { value: 'general_cleanup',         label: 'Cleanup',          Icon: Wind },
  { value: 'irrigation_system_check', label: 'Irrigation',       Icon: Droplets },
  { value: 'other',                   label: 'Something Else',   Icon: HelpCircle },
]

const PROPERTY_SIZE_OPTIONS = [
  { value: 'Under ¼ acre', label: 'Under ¼ acre', Icon: Home },
  { value: '¼–½ acre',     label: '¼–½ acre',     Icon: TreePine },
  { value: '½–1 acre',     label: '½–1 acre',     Icon: Maximize2 },
  { value: '1 acre+',      label: '1 acre+',      Icon: Map },
]

const TIMING_OPTIONS = [
  { value: 'As soon as possible',  label: 'As soon as possible',  Icon: Zap },
  { value: 'This week',            label: 'This week',            Icon: CalendarDays },
  { value: 'This month',           label: 'This month',           Icon: Calendar },
  { value: 'Just getting a price', label: 'Just getting a price', Icon: Tag },
]

const FREQUENCY_OPTIONS = [
  { value: 'One-time',  label: 'One-time visit' },
  { value: 'Weekly',    label: 'Weekly' },
  { value: 'Biweekly',  label: 'Every 2 weeks' },
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
  const [frequency, setFrequency] = useState('')

  // Step 4 contact fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [address, setAddress] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [arrivalWindow, setArrivalWindow] = useState('')
  const [hasFence, setHasFence] = useState<boolean | null>(null)
  const [hasPets, setHasPets] = useState<boolean | null>(null)
  const [inServiceArea, setInServiceArea] = useState(true)
  const [message, setMessage] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  // Custom quote mode (triggered when client says they're outside service area)
  const [customQuoteMode, setCustomQuoteMode] = useState(false)

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
        .select('id, business_name, booking_welcome_message, booking_enabled, booking_notify_sms, booking_notify_email, phone, booking_photo_url, booking_min_lead_hours, booking_ask_fence, booking_ask_pets, booking_allow_frequency, booking_arrival_windows, booking_service_zip, booking_service_radius, booking_cancellation_policy')
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

  // Compute min date from lead time
  const minDate = (() => {
    const hours = business?.booking_min_lead_hours ?? 24
    const d = new Date(Date.now() + hours * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  })()

  const hasServiceArea = !!(business?.booking_service_zip && business?.booking_service_radius)
  const hasArrivalWindows = (business?.booking_arrival_windows?.length ?? 0) > 0

  const handleSubmit = async () => {
    if (!firstName.trim() || !clientPhone.trim() || !address.trim()) {
      setError('First name, phone number, and address are required.')
      return
    }
    if (hasArrivalWindows && !arrivalWindow) {
      setError('Please select a preferred arrival window.')
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
      has_fence: business?.booking_ask_fence ? hasFence : null,
      has_pets: business?.booking_ask_pets ? hasPets : null,
      service_frequency: business?.booking_allow_frequency ? frequency || null : null,
      arrival_window: hasArrivalWindows ? arrivalWindow || null : null,
      outside_service_area: hasServiceArea ? !inServiceArea : false,
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
          message: `🌿 New booking request from ${clientName}! Service: ${serviceLabel}${preferredDate ? ` on ${preferredDate}` : ''}${arrivalWindow ? `, ${arrivalWindow}` : ''}. Check your LawnDesk Requests.`,
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

  // Total steps: 4 base + optionally a step for frequency if enabled
  const totalSteps = 4
  const progressPct = (step / totalSteps) * 100
  const pageName = business?.business_name || 'the business'

  return (
    <>
      <AdminViewBanner view="Client Booking" />
      <div className="min-h-dvh bg-gradient-to-br from-green-50 to-emerald-50">

        {/* Header */}
        <div className="bg-white shadow-sm">
          {/* Cover photo — fixed 180px, never stretched */}
          {business?.booking_photo_url && (
            <div className="w-full h-44 overflow-hidden">
              <img
                src={business.booking_photo_url}
                alt={business.business_name || 'Cover photo'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Business identity */}
          <div className="px-5 py-5 flex items-center gap-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center shrink-0 shadow-sm">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                {business?.business_name || 'Request a Service'}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5 leading-snug">
                {business?.booking_welcome_message || "Answer a few questions and we'll get back to you within 24 hours."}
              </p>
              {hasServiceArea && (
                <div className="inline-flex items-center gap-1 mt-1.5 text-green-700 text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  Within {business!.booking_service_radius} mi of {business!.booking_service_zip}
                </div>
              )}
            </div>
          </div>
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
                  {frequency && (
                    <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {frequency}
                    </span>
                  )}
                  {arrivalWindow && (
                    <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {arrivalWindow}
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
                    <p className="text-gray-400 text-sm mb-5">Step 1 of {totalSteps}</p>
                    <div className="space-y-3">
                      {QUIZ_SERVICE_OPTIONS.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          onClick={() => selectAndAdvance(setServiceType, value, 2)}
                          className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 text-sm font-medium min-h-[52px] cursor-pointer flex items-center gap-3 ${
                            serviceType === value
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${serviceType === value ? 'text-green-600' : 'text-gray-400'}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Step 2 — Property size */}
                {step === 2 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">How big is your property?</h2>
                    <p className="text-gray-400 text-sm mb-5">Step 2 of {totalSteps}</p>
                    <div className="space-y-3">
                      {PROPERTY_SIZE_OPTIONS.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          onClick={() => selectAndAdvance(setPropertySize, value, 3)}
                          className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 text-sm font-medium min-h-[52px] cursor-pointer flex items-center gap-3 ${
                            propertySize === value
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${propertySize === value ? 'text-green-600' : 'text-gray-400'}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Step 3 — Timing + optional frequency */}
                {step === 3 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">When do you need this done?</h2>
                    <p className="text-gray-400 text-sm mb-5">Step 3 of {totalSteps}</p>
                    <div className="space-y-3">
                      {TIMING_OPTIONS.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          onClick={() => selectAndAdvance(setTiming, value, 4)}
                          className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 text-sm font-medium min-h-[52px] cursor-pointer flex items-center gap-3 ${
                            timing === value
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${timing === value ? 'text-green-600' : 'text-gray-400'}`} />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Frequency — shown inline when enabled */}
                    {business?.booking_allow_frequency && (
                      <div className="mt-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">How often would you like service?</p>
                        <div className="flex gap-2 flex-wrap">
                          {FREQUENCY_OPTIONS.map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => setFrequency(value)}
                              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                                frequency === value
                                  ? 'border-green-500 bg-green-50 text-green-800'
                                  : 'border-gray-200 text-gray-600 hover:border-green-300'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Step 4 — Contact form */}
                {step === 4 && (
                  <>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Almost done — how do we reach you?</h2>
                    <p className="text-gray-400 text-sm mb-5">Step 4 of {totalSteps}</p>

                    {/* Service area check */}
                    {hasServiceArea && (
                      <div className={`rounded-xl p-4 mb-4 border ${inServiceArea ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-start gap-3">
                          <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${inServiceArea ? 'text-green-600' : 'text-amber-600'}`} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 mb-1">
                              We serve within {business!.booking_service_radius} miles of {business!.booking_service_zip}
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={inServiceArea}
                                onChange={e => { setInServiceArea(e.target.checked); setCustomQuoteMode(!e.target.checked) }}
                                className="w-4 h-4 rounded accent-green-700 cursor-pointer"
                              />
                              <span className="text-sm text-gray-700">My property is within the service area</span>
                            </label>
                            {!inServiceArea && (
                              <p className="text-xs text-amber-700 mt-2 font-medium">
                                Your request will be flagged as outside our standard service area. We'll reach out with a custom quote.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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
                      <AddressAutocomplete
                        value={address}
                        onChange={setAddress}
                        placeholder="Property address *"
                        className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
                        required
                      />

                      {/* Preferred date with lead-time enforcement */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1 ml-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Preferred date{(business?.booking_min_lead_hours ?? 24) > 0 && (
                            <span className="text-gray-400"> · earliest {business?.booking_min_lead_hours ?? 24}h from now</span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={preferredDate}
                          min={minDate}
                          onChange={e => setPreferredDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
                        />
                      </div>

                      {/* Arrival window */}
                      {hasArrivalWindows && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Preferred Arrival Window *</label>
                          <div className="grid grid-cols-2 gap-2">
                            {business!.booking_arrival_windows!.map(w => (
                              <button
                                key={w}
                                type="button"
                                onClick={() => setArrivalWindow(w)}
                                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer text-center ${
                                  arrivalWindow === w
                                    ? 'border-green-500 bg-green-50 text-green-800'
                                    : 'border-gray-200 text-gray-600 hover:border-green-300'
                                }`}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Property details */}
                      {(business?.booking_ask_fence || business?.booking_ask_pets) && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-bold text-gray-500 uppercase">Property Details</p>
                          {business?.booking_ask_fence && (
                            <div>
                              <p className="text-sm text-gray-700 mb-1.5">Is there a fence on the property?</p>
                              <div className="flex gap-2">
                                {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(({ val, label }) => (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => setHasFence(val)}
                                    className={`px-5 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                                      hasFence === val
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 text-gray-600 hover:border-green-300'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {business?.booking_ask_pets && (
                            <div>
                              <p className="text-sm text-gray-700 mb-1.5">Are there pets or animals on the property?</p>
                              <div className="flex gap-2">
                                {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(({ val, label }) => (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => setHasPets(val)}
                                    className={`px-5 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                                      hasPets === val
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 text-gray-600 hover:border-green-300'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <textarea
                        placeholder="Additional notes (optional)"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 resize-none"
                      />

                      {/* Cancellation policy */}
                      {business?.booking_cancellation_policy && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3">
                          <Ban className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cancellation Policy</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{business.booking_cancellation_policy}</p>
                          </div>
                        </div>
                      )}

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
                        {submitting ? 'Sending...' : customQuoteMode ? 'Request Custom Quote' : 'Send Request'}
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
