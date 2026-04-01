'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'

interface Estimate {
  id: string
  user_id: string
  client_id: string | null
  client_name: string
  client_phone: string | null
  client_email: string | null
  service_type: string
  address: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  status: string
  notes: string | null
  quote_id: string | null
  converted_to_job_id: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  quote_sent: 'bg-purple-100 text-purple-800 border-purple-300',
  converted: 'bg-green-100 text-green-800 border-green-300',
  declined: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  scheduled: '📅 Scheduled',
  quote_sent: '📤 Quote Sent',
  converted: '🌿 Converted to Job',
  declined: '❌ Declined',
}

const FILTERS = ['pending', 'scheduled', 'quote_sent', 'converted', 'declined', 'all'] as const
type Filter = typeof FILTERS[number]

export default function EstimatesPage() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()
  const router = useRouter()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Schedule form state
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [schedNotes, setSchedNotes] = useState('')

  const fetchEstimates = useCallback(async () => {
    if (!user) return
    const { data } = await (supabase as any)
      .from('estimates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEstimates(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) fetchEstimates()
  }, [user, fetchEstimates])

  const updateEstimate = async (id: string, updates: Partial<Estimate>) => {
    await (supabase as any).from('estimates').update(updates).eq('id', id)
    setEstimates(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  const handleSchedule = async (est: Estimate) => {
    if (!schedDate) return
    setActionLoading(est.id)
    await updateEstimate(est.id, {
      status: 'scheduled',
      scheduled_date: schedDate,
      scheduled_time: schedTime || null,
      notes: schedNotes || est.notes,
    })
    setSchedulingId(null)
    setSchedDate('')
    setSchedTime('')
    setSchedNotes('')
    setActionLoading(null)
  }

  const handleConvertToJob = async (est: Estimate) => {
    setActionLoading(est.id)
    const { data: job } = await (supabase as any).from('jobs').insert([{
      user_id: est.user_id,
      client_id: est.client_id,
      client_name: est.client_name,
      title: est.service_type,
      date: est.scheduled_date ?? null,
      time: est.scheduled_time ?? null,
      status: '🔵 Scheduled',
      notes: est.notes ?? null,
    }]).select('id').single()

    await updateEstimate(est.id, {
      status: 'converted',
      converted_to_job_id: job?.id ?? null,
    })
    setActionLoading(null)
  }

  const handleDecline = (id: string) => updateEstimate(id, { status: 'declined' })
  const handleReopen = (id: string) => updateEstimate(id, { status: 'pending' })

  const handleNavigate = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank')
  }

  const handleCreateQuote = (est: Estimate) => {
    router.push(`/quotes?from_estimate=${est.id}`)
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  }

  const filtered = filter === 'all' ? estimates : estimates.filter(e => e.status === filter)
  const activeCount = estimates.filter(e => e.status === 'pending' || e.status === 'scheduled').length

  if (checking) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📋 Estimates</h1>
        {activeCount > 0 && (
          <p className="text-sm text-yellow-700 font-semibold mt-0.5">{activeCount} active {activeCount === 1 ? 'estimate' : 'estimates'}</p>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
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
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <p className="text-green-700 font-bold">Loading...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} estimates yet</p>
          {filter === 'pending' && (
            <p className="text-gray-400 text-sm mt-1">Approve a service request to create an estimate</p>
          )}
        </div>
      )}

      {/* Estimate cards */}
      {filtered.map(est => (
        <div key={est.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Card header */}
          <button
            className="w-full text-left p-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === est.id ? null : est.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-800">{est.client_name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[est.status]}`}>
                    {STATUS_LABELS[est.status]}
                  </span>
                </div>
                <p className="text-sm text-green-700 font-semibold mt-0.5">{est.service_type}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {est.scheduled_date
                    ? `📅 ${formatDate(est.scheduled_date)}${est.scheduled_time ? ` at ${formatTime(est.scheduled_time)}` : ''}`
                    : 'Not yet scheduled'}
                  {est.address && ` · 📍 ${est.address}`}
                </p>
              </div>
              <span className="text-gray-400 text-sm mt-1">{expandedId === est.id ? '▲' : '▼'}</span>
            </div>
          </button>

          {/* Expanded detail */}
          {expandedId === est.id && (
            <div className="border-t border-gray-100 px-4 pb-4 space-y-3 pt-3">
              {/* Contact */}
              <div className="space-y-1">
                {est.client_phone && (
                  <a href={`tel:${est.client_phone}`} className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    📞 {est.client_phone}
                  </a>
                )}
                {est.client_email && (
                  <a href={`mailto:${est.client_email}`} className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    ✉️ {est.client_email}
                  </a>
                )}
                {est.address && (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    📍 {est.address}
                  </p>
                )}
              </div>

              {/* Notes */}
              {est.notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{est.notes}</p>
                </div>
              )}

              {/* Schedule form */}
              {schedulingId === est.id && (
                <div className="bg-blue-50 rounded-xl p-3 space-y-2 border border-blue-200">
                  <p className="text-sm font-bold text-blue-800">Schedule Estimate Visit</p>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Date *</label>
                    <input
                      type="date"
                      value={schedDate}
                      onChange={e => setSchedDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Time (optional)</label>
                    <input
                      type="time"
                      value={schedTime}
                      onChange={e => setSchedTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Notes (optional)</label>
                    <textarea
                      placeholder="Any notes for this estimate visit..."
                      value={schedNotes}
                      onChange={e => setSchedNotes(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 mt-1 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSchedule(est)}
                      disabled={actionLoading === est.id || !schedDate}
                      className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === est.id ? '⏳ Saving...' : '📅 Confirm Schedule'}
                    </button>
                    <button
                      onClick={() => { setSchedulingId(null); setSchedDate(''); setSchedTime(''); setSchedNotes('') }}
                      className="px-4 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {schedulingId !== est.id && (
                <div className="flex gap-2 flex-wrap">
                  {est.status === 'pending' && (
                    <>
                      <button
                        onClick={() => { setSchedulingId(est.id); setSchedDate(est.scheduled_date ?? '') }}
                        className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                      >
                        📅 Schedule
                      </button>
                      <button
                        onClick={() => handleDecline(est.id)}
                        className="px-4 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm cursor-pointer"
                      >
                        ❌ Decline
                      </button>
                    </>
                  )}

                  {est.status === 'scheduled' && (
                    <>
                      {est.address && (
                        <button
                          onClick={() => handleNavigate(est.address!)}
                          className="flex-1 bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                        >
                          🗺️ Navigate
                        </button>
                      )}
                      <button
                        onClick={() => handleCreateQuote(est)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                      >
                        📋 Create Quote
                      </button>
                      <button
                        onClick={() => handleDecline(est.id)}
                        className="px-4 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm cursor-pointer"
                      >
                        ❌
                      </button>
                    </>
                  )}

                  {est.status === 'quote_sent' && (
                    <div className="w-full text-center text-sm text-purple-700 font-semibold bg-purple-50 rounded-xl py-2">
                      📤 Quote sent — awaiting client approval
                    </div>
                  )}

                  {est.status === 'converted' && (
                    <div className="w-full text-center text-sm text-green-700 font-semibold bg-green-50 rounded-xl py-2">
                      🌿 Converted to job — view it in <a href="/jobs" className="underline">Jobs</a>
                    </div>
                  )}

                  {est.status === 'declined' && (
                    <button
                      onClick={() => handleReopen(est.id)}
                      className="flex-1 bg-gray-600 text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                    >
                      ↩️ Reopen
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
