'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const JOB_TYPES = [
  '🌿 Lawn Mowing', '✂️ Hedge Trimming', '💨 Leaf Blowing', '🍂 Leaf Removal',
  '🌳 Bush Trimming', '🪓 Tree Trimming', '🪴 Mulching', '🌱 Fertilizing',
  '🌾 Weed Control', '🕳️ Aeration', '🌻 Overseeding', '🟩 Sod Installation',
  '🌺 Garden Bed Maintenance', '💧 Irrigation System Check', '🚿 Pressure Washing',
  '❄️ Snow Removal', '🍃 Gutter Cleaning', '🧹 General Cleanup', '✏️ Other',
]

interface BusinessProfile {
  id: string
  business_name: string | null
  booking_welcome_message: string | null
  booking_enabled: boolean | null
  booking_notify_sms: boolean | null
  booking_notify_email: boolean | null
  email: string | null
  phone: string | null
}

export default function BookingPage() {
  const { username } = useParams<{ username: string }>()
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data } = await (supabase.from('profiles') as any)
        .select('id, business_name, booking_welcome_message, booking_enabled, booking_notify_sms, booking_notify_email')
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

  const handleSubmit = async () => {
    if (!clientName || !clientPhone || !serviceType) {
      setError('Name, phone and service type are required.')
      return
    }
    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase.from('booking_requests' as any).insert([{
      owner_id: business!.id,
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone,
      service_type: serviceType,
      preferred_date: preferredDate || null,
      preferred_time: preferredTime || null,
      message: message || null,
      status: 'pending',
    }])

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    // Notify business owner
    if (business?.booking_notify_sms) {
      fetch('https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: (business as any).phone,
          message: `🌿 New booking request from ${clientName}! Service: ${serviceType}${preferredDate ? ` on ${preferredDate}` : ''}. Check your LawnDesk Requests.`,
        }),
      })
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
      <p className="text-green-700 font-bold text-lg">Loading...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-5xl mb-4">🌿</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking page not found</h1>
      <p className="text-gray-500">This booking link is inactive or doesn't exist.</p>
    </div>
  )

  if (submitted) return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Request Sent!</h1>
        <p className="text-gray-500 mb-2">Thanks, <strong>{clientName}</strong>! Your request has been sent to <strong>{business?.business_name || 'the business'}</strong>.</p>
        <p className="text-gray-400 text-sm">They'll be in touch shortly to confirm your appointment.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-green-700 text-white px-6 py-8 text-center">
        <p className="text-3xl mb-2">🌿</p>
        <h1 className="text-2xl font-bold">{business?.business_name || 'Book a Service'}</h1>
        {business?.booking_welcome_message && (
          <p className="text-green-200 text-sm mt-2 max-w-sm mx-auto">{business.booking_welcome_message}</p>
        )}
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto p-5 space-y-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Your Information</h2>
          <div className="space-y-3">
            <input
              placeholder="Full Name *"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
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
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Service Details</h2>
          <div className="space-y-3">
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
            >
              <option value="">Select a Service *</option>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
                className="border border-gray-300 rounded-xl p-3 text-gray-800"
              />
              <input
                type="time"
                value={preferredTime}
                onChange={e => setPreferredTime(e.target.value)}
                className="border border-gray-300 rounded-xl p-3 text-gray-800"
              />
            </div>
            <p className="text-gray-400 text-xs">Preferred date & time are optional — the business will confirm availability.</p>
            <textarea
              placeholder="Any additional details or special requests..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 resize-none"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-2xl text-lg hover:scale-[1.02] transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {submitting ? '⏳ Sending...' : '🌿 Send Booking Request'}
        </button>

        <p className="text-center text-gray-400 text-xs pb-6">Powered by <span className="font-semibold text-green-600">LawnDesk</span></p>
      </div>
    </div>
  )
}
