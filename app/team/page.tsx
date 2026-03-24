'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'

interface Worker {
  id: string
  name: string | null
  role: string
  preset_role: string | null
  hourly_rate: number | null
  phone: string | null
  created_at: string
}

interface Invite {
  id: string
  email: string
  token: string
  status: string
  created_at: string
}

const PRESET_ROLES = [
  {
    id: 'worker_limited',
    label: 'Worker (Limited)',
    description: 'Their assigned jobs only, no pricing, no client list',
    permissions: { see_all_jobs: false, see_pricing: false, can_edit_jobs: false, see_clients_nav: false, see_clients_detail: 'name_address_only', see_invoices: false, see_quotes: false, see_reports: false },
  },
  {
    id: 'worker',
    label: 'Worker',
    description: 'View all clients, jobs, and quotes including pricing. Cannot edit.',
    permissions: { see_all_jobs: true, see_pricing: true, can_edit_jobs: false, see_clients_nav: true, see_clients_detail: 'full', see_invoices: false, see_quotes: true, see_reports: false },
  },
  {
    id: 'dispatcher',
    label: 'Dispatcher',
    description: 'Edit jobs, clients, and team info. No billing access.',
    permissions: { see_all_jobs: true, see_pricing: false, can_edit_jobs: true, see_clients_nav: true, see_clients_detail: 'full_edit', see_invoices: false, see_quotes: true, see_reports: false },
  },
  {
    id: 'manager',
    label: 'Manager',
    description: 'Full access including billing, excluding reports.',
    permissions: { see_all_jobs: true, see_pricing: true, can_edit_jobs: true, see_clients_nav: true, see_clients_detail: 'full_edit', see_invoices: true, see_quotes: true, see_reports: false },
  },
]

