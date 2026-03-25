'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface BookingRequest {
  id: string
  owner_id: string
  client_name: string
  client_email: string | null
  client_phone: string
  service_type: string
  preferred_date: string | null
  preferred_time: string | null
  message: string | null
  status: 'pending' | 'approved' | 'declined' | 'converted'
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  declined: 'bg-red-100 text-red-800 border-red-300',
  converted: 'bg-blue-100 text-blue-800 border-blue-300',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  approved: '✅ Approved',
  declined: '❌ Declined',
  converted: '🌿 Converted to Job',
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined' | 'converted'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [convertDate, setConvertDate] = useState('')
  const [convertNotes, setConvertNotes] = useState('')

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

  const convertToJob = async (req: BookingRequest) => {
    setActionLoading(req.id)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Find or create client
    let clientId: string | null = null
    const { data: existing } = await (supabase as any)
      .from('clients')
      .select('id')
      .eq('user_id', session.user.id)
      .ilike('name', req.client_name)
      .maybeSingle()

    if (existing) {
      clientId = existing.id
    } else {
      const { data: newClient } = await (supabase as any)
        .from('clients')
        .insert([{
          user_id: session.user.id,
          name: req.client_name,
          email: req.client_email ?? null,
          phone: req.client_phone,
        }])
        .select('id')
        .single()
      clientId = newClient?.id ?? null
    }

    // Create job
    await (supabase as any).from('jobs').insert([{
      user_id: session.user.id,
      client_id: clientId,
      title: req.service_type,
      scheduled_date: convertDate || req.preferred_date || null,
      status: '🟡 Scheduled',
      notes: [
        req.message ? `Client note: ${req.message}` : null,
        convertNotes ? `Internal note: ${convertNotes}` : null,
      ].filter(Boolean).join('\n') || null,
    }])

    // Mark request as converted
    await (supabase as any).from('booking_requests').update({ status: 'converted' }).eq('id', req.id)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'converted' } : r))
    setConvertingId(null)
    setConvertDate('')
    setConvertNotes('')
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
          <h1 className="text-2xl font-bold text-gray-800">📬 Booking Requests</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-700 font-semibold mt-0.5">{pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'all', 'declined', 'converted'] as const).map(f => (
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
              </div>

              {/* Message */}
              {req.message && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Client Message</p>
                  <p className="text-sm text-gray-700">{req.message}</p>
                </div>
              )}

              {/* Convert to job form */}
              {convertingId === req.id && (
                <div className="bg-green-50 rounded-xl p-3 space-y-2 border border-green-200">
                  <p className="text-sm font-bold text-green-800">Convert to Job</p>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Scheduled Date</label>
                    <input
                      type="date"
                      value={convertDate}
                      defaultValue={req.preferred_date ?? ''}
                      onChange={e => setConvertDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Internal Notes (optional)</label>
                    <textarea
                      placeholder="Add any notes for the job..."
                      value={convertNotes}
                      onChange={e => setConvertNotes(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 mt-1 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => convertToJob(req)}
                      disabled={actionLoading === req.id}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === req.id ? '⏳ Creating...' : '✅ Create Job'}
                    </button>
                    <button
                      onClick={() => { setConvertingId(null); setConvertDate(''); setConvertNotes('') }}
                      className="px-4 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {req.status !== 'converted' && convertingId !== req.id && (
                <div className="flex gap-2 flex-wrap">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(req.id, 'approved')}
                        disabled={actionLoading === req.id}
                        className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === req.id ? '⏳' : '✅ Approve'}
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, 'declined')}
                        disabled={actionLoading === req.id}
                        className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                      >
                        ❌ Decline
                      </button>
                    </>
                  )}
                  {(req.status === 'approved' || req.status === 'pending') && (
                    <button
                      onClick={() => { setConvertingId(req.id); setConvertDate(req.preferred_date ?? '') }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                    >
                      🌿 Convert to Job
                    </button>
                  )}
                  {req.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(req.id, 'declined')}
                      disabled={actionLoading === req.id}
                      className="px-4 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm cursor-pointer"
                    >
                      ❌ Decline
                    </button>
                  )}
                  {req.status === 'declined' && (
                    <button
                      onClick={() => updateStatus(req.id, 'approved')}
                      disabled={actionLoading === req.id}
                      className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                    >
                      ✅ Approve
                    </button>
                  )}
                </div>
              )}

              {req.status === 'converted' && (
                <div className="text-center text-sm text-blue-700 font-semibold bg-blue-50 rounded-xl py-2">
                  🌿 This request has been converted to a job
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
