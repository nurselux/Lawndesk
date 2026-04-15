'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import { JOB_STATUS_CONFIG, JobStatus } from '../../lib/status-config'
import { HardHat, ChevronDown, ChevronUp, X } from 'lucide-react'
import ProGate from '../../components/ProGate'

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
    badgeClass: 'bg-gray-100 text-gray-600',
    permissions: { see_all_jobs: false, see_pricing: false, can_edit_jobs: false, see_clients_nav: false, see_clients_detail: 'name_address_only', see_invoices: false, see_quotes: false, see_reports: false },
  },
  {
    id: 'worker',
    label: 'Worker',
    description: 'View all clients, jobs, and quotes including pricing. Cannot edit.',
    badgeClass: 'bg-blue-100 text-blue-700',
    permissions: { see_all_jobs: true, see_pricing: true, can_edit_jobs: false, see_clients_nav: true, see_clients_detail: 'full', see_invoices: false, see_quotes: true, see_reports: false },
  },
  {
    id: 'dispatcher',
    label: 'Dispatcher',
    description: 'Edit jobs, clients, and team info. No billing access.',
    badgeClass: 'bg-amber-100 text-amber-700',
    permissions: { see_all_jobs: true, see_pricing: false, can_edit_jobs: true, see_clients_nav: true, see_clients_detail: 'full_edit', see_invoices: false, see_quotes: true, see_reports: false },
  },
  {
    id: 'manager',
    label: 'Manager',
    description: 'Full access including billing, excluding reports.',
    badgeClass: 'bg-violet-100 text-violet-700',
    permissions: { see_all_jobs: true, see_pricing: true, can_edit_jobs: true, see_clients_nav: true, see_clients_detail: 'full_edit', see_invoices: true, see_quotes: true, see_reports: false },
  },
]

function RoleSelect({
  value,
  onChange,
  showDescription = true,
}: {
  value: string
  onChange: (v: string) => void
  showDescription?: boolean
}) {
  const selected = PRESET_ROLES.find(r => r.id === value)
  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-3 py-3 text-gray-800 bg-white appearance-none min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400"
      >
        {PRESET_ROLES.map(r => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>
      {showDescription && selected && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          {selected.description}
        </p>
      )}
    </div>
  )
}

