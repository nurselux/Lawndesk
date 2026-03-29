'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/useAuth'
import { supabase } from '../../lib/supabase'
import AdminViewBanner from '../../components/AdminViewBanner'
import UptimeRobotStatus from '../../components/UptimeRobotStatus'

interface AdminUser {
  id: string
  email: string
  business_name: string | null
  subscription_status: string | null
  subscription_plan: string | null
  trial_ends_at: string | null
  created_at: string
}

function statusBadge(status: string | null) {
  if (status === 'active') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>
  if (status === 'trialing') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Trialing</span>
  if (status === 'past_due') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Past Due</span>
  if (status === 'cancelled') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Cancelled</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">—</span>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function trialDaysLeft(trialEndsAt: string | null) {
  if (!trialEndsAt) return null
  const days = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
  if (days <= 0) return <span className="text-red-500 text-xs">Expired</span>
  return <span className="text-xs text-gray-500">{days}d left</span>
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchUsers = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 403) {
        setError('Access denied — admin only')
        setFetching(false)
        return
      }

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to load users')
      } else {
        setUsers(json.users)
      }
      setFetching(false)
    }

    fetchUsers()
  }, [user])

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.business_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const total = users.length
  const active = users.filter(u => u.subscription_status === 'active').length
  const trialing = users.filter(u => u.subscription_status === 'trialing').length
  const atRisk = users.filter(u => u.subscription_status === 'past_due' || u.subscription_status === 'cancelled').length

  if (loading || fetching) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-500 font-medium">{error}</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">All LawnDesk businesses</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Businesses', value: total, color: 'text-gray-800' },
          { label: 'Active', value: active, color: 'text-green-600' },
          { label: 'Trialing', value: trialing, color: 'text-blue-600' },
          { label: 'Past Due / Cancelled', value: atRisk, color: 'text-red-500' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">{card.label}</p>
            <p className={`text-3xl font-black mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Uptime Status */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Uptime Status</h2>
        <UptimeRobotStatus />
      </div>

      {/* Preview as */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preview as</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            🏠 Owner Dashboard
          </a>
          <a
            href="/worker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            👷 Worker View
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label htmlFor="user-search" className="block text-xs font-semibold text-gray-800 mb-2">Search Users</label>
        <input
          id="user-search"
          name="search"
          type="text"
          placeholder="Search by email or business name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-80 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Business', 'Email', 'Plan', 'Status', 'Trial Ends', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-800 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-700">No users found</td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.business_name || <span className="text-gray-600 italic">No name</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{u.subscription_plan || '—'}</td>
                  <td className="px-4 py-3">{statusBadge(u.subscription_status)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{formatDate(u.trial_ends_at)}</div>
                    {u.subscription_status === 'trialing' && trialDaysLeft(u.trial_ends_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
