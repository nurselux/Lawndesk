'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import { JOB_STATUS_CONFIG, JobStatus } from '../../lib/status-config'
import { HardHat } from 'lucide-react'

interface Worker {
  id: string
  name: string | null
  role: string
  preset_role: string | null
  hourly_rate: number | null
  phone: string | null
  created_at: string
}

interface Job {
  id: string
  title: string
  client_name: string
  date: string
  time: string | null
  status: string
  clocked_in_at: string | null
  clocked_out_at: string | null
  assigned_to: string | null
}

interface Invite {
  id: string
  email: string
  token: string
  used: boolean
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
  const [errorMessage, setErrorMessage] = useState('')
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editHourlyRate, setEditHourlyRate] = useState('')
  const [editPresetRole, setEditPresetRole] = useState('worker_limited')
  const [savingWorker, setSavingWorker] = useState(false)
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null)
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null)
  const [assigningJobTo, setAssigningJobTo] = useState<string | null>(null)
  const [savingAssign, setSavingAssign] = useState(false)

  useEffect(() => {
    if (user) {
      fetchWorkers()
      fetchInvites()
      fetchJobs()
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
      .select('id, email, token, used, admin_id, created_at')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setInvites(data as Invite[])
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('Jobs')
      .select('id, title, client_name, date, time, status, clocked_in_at, clocked_out_at, assigned_to')
      .eq('user_id', user?.id)
      .not('status', 'eq', 'cancelled')
      .order('date', { ascending: true })
    if (data) setJobs(data as Job[])
  }

  const fmtDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 0) return ''
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const totalHours = (workerId: string) => {
    const completed = jobs.filter(j => j.assigned_to === workerId && j.clocked_in_at && j.clocked_out_at)
    const totalMs = completed.reduce((sum, j) => {
      return sum + (new Date(j.clocked_out_at!).getTime() - new Date(j.clocked_in_at!).getTime())
    }, 0)
    if (totalMs === 0) return null
    const h = Math.floor(totalMs / 3600000)
    const m = Math.floor((totalMs % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const handleAssignJob = async (jobId: string, workerId: string) => {
    setSavingAssign(true)
    await supabase.from('Jobs').update({ assigned_to: workerId }).eq('id', jobId)
    await fetchJobs()
    setSavingAssign(false)
    setAssigningJobTo(null)
    setSuccessMessage('Job assigned!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleUnassignJob = async (jobId: string) => {
    await supabase.from('Jobs').update({ assigned_to: null }).eq('id', jobId)
    await fetchJobs()
    setSuccessMessage('Job unassigned.')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fmtDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    if (d === today.toISOString().slice(0, 10)) return 'Today'
    if (d === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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
      })
      .select()
      .single()

    if (error) {
      setErrorMessage(`Failed to create invite: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 6000)
      setSending(false)
      return
    }

    if (data) {
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
        setSuccessMessage(`✅ Invite created! Use the Copy Link button to share it manually.`)
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

  const handleQuickRoleChange = async (workerId: string, newRole: string) => {
    setSavingRole(workerId)
    const preset = PRESET_ROLES.find(r => r.id === newRole)
    await supabase.from('profiles').update({
      preset_role: newRole,
      permissions: preset?.permissions || null,
    }).eq('id', workerId)
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, preset_role: newRole } : w))
    setChangingRoleFor(null)
    setSavingRole(null)
    setSuccessMessage('Permission level updated!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const pendingInvites = invites.filter(i => !i.used)

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-6 pb-6 bg-gray-50 min-h-dvh max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md"><HardHat className="w-6 h-6" /></div>
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
          {successMessage && (
            <div className="mt-3 bg-green-100 text-green-700 font-bold p-3 rounded-xl text-sm">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="mt-3 bg-red-100 text-red-600 font-bold p-3 rounded-xl text-sm">{errorMessage}</div>
          )}
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
                  {(() => {
                    const daysLeft = Math.max(0, 7 - Math.floor((Date.now() - new Date(invite.created_at).getTime()) / 86400000))
                    return daysLeft === 0
                      ? <p className="text-red-400 text-xs font-semibold">Expired</p>
                      : <p className="text-gray-400 text-xs">Expires in <span className={`font-semibold ${daysLeft <= 2 ? 'text-red-400' : 'text-gray-500'}`}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span></p>
                  })()}
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
              const roleInfo = PRESET_ROLES.find(r => r.id === (worker.preset_role || 'worker_limited'))
              const isChangingRole = changingRoleFor === worker.id
              const isSaving = savingRole === worker.id
              const isExpanded = expandedWorker === worker.id
              const isAssigning = assigningJobTo === worker.id
              const workerJobs = jobs.filter(j => j.assigned_to === worker.id)
              const upcomingJobs = workerJobs.filter(j => j.status !== 'completed')
              const hours = totalHours(worker.id)
              const unassignedJobs = jobs.filter(j => !j.assigned_to && j.status !== 'completed')

              return (
                <div key={worker.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  {/* Worker row */}
                  <div className="flex items-center justify-between p-4 gap-3">
                    <button
                      onClick={() => setExpandedWorker(isExpanded ? null : worker.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="bg-violet-100 text-violet-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                        {worker.name ? worker.name[0].toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 truncate">{worker.name || 'Unnamed Worker'}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {worker.phone && <span className="text-xs text-gray-400">{worker.phone}</span>}
                          {upcomingJobs.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                              {upcomingJobs.length} job{upcomingJobs.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {hours && (
                            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                              ⏱ {hours} logged
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm shrink-0">{isExpanded ? '▲' : '▼'}</span>
                    </button>
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

                  {/* Expanded: jobs + assign */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-white px-4 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assigned Jobs</p>
                        <button
                          onClick={() => setAssigningJobTo(isAssigning ? null : worker.id)}
                          className="text-xs font-bold py-1.5 px-3 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors cursor-pointer"
                        >
                          {isAssigning ? 'Cancel' : '+ Assign Job'}
                        </button>
                      </div>

                      {/* Assign job picker */}
                      {isAssigning && (
                        <div className="mb-4 bg-violet-50 rounded-xl p-3 border border-violet-100">
                          <p className="text-xs font-bold text-violet-700 mb-2">Pick an unassigned job:</p>
                          {unassignedJobs.length === 0 ? (
                            <p className="text-xs text-gray-400">No unassigned jobs available.</p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {unassignedJobs.map(job => (
                                <button
                                  key={job.id}
                                  onClick={() => handleAssignJob(job.id, worker.id)}
                                  disabled={savingAssign}
                                  className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-violet-100 hover:border-violet-400 transition-colors text-left cursor-pointer disabled:opacity-50"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{job.title}</p>
                                    <p className="text-xs text-gray-400">{job.client_name} · {fmtDate(job.date)}</p>
                                  </div>
                                  <span className="text-xs text-violet-600 font-bold shrink-0 ml-2">Assign →</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Worker's jobs list */}
                      {workerJobs.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">No jobs assigned yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {workerJobs.map(job => (
                            <div key={job.id} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{job.title}</p>
                                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                  <span className="text-xs text-gray-400">{job.client_name} · {fmtDate(job.date)}</span>
                                  {job.clocked_in_at && job.clocked_out_at && (
                                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                                      ⏱ {fmtDuration(job.clocked_in_at, job.clocked_out_at)}
                                    </span>
                                  )}
                                  {job.clocked_in_at && !job.clocked_out_at && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-1.5 py-0.5 rounded-full">In progress</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs">{JOB_STATUS_CONFIG[job.status as JobStatus]?.label ?? job.status}</span>
                                <button
                                  onClick={() => handleUnassignJob(job.id)}
                                  className="text-xs text-red-400 hover:text-red-600 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Permission bar */}
                  <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5 font-semibold uppercase tracking-wide">Permissions</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          🔐 {roleInfo?.label || 'Worker (Limited)'}
                        </span>
                        <span className="text-xs text-gray-400">{roleInfo?.description}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setChangingRoleFor(isChangingRole ? null : worker.id)}
                      className="shrink-0 text-xs font-bold py-1.5 px-3 rounded-lg bg-gray-100 text-gray-500 hover:bg-violet-100 hover:text-violet-700 transition-colors cursor-pointer"
                    >
                      {isChangingRole ? 'Cancel' : 'Change'}
                    </button>
                  </div>

                  {/* Inline role picker */}
                  {isChangingRole && (
                    <div className="border-t border-violet-100 bg-violet-50 p-4 space-y-2">
                      <p className="text-xs font-bold text-violet-700 mb-3">Select new permission level:</p>
                      {PRESET_ROLES.map(r => (
                        <button
                          key={r.id}
                          onClick={() => handleQuickRoleChange(worker.id, r.id)}
                          disabled={isSaving}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 ${
                            (worker.preset_role || 'worker_limited') === r.id
                              ? 'border-violet-500 bg-white shadow-sm'
                              : 'border-transparent bg-white hover:border-violet-300'
                          }`}
                        >
                          <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0">
                            {(worker.preset_role || 'worker_limited') === r.id && (
                              <div className="w-2 h-2 rounded-full bg-violet-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              {r.label}
                              {isSaving && <span className="ml-2 text-violet-400 font-normal">Saving…</span>}
                            </p>
                            <p className="text-gray-400 text-xs mt-0.5">{r.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