export default function TeamPage() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
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
    showSuccess('Job assigned!')
  }

  const handleUnassignJob = async (jobId: string) => {
    await supabase.from('Jobs').update({ assigned_to: null }).eq('id', jobId)
    await fetchJobs()
    showSuccess('Job unassigned.')
  }

  const fmtDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    if (d === today.toISOString().slice(0, 10)) return 'Today'
    if (d === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setSending(true)

    const { data, error } = await supabase
      .from('invites')
      .insert({ admin_id: user?.id, email: inviteEmail.trim() })
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
      setInviteOpen(false)
      fetchInvites()

      const link = `${window.location.origin}/invite/${data.token}`
      const emailRes = await fetch(
        'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-invite-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, inviteLink: link, adminName: user?.email }),
        }
      )
      showSuccess(emailRes.ok
        ? `Invite email sent to ${data.email}!`
        : `Invite created! Use the Copy Link button to share it manually.`
      )
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
    showSuccess('Worker updated!')
    setSavingWorker(false)
  }

  const removeWorker = async (workerId: string) => {
    if (!confirm('Remove this worker from your team?')) return
    await supabase.from('profiles').update({ role: 'admin', owner_id: null }).eq('id', workerId)
    fetchWorkers()
    showSuccess('Worker removed.')
  }

  const pendingInvites = invites.filter(i => !i.used)

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <ProGate page featureName="Team Management" description="Invite workers, assign jobs, and manage crew permissions. Available on the Pro plan.">
      <div className="p-4 sm:p-6 pb-24 bg-gray-50 min-h-dvh max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 leading-none">Team</h2>
              <p className="text-gray-500 text-sm">Invite workers and manage permissions</p>
            </div>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-2.5 px-4 rounded-xl shadow text-sm min-h-[44px] cursor-pointer"
          >
            + Invite
          </button>
        </div>

        {/* Global success/error banners */}
        {successMessage && (
          <div className="bg-green-100 text-green-700 font-bold p-4 rounded-xl mb-4 text-sm">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="bg-red-100 text-red-600 font-bold p-4 rounded-xl mb-4 text-sm">{errorMessage}</div>
        )}

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md mb-4 overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <h3 className="font-bold text-gray-800 text-sm">🔗 Pending Invites</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingInvites.map((invite) => {
                const daysLeft = Math.max(0, 7 - Math.floor((Date.now() - new Date(invite.created_at).getTime()) / 86400000))
                return (
                  <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm truncate">{invite.email}</p>
                      {daysLeft === 0
                        ? <p className="text-red-400 text-xs font-semibold">Expired</p>
                        : <p className="text-gray-400 text-xs">Expires in <span className={`font-semibold ${daysLeft <= 2 ? 'text-red-400' : 'text-gray-500'}`}>{daysLeft}d</span></p>
                      }
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => shareLink(invite.token)} className="min-h-[44px] px-3 rounded-lg bg-green-100 text-green-700 text-xs font-bold cursor-pointer">📤</button>
                      <button onClick={() => copyLink(invite.token)} className="min-h-[44px] px-3 rounded-lg bg-violet-100 text-violet-700 text-xs font-bold cursor-pointer">
                        {copiedToken === invite.token ? '✓' : '📋'}
                      </button>
                      <button onClick={() => deleteInvite(invite.id)} className="min-h-[44px] px-3 rounded-lg bg-red-50 text-red-400 text-xs font-bold cursor-pointer">🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Active workers accordion */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">👷 Active Workers ({workers.length})</h3>
          </div>

          {workers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-5xl mb-3">👷</p>
              <p className="text-gray-700 font-bold mb-1">No workers yet</p>
              <p className="text-gray-400 text-sm">Tap <strong>+ Invite</strong> above to add your first crew member.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {workers.map((worker) => {
                const roleInfo = PRESET_ROLES.find(r => r.id === (worker.preset_role || 'worker_limited')) ?? PRESET_ROLES[0]
                const isExpanded = expandedWorker === worker.id
                const isAssigning = assigningJobTo === worker.id
                const workerJobs = jobs.filter(j => j.assigned_to === worker.id)
                const upcomingJobs = workerJobs.filter(j => j.status !== 'completed')
                const hours = totalHours(worker.id)
                const unassignedJobs = jobs.filter(j => !j.assigned_to && j.status !== 'completed')
                const initials = worker.name
                  ? worker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : '?'

                return (
                  <div key={worker.id}>
                    {/* Accordion header — collapsed state */}
                    <button
                      onClick={() => setExpandedWorker(isExpanded ? null : worker.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="bg-violet-100 text-violet-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 select-none">
                        {initials}
                      </div>

                      {/* Name + job count */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{worker.name || 'Unnamed Worker'}</p>
                        {upcomingJobs.length > 0 && (
                          <p className="text-xs text-gray-400">{upcomingJobs.length} job{upcomingJobs.length !== 1 ? 's' : ''} assigned</p>
                        )}
                      </div>

                      {/* Role badge */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${roleInfo.badgeClass}`}>
                        {roleInfo.label}
                      </span>

                      {/* Chevron */}
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      }
                    </button>

                    {/* Accordion expanded content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
                        {/* Permission description */}
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Permissions</p>
                          <p className="text-sm text-gray-600">{roleInfo.description}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditWorker(worker)}
                            className="flex-1 min-h-[44px] bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl text-sm cursor-pointer hover:border-violet-400 hover:text-violet-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeWorker(worker.id)}
                            className="flex-1 min-h-[44px] bg-white border-2 border-red-100 text-red-400 font-bold rounded-xl text-sm cursor-pointer hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Assigned jobs */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Assigned Jobs</p>
                            <button
                              onClick={() => setAssigningJobTo(isAssigning ? null : worker.id)}
                              className="text-xs font-bold py-2 px-3 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors cursor-pointer min-h-[36px]"
                            >
                              {isAssigning ? 'Cancel' : '+ Assign Job'}
                            </button>
                          </div>

                          {/* Assign job picker */}
                          {isAssigning && (
                            <div className="mb-3 bg-violet-50 rounded-xl p-3 border border-violet-100">
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
                                      className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-violet-100 hover:border-violet-400 transition-colors text-left cursor-pointer disabled:opacity-50 min-h-[44px]"
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

                          {/* Worker jobs list */}
                          {workerJobs.length === 0 ? (
                            <p className="text-xs text-gray-400 py-1">No jobs assigned yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {workerJobs.map(job => (
                                <div key={job.id} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
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
                                      className="text-xs text-red-400 hover:text-red-600 font-semibold cursor-pointer min-h-[36px] px-1"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {hours && (
                            <p className="text-xs text-gray-400 mt-2">⏱ <span className="font-semibold text-gray-600">{hours}</span> logged total</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Invite Drawer/Dialog ── */}
      {inviteOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setInviteOpen(false)}
          />
          {/* Panel: slides up from bottom on mobile, centered dialog on sm+ */}
          <div className="fixed z-50 inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 pointer-events-none">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:w-full w-full max-h-[90dvh] overflow-y-auto pointer-events-auto shadow-2xl">
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="px-6 pb-6 pt-4">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-800 text-lg">📨 Invite a Worker</h3>
                  <button
                    onClick={() => setInviteOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Email address</label>
                    <input
                      type="email"
                      placeholder="worker@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Permission level</label>
                    <RoleSelect value={inviteRole} onChange={setInviteRole} />
                  </div>

                  <button
                    onClick={handleInvite}
                    disabled={sending || !inviteEmail.trim()}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow disabled:opacity-50 min-h-[44px]"
                  >
                    {sending ? '⏳ Sending…' : '+ Send Invite'}
                  </button>

                  <p className="text-gray-400 text-xs text-center">
                    An invite email will be sent automatically. You can also share the link via text or WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Edit Worker Dialog ── */}
      {editingWorker && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setEditingWorker(null)}
          />
          <div className="fixed z-50 inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 pointer-events-none">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:w-full w-full max-h-[90dvh] overflow-y-auto pointer-events-auto shadow-2xl">
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="px-6 pb-6 pt-4">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-800 text-lg">✏️ Edit Worker</h3>
                  <button
                    onClick={() => setEditingWorker(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Full name</label>
                    <input
                      placeholder="Full Name"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Phone (optional)</label>
                    <input
                      placeholder="Phone"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400"
                      type="tel"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Hourly rate (internal only)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-gray-500 text-sm font-semibold">$</span>
                      <input
                        placeholder="0.00"
                        value={editHourlyRate}
                        onChange={e => setEditHourlyRate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 pl-8 text-gray-800 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Labor cost — never shown to the worker</p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Permission level</label>
                    <RoleSelect value={editPresetRole} onChange={setEditPresetRole} />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSaveWorker}
                      disabled={savingWorker}
                      className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 rounded-xl cursor-pointer shadow disabled:opacity-50 min-h-[44px]"
                    >
                      {savingWorker ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditingWorker(null)}
                      className="border-2 border-gray-200 text-gray-600 font-bold py-3 px-5 rounded-xl cursor-pointer min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ProGate>
  )
}
