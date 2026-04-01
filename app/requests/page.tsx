'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface BookingRequest {
  id: string
  owner_id: string
  client_name: string
  client_email: string | null
  client_phone: string
  address: string | null
  service_type: string
  preferred_date: string | null
  preferred_time: string | null
  message: string | null
  status: 'pending' | 'approved' | 'declined'
  scheduled_date: string | null
  scheduled_time: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  declined: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  approved: '📅 Visit Scheduled',
  declined: '❌ Declined',
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  // Scheduling form state
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('')

  const fetchRequests = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase as any)
      .from('booking_requests')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const updateStatus = async (id: string, status: BookingRequest['status']) => {
    setActionLoading(id)
    await (supabase as any).from('booking_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setActionLoading(null)
  }

  const openScheduleForm = (req: BookingRequest) => {
    setSchedulingId(req.id)
    setVisitDate(req.preferred_date ?? '')
    setVisitTime(req.preferred_time ?? '')
    setExpandedId(req.id)
  }

  const confirmSchedule = async (req: BookingRequest) => {
    if (!visitDate) return
    setActionLoading(req.id)
    await (supabase as any)
      .from('booking_requests')
      .update({ status: 'approved', scheduled_date: visitDate, scheduled_time: visitTime || null })
      .eq('id', req.id)
    setRequests(prev => prev.map(r =>
      r.id === req.id
        ? { ...r, status: 'approved', scheduled_date: visitDate, scheduled_time: visitTime || null }
        : r
    ))
    setSchedulingId(null)
    setVisitDate('')
    setVisitTime('')
    setActionLoading(null)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-green-700 font-bold text-lg">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📬 Service Requests</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-700 font-semibold mt-0.5">{pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'all', 'declined'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              filter === f
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} requests yet</p>
          {filter === 'pending' && (
            <p className="text-gray-400 text-sm mt-1">Share your booking link to start receiving requests</p>
          )}
        </div>
      )}

      {/* Request cards */}
      {filtered.map(req => (
        <div key={req.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Card header */}
          <button
            className="w-full text-left p-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-800">{req.client_name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                <p className="text-sm text-green-700 font-semibold mt-0.5">{req.service_type}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Requested {formatDate(req.created_at)}
                  {req.preferred_date && ` · Preferred: ${formatDate(req.preferred_date)}${req.preferred_time ? ` at ${formatTime(req.preferred_time)}` : ''}`}
                </p>
              </div>
              <span className="text-gray-400 text-sm mt-1">{expandedId === req.id ? '▲' : '▼'}</span>
            </div>
          </button>

          {/* Expanded detail */}
          {expandedId === req.id && (
            <div className="border-t border-gray-100 px-4 pb-4 space-y-3 pt-3">
              {/* Contact info */}
              <div className="space-y-1">
                <a href={`tel:${req.client_phone}`} className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                  📞 {req.client_phone}
                </a>
                {req.client_email && (
                  <a href={`mailto:${req.client_email}`} className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    ✉️ {req.client_email}
                  </a>
                )}
                {req.address && (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    📍 {req.address}
                  </p>
                )}
              </div>

              {/* Message */}
              {req.message && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Client Message</p>
                  <p className="text-sm text-gray-700">{req.message}</p>
                </div>
              )}

              {/* Action buttons — pending */}
              {req.status === 'pending' && schedulingId !== req.id && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => openScheduleForm(req)}
                    disabled={actionLoading === req.id}
                    className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                  >
                    📅 Schedule Estimate Visit
                  </button>
                  <button
                    onClick={() => updateStatus(req.id, 'declined')}
                    disabled={actionLoading === req.id}
                    className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                  >
                    ❌ Decline
                  </button>
                </div>
              )}

              {/* Inline scheduling form */}
              {schedulingId === req.id && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-green-800">Schedule your site visit</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Date *</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={e => setVisitDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 text-sm bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Time (optional)</label>
                      <input
                        type="time"
                        value={visitTime}
                        onChange={e => setVisitTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmSchedule(req)}
                      disabled={!visitDate || actionLoading === req.id}
                      className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === req.id ? '⏳ Saving...' : '✅ Confirm Visit'}
                    </button>
                    <button
                      onClick={() => { setSchedulingId(null); setVisitDate(''); setVisitTime('') }}
                      className="px-4 border-2 border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Approved state */}
              {req.status === 'approved' && (
                <div className="bg-green-50 rounded-xl py-3 px-4 space-y-1">
                  <p className="text-sm text-green-700 font-bold">
                    📅 Estimate visit scheduled
                    {req.scheduled_date && ` — ${formatDate(req.scheduled_date)}${req.scheduled_time ? ` at ${formatTime(req.scheduled_time)}` : ''}`}
                  </p>
                  <p className="text-xs text-green-600">Shows on your calendar. Create a quote from the Quotes page when ready.</p>
                </div>
              )}

              {/* Declined state */}
              {req.status === 'declined' && schedulingId !== req.id && (
                <button
                  onClick={() => openScheduleForm(req)}
                  disabled={actionLoading === req.id}
                  className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                >
                  ↩️ Schedule Estimate Visit
                </button>
              )}

              {/* Inline scheduling form for declined */}
              {req.status === 'declined' && schedulingId === req.id && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-green-800">Schedule your site visit</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Date *</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={e => setVisitDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 text-sm bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Time (optional)</label>
                      <input
                        type="time"
                        value={visitTime}
                        onChange={e => setVisitTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmSchedule(req)}
                      disabled={!visitDate || actionLoading === req.id}
                      className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === req.id ? '⏳ Saving...' : '✅ Confirm Visit'}
                    </button>
                    <button
                      onClick={() => { setSchedulingId(null); setVisitDate(''); setVisitTime('') }}
                      className="px-4 border-2 border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
