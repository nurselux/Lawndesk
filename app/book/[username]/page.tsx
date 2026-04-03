'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import AdminViewBanner from '../../../components/AdminViewBanner'

const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: 'lawn_mowing',              label: 'Lawn Mowing' },
  { value: 'hedge_trimming',           label: 'Hedge Trimming' },
  { value: 'leaf_blowing',             label: 'Leaf Blowing' },
  { value: 'leaf_removal',             label: 'Leaf Removal' },
  { value: 'bush_trimming',            label: 'Bush Trimming' },
  { value: 'tree_trimming',            label: 'Tree Trimming' },
  { value: 'mulching',                 label: 'Mulching' },
  { value: 'fertilizing',              label: 'Fertilizing' },
  { value: 'weed_control',             label: 'Weed Control' },
  { value: 'aeration',                 label: 'Aeration' },
  { value: 'overseeding',              label: 'Overseeding' },
  { value: 'sod_installation',         label: 'Sod Installation' },
  { value: 'garden_bed_maintenance',   label: 'Garden Bed Maintenance' },
  { value: 'irrigation_system_check',  label: 'Irrigation System Check' },
  { value: 'pressure_washing',         label: 'Pressure Washing' },
  { value: 'snow_removal',             label: 'Snow Removal' },
  { value: 'gutter_cleaning',          label: 'Gutter Cleaning' },
  { value: 'general_cleanup',          label: 'General Cleanup' },
  { value: 'other',                    label: 'Other' },
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
  const [address, setAddress] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill form from URL params (used by AI receptionist SMS link)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const name = p.get('name')
    if (!name) return
    if (name) setClientName(name)
    const phone = p.get('phone'); if (phone) setClientPhone(phone)
    const email = p.get('email'); if (email) setClientEmail(email)
    const addr = p.get('address'); if (addr) setAddress(addr)
    const date = p.get('date'); if (date) setPreferredDate(date)
    const time = p.get('time'); if (time) setPreferredTime(time)
    const msg = p.get('message'); if (msg) setMessage(msg)
    const service = p.get('service')
    if (service) {
      const match = SERVICE_OPTIONS.find(t => t.label.toLowerCase().includes(service.toLowerCase()) || t.value.toLowerCase().includes(service.toLowerCase()))
      if (match) setServiceType(match.value)
    }
  }, [])

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
    if (!clientName || !clientPhone || !address || !serviceType) {
      setError('Name, phone, address and service type are required.')
      return
    }
    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase.from('booking_requests' as any).insert([{
      owner_id: business!.id,
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone,
      address: address || null,
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
          message: `🌿 New booking request from ${clientName}! Service: ${SERVICE_OPTIONS.find(t => t.value === serviceType)?.label ?? serviceType}${preferredDate ? ` on ${preferredDate}` : ''}. Check your LawnDesk Requests.`,
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
        <p className="text-5xl mb-4">🌿</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking page not found</h1>
        <p className="text-gray-500">This booking link is inactive or doesn't exist.</p>
      </div>
    </>
  )

  if (submitted) return (
    <>
      <AdminViewBanner view="Client Booking" />
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Request Received!</h1>
          <p className="text-gray-500 mb-2">Thanks, <strong>{clientName}</strong>! Your request has been sent to <strong>{business?.business_name || 'the business'}</strong>.</p>
          <p className="text-gray-400 text-sm">We'll be in touch within 24 hours to schedule your free estimate.</p>
        </div>
      </div>
    </>
  )

  return (
    <>
      <AdminViewBanner view="Client Booking" />
      <div className="min-h-dvh bg-gradient-to-br from-green-50 to-emerald-50">
        {/* Header */}
      <div className="bg-green-700 text-white px-6 py-8 text-center">
        <p className="text-3xl mb-2">🌿</p>
        <h1 className="text-2xl font-bold">{business?.business_name || 'Request a Service'}</h1>
        <p className="text-green-200 text-sm mt-1 max-w-sm mx-auto">
          {business?.booking_welcome_message || "Fill out the form and we'll get back to you within 24 hours with a free estimate."}
        </p>
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
            <input
              placeholder="Property Address *"
              value={address}
              onChange={e => setAddress(e.target.value)}
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
              {SERVICE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
          {submitting ? '⏳ Sending...' : '🌿 Request Free Estimate'}
        </button>

        <p className="text-center text-gray-400 text-xs pb-6">Powered by <span className="font-semibold text-green-600">LawnDesk</span></p>
      </div>
    </div>
    </>
  )
}