export default function TeamPage() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('worker_limited')
  const [sending, setSending] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editHourlyRate, setEditHourlyRate] = useState('')
  const [editPresetRole, setEditPresetRole] = useState('worker_limited')
  const [savingWorker, setSavingWorker] = useState(false)

  useEffect(() => {
    if (user) {
      fetchWorkers()
      fetchInvites()
    }
  }, [user])

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, role, preset_role, hourly_rate, phone, created_at')
      .eq('owner_id', user?.id)
      .eq('role', 'worker')
    if (data) setWorkers(data as Worker[])
  }

  const fetchInvites = async () => {
    const { data } = await supabase
      .from('invites')
      .select('id, email, token, status, admin_id, created_at')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setInvites(data as Invite[])
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setSending(true)

    const preset = PRESET_ROLES.find(r => r.id === inviteRole)

    const { data, error } = await supabase
      .from('invites')
      .insert({
        admin_id: user?.id,
        email: inviteEmail.trim(),
        metadata: { preset_role: inviteRole, permissions: preset?.permissions },
      })
      .select()
      .single()

    if (!error && data) {
      setInviteEmail('')
      fetchInvites()

      const link = `${window.location.origin}/invite/${data.token}`
      const emailRes = await fetch(
        'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-invite-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            inviteLink: link,
            adminName: user?.email,
          }),
        }
      )
      if (emailRes.ok) {
        setSuccessMessage(`✅ Invite email sent to ${data.email}!`)
      } else {
        setSuccessMessage('Invite created — use the Share button to send it manually.')
      }
      setTimeout(() => setSuccessMessage(''), 6000)
    }
    setSending(false)
  }

  const getInviteLink = (token: string) => `${window.location.origin}/invite/${token}`

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getInviteLink(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const shareLink = async (token: string) => {
    const link = getInviteLink(token)
    if (navigator.share) {
      await navigator.share({ title: 'Join my LawnDesk team', url: link })
    } else {
      copyLink(token)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    await supabase.from('invites').delete().eq('id', inviteId)
    fetchInvites()
  }

  const openEditWorker = (w: Worker) => {
    setEditingWorker(w)
    setEditName(w.name || '')
    setEditPhone(w.phone || '')
    setEditHourlyRate(w.hourly_rate?.toString() || '')
    setEditPresetRole(w.preset_role || 'worker_limited')
  }

  const handleSaveWorker = async () => {
    if (!editingWorker) return
    setSavingWorker(true)
    const preset = PRESET_ROLES.find(r => r.id === editPresetRole)
    await supabase.from('profiles').update({
      name: editName.trim() || null,
      phone: editPhone.trim() || null,
      hourly_rate: editHourlyRate ? parseFloat(editHourlyRate) : null,
      preset_role: editPresetRole,
      permissions: preset?.permissions || null,
    }).eq('id', editingWorker.id)
    setEditingWorker(null)
    fetchWorkers()
    setSuccessMessage('Worker updated!')
    setTimeout(() => setSuccessMessage(''), 3000)
    setSavingWorker(false)
  }

  const removeWorker = async (workerId: string) => {
    if (!confirm('Remove this worker from your team?')) return
    await supabase.from('profiles').update({ role: 'admin', owner_id: null }).eq('id', workerId)
    fetchWorkers()
    setSuccessMessage('Worker removed.')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const pendingInvites = invites.filter(i => i.status !== 'used')

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-6 pb-6 bg-gray-50 min-h-dvh max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">👷</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 leading-none">Team</h2>
          <p className="text-gray-500 text-sm">Invite workers and manage permissions</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-100 text-green-700 font-bold p-4 rounded-xl mb-4 text-sm">{successMessage}</div>
      )}

      {/* Invite form */}
      <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
        <h3 className="font-bold text-gray-800 mb-4">📨 Invite a Worker</h3>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Worker's email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            className="w-full border border-gray-300 rounded-xl p-3 text-gray-800"
          />
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Permission level</label>
            <div className="space-y-2">
              {PRESET_ROLES.map(r => (
                <label key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  inviteRole === r.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                }`}>
                  <input
                    type="radio"
                    name="inviteRole"
                    value={r.id}
                    checked={inviteRole === r.id}
                    onChange={() => setInviteRole(r.id)}
                    className="mt-0.5 accent-violet-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{r.label}</p>
                    <p className="text-gray-400 text-xs">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleInvite}
            disabled={sending || !inviteEmail.trim()}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow disabled:opacity-50"
          >
            {sending ? '⏳ Sending…' : '+ Send Invite'}
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-3">
          An invite email will be sent automatically. You can also share the link via text or WhatsApp.
        </p>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h3 className="font-bold text-gray-800 mb-4">🔗 Pending Invites</h3>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{invite.email}</p>
                  <p className="text-gray-400 text-xs">Sent {new Date(invite.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => shareLink(invite.token)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
                  >
                    📤 Share
                  </button>
                  <button
                    onClick={() => copyLink(invite.token)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors cursor-pointer"
                  >
                    {copiedToken === invite.token ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit worker modal */}
      {editingWorker && (
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6 border border-violet-200">
          <h3 className="font-bold text-gray-800 mb-4">✏️ Edit Worker</h3>
          <div className="space-y-3">
            <input
              placeholder="Full Name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800"
            />
            <input
              placeholder="Phone (optional)"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800"
              type="tel"
            />
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-gray-500 text-sm font-semibold">$</span>
              <input
                placeholder="Hourly rate (internal only)"
                value={editHourlyRate}
                onChange={e => setEditHourlyRate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 pl-8 text-gray-800"
                type="number"
                step="0.01"
                inputMode="decimal"
              />
              <p className="text-xs text-gray-400 mt-1">Labor cost — never shown to the worker</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-2">Permission level</label>
              <div className="space-y-2">
                {PRESET_ROLES.map(r => (
                  <label key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editPresetRole === r.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                  }`}>
                    <input
                      type="radio"
                      name="editRole"
                      value={r.id}
                      checked={editPresetRole === r.id}
                      onChange={() => setEditPresetRole(r.id)}
                      className="mt-0.5 accent-violet-600"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{r.label}</p>
                      <p className="text-gray-400 text-xs">{r.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSaveWorker}
              disabled={savingWorker}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 rounded-xl cursor-pointer shadow disabled:opacity-50"
            >
              {savingWorker ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditingWorker(null)}
              className="border-2 border-gray-200 text-gray-600 font-bold py-3 px-5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active workers */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="font-bold text-gray-800 mb-4">👷 Active Workers ({workers.length})</h3>
        {workers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-5xl mb-3">👷</p>
            <p className="text-gray-700 font-bold mb-1">No workers yet</p>
            <p className="text-gray-400 text-sm">Invite your first worker above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workers.map((worker) => {
              const roleInfo = PRESET_ROLES.find(r => r.id === worker.preset_role)
              return (
                <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-violet-100 text-violet-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                      {worker.name ? worker.name[0].toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 truncate">{worker.name || 'Unnamed Worker'}</p>
                      <p className="text-xs text-gray-400">
                        {roleInfo?.label || 'Worker (Limited)'}
                        {worker.hourly_rate ? ` · $${worker.hourly_rate}/hr` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEditWorker(worker)}
                      className="text-blue-400 hover:text-blue-600 text-sm font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeWorker(worker.id)}
                      className="text-red-400 hover:text-red-600 text-sm font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
