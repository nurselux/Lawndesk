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
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  declined: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  approved: '📋 Estimate Created',
  declined: '❌ Declined',
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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

  const createEstimate = async (req: BookingRequest) => {
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
          address: req.address ?? null,
        }])
        .select('id')
        .single()
      clientId = newClient?.id ?? null
    }

    // Create estimate
    await (supabase as any).from('estimates').insert([{
      user_id: session.user.id,
      client_id: clientId,
      client_name: req.client_name,
      client_phone: req.client_phone,
      client_email: req.client_email ?? null,
      service_type: req.service_type,
      address: req.address ?? null,
      scheduled_date: req.preferred_date ?? null,
      scheduled_time: req.preferred_time ?? null,
      notes: req.message ?? null,
      created_from_request_id: req.id,
      status: 'pending',
    }])

    // Mark request as approved
    await (supabase as any).from('booking_requests').update({ status: 'approved' }).eq('id', req.id)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
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

              {/* Action buttons */}
              {req.status === 'pending' && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => createEstimate(req)}
                    disabled={actionLoading === req.id}
                    className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === req.id ? '⏳ Creating...' : '✅ Approve — Create Estimate'}
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

              {req.status === 'approved' && (
                <div className="text-center text-sm text-green-700 font-semibold bg-green-50 rounded-xl py-2">
                  📋 Estimate created — view it in the <a href="/estimates" className="underline">Estimates</a> page
                </div>
              )}

              {req.status === 'declined' && (
                <button
                  onClick={() => createEstimate(req)}
                  disabled={actionLoading === req.id}
                  className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50 w-full"
                >
                  ↩️ Approve — Create Estimate
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
