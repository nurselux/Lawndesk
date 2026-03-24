'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useProfile } from '../../lib/useProfile'
import JobPhotoUpload from '../../components/JobPhotoUpload'
import JobPhotoGallery from '../../components/JobPhotoGallery'

interface Job {
  id: string
  title: string
  client_name: string
  client_id: string
  date: string
  time: string
  status: string
  notes: string
  worker_notes: string | null
  clocked_in_at: string | null
  clocked_out_at: string | null
  user_id: string
}

interface Client {
  id: string
  name: string
  address: string | null
  phone: string | null
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function displayDate(date: Date) {
  const todayStr = toDateStr(new Date())
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = toDateStr(tomorrowDate)
  const dateStr = toDateStr(date)
  if (dateStr === todayStr) return 'Today'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatClockTime(ts: string | null) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function calcDuration(start: string | null, end: string | null) {
  if (!start) return ''
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime()
  if (ms < 0) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function WorkerPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth('/login')
  const { profile, loading: profileLoading } = useProfile(user?.id)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [view, setView] = useState<'day' | 'week'>('day')
  const [jobs, setJobs] = useState<Job[]>([])
  const [weekJobs, setWeekJobs] = useState<Job[]>([])
  const [weekJobDates, setWeekJobDates] = useState<Set<string>>(new Set())
  const [clients, setClients] = useState<Client[]>([])
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [workerNotes, setWorkerNotes] = useState<Record<string, string>>({})
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, profileLoading])

  useEffect(() => {
    if (profile?.owner_id) {
      fetchJobs()
      fetchClients()
    }
  }, [profile, selectedDate])

  useEffect(() => {
    if (profile?.owner_id) fetchWeekJobDates()
  }, [profile, weekStart])

  useEffect(() => {
    if (profile?.owner_id && view === 'week') fetchWeekJobs()
  }, [profile, weekStart, view])

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('Jobs')
      .select('id, title, client_name, client_id, date, time, status, notes, worker_notes, clocked_in_at, clocked_out_at, user_id, assigned_to')
      .eq('user_id', profile!.owner_id)
      .eq('date', toDateStr(selectedDate))
      .or(`assigned_to.is.null,assigned_to.eq.${profile!.id}`)
      .order('time', { ascending: true })
    if (data) {
      setJobs(data as Job[])
      const notes: Record<string, string> = {}
      data.forEach((j: any) => { if (j.worker_notes) notes[j.id] = j.worker_notes })
      setWorkerNotes(prev => ({ ...prev, ...notes }))
    }
  }

  const fetchWeekJobDates = async () => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const { data } = await supabase
      .from('Jobs')
      .select('date')
      .eq('user_id', profile!.owner_id)
      .gte('date', toDateStr(weekStart))
      .lte('date', toDateStr(weekEnd))
      .or(`assigned_to.is.null,assigned_to.eq.${profile!.id}`)
    if (data) setWeekJobDates(new Set(data.map((j: any) => j.date)))
  }

  const fetchWeekJobs = async () => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const { data } = await supabase
      .from('Jobs')
      .select('id, title, client_name, client_id, date, time, status, notes, worker_notes, clocked_in_at, clocked_out_at, user_id, assigned_to')
      .eq('user_id', profile!.owner_id)
      .gte('date', toDateStr(weekStart))
      .lte('date', toDateStr(weekEnd))
      .or(`assigned_to.is.null,assigned_to.eq.${profile!.id}`)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (data) {
      setWeekJobs(data as Job[])
      const notes: Record<string, string> = {}
      data.forEach((j: any) => { if (j.worker_notes) notes[j.id] = j.worker_notes })
      setWorkerNotes(prev => ({ ...prev, ...notes }))
    }
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name, address, phone')
      .eq('user_id', profile!.owner_id)
    if (data) setClients(data as Client[])
  }

  const applyJobUpdate = (jobId: string, updates: Partial<Job>) => {
    const fn = (arr: Job[]) => arr.map(j => j.id === jobId ? { ...j, ...updates } : j)
    setJobs(fn)
    setWeekJobs(fn)
  }

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    setSaving(jobId)
    const updates: Partial<Job> = { status: newStatus }
    if (newStatus === '🟡 In Progress') {
      const job = [...jobs, ...weekJobs].find(j => j.id === jobId)
      if (!job?.clocked_in_at) updates.clocked_in_at = new Date().toISOString()
    }
    await supabase.from('Jobs').update(updates).eq('id', jobId)
    applyJobUpdate(jobId, updates)
    setSaving(null)
  }

  const handleClockIn = async (jobId: string) => {
    setSaving(jobId)
    const now = new Date().toISOString()
    await supabase.from('Jobs').update({ clocked_in_at: now, status: '🟡 In Progress' }).eq('id', jobId)
    applyJobUpdate(jobId, { clocked_in_at: now, status: '🟡 In Progress' })
    setSaving(null)
  }

  const handleClockOut = async (jobId: string) => {
    setSaving(jobId)
    const now = new Date().toISOString()
    await supabase.from('Jobs').update({ clocked_out_at: now }).eq('id', jobId)
    applyJobUpdate(jobId, { clocked_out_at: now })
    setSaving(null)
  }

  const handleSaveWorkerNotes = async (jobId: string) => {
    const notes = workerNotes[jobId] ?? ''
    await supabase.from('Jobs').update({ worker_notes: notes || null }).eq('id', jobId)
  }

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
    setSelectedDate(d)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
    setSelectedDate(d)
  }

  const prevMonth = () => {
    const d = new Date(selectedDate)
    d.setDate(1)
    d.setMonth(d.getMonth() - 1)
    setSelectedDate(d)
    setWeekStart(getWeekStart(d))
  }

  const nextMonth = () => {
    const d = new Date(selectedDate)
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    setSelectedDate(d)
    setWeekStart(getWeekStart(d))
  }

  const goToToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setWeekStart(getWeekStart(today))
  }

  const selectDay = (dayIndex: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dayIndex)
    setSelectedDate(d)
  }

  const todayStr = toDateStr(new Date())
  const selectedStr = toDateStr(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
  const isCurrentWeek = toDateStr(weekStart) === toDateStr(getWeekStart(new Date()))

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const renderJobCard = (job: Job) => {
    const client = clients.find(c => c.id === job.client_id)
    const isExpanded = expandedJob === job.id
    const isClockedIn = !!job.clocked_in_at && !job.clocked_out_at
    const isClockedOut = !!job.clocked_in_at && !!job.clocked_out_at
    const notes = workerNotes[job.id] ?? job.worker_notes ?? ''

    return (
      <div
        key={job.id}
        className={`bg-white rounded-2xl shadow-md overflow-hidden border-l-4 ${
          job.status === '🟢 Completed' ? 'border-green-500' :
          job.status === '🟡 In Progress' ? 'border-yellow-500' :
          job.status === '🔴 Cancelled' ? 'border-red-500' :
          'border-blue-500'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-base leading-tight">{job.title}</h3>
              <p className="text-gray-500 text-sm">👤 {job.client_name}</p>
              {job.time && <p className="text-purple-600 text-xs font-semibold mt-0.5">🕐 {job.time}</p>}
            </div>
            <select
              value={job.status}
              onChange={(e) => handleStatusChange(job.id, e.target.value)}
              disabled={saving === job.id}
              className={`shrink-0 text-xs font-bold py-1.5 px-2 rounded-full border-0 cursor-pointer ${
                job.status === '🟢 Completed' ? 'bg-green-100 text-green-700' :
                job.status === '🟡 In Progress' ? 'bg-yellow-100 text-yellow-700' :
                job.status === '🔴 Cancelled' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}
            >
              <option>🔵 Scheduled</option>
              <option>🟡 In Progress</option>
              <option>🟢 Completed</option>
              <option>🔴 Cancelled</option>
            </select>
          </div>

          {job.notes && (
            <p className="text-gray-400 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
              📝 {job.notes}
            </p>
          )}

          {/* Clock in/out */}
          {job.status !== '🔴 Cancelled' && (
            <div className="mb-3">
              {!job.clocked_in_at && (
                <button
                  onClick={() => handleClockIn(job.id)}
                  disabled={saving === job.id}
                  className="w-full text-xs font-bold py-2 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  ⏱ Clock In
                </button>
              )}
              {isClockedIn && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <p className="text-yellow-700 text-xs font-semibold">⏱ In since {formatClockTime(job.clocked_in_at)}</p>
                    <p className="text-yellow-600 text-xs">Time on job: {calcDuration(job.clocked_in_at, null)}</p>
                  </div>
                  <button
                    onClick={() => handleClockOut(job.id)}
                    disabled={saving === job.id}
                    className="shrink-0 text-xs font-bold py-2 px-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    Clock Out
                  </button>
                </div>
              )}
              {isClockedOut && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <p className="text-green-700 text-xs font-semibold">
                    ✅ {formatClockTime(job.clocked_in_at)} → {formatClockTime(job.clocked_out_at)}
                    <span className="ml-2 font-normal text-green-600">({calcDuration(job.clocked_in_at, job.clocked_out_at)})</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Field notes — always visible */}
          <div className="mb-3">
            <textarea
              value={notes}
              onChange={e => setWorkerNotes(prev => ({ ...prev, [job.id]: e.target.value }))}
              onBlur={() => handleSaveWorkerNotes(job.id)}
              placeholder="📋 Add field notes..."
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-300 bg-gray-50"
            />
          </div>

          <div className="flex gap-2">
            {client?.address && (
              <a
                href={`https://maps.apple.com/?daddr=${encodeURIComponent(client.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs font-bold py-2 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                📍 Navigate
              </a>
            )}
            {client?.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex-1 text-center text-xs font-bold py-2 px-3 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
              >
                📞 Call
              </a>
            )}
            <button
              onClick={() => setExpandedJob(isExpanded ? null : job.id)}
              className="flex-1 text-xs font-bold py-2 px-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              {isExpanded ? '▲ Hide' : '📸 Photos'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <JobPhotoUpload jobId={job.id} userId={user?.id} photoType="before" />
              <JobPhotoUpload jobId={job.id} userId={user?.id} photoType="after" />
            </div>
            <JobPhotoGallery jobId={job.id} />
          </div>
        )}
      </div>
    )
  }

  if (authLoading || profileLoading) return (
    <div className="flex items-center justify-center min-h-dvh bg-gray-50">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  const weekJobsByDate = weekDays
    .map(day => ({ date: day, dateStr: toDateStr(day), jobs: weekJobs.filter(j => j.date === toDateStr(day)) }))
    .filter(g => g.jobs.length > 0)

  const stickyTop = isOnline ? 'top-[60px]' : 'top-[36px]'

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-sm font-semibold text-center py-2 px-4 sticky top-0 z-20">
          📵 You're offline — changes won't save until reconnected
        </div>
      )}

      {/* Header */}
      <div className={`bg-green-700 text-white px-5 py-4 flex items-center justify-between sticky z-10 ${isOnline ? 'top-0' : 'top-[36px]'}`}>
        <div>
          <h1 className="text-lg font-bold leading-none">🌿 LawnDesk</h1>
          <p className="text-green-300 text-xs mt-0.5">
            {profile?.name ? `Hi, ${profile.name}` : 'Worker View'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-green-200 text-sm font-semibold hover:text-white transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {/* Week strip */}
      <div className={`bg-white border-b border-gray-200 sticky ${stickyTop} z-10 px-2 py-3`}>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-1 mb-2">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-sm font-bold">‹</button>
          <p className="font-bold text-gray-800 text-sm">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-sm font-bold">›</button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevWeek}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xl cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
          >
            ‹
          </button>

          <div className="flex flex-1 gap-1">
            {weekDays.map((day, i) => {
              const str = toDateStr(day)
              const isSelected = str === selectedStr && view === 'day'
              const isToday = str === todayStr
              const hasJobs = weekJobDates.has(str)
              return (
                <button
                  key={i}
                  onClick={() => { selectDay(i); setView('day') }}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-green-700 text-white shadow-md'
                      : isToday
                      ? 'bg-green-50 text-green-700 ring-2 ring-green-300'
                      : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  <span className={`text-xs font-semibold leading-none ${isSelected ? 'text-green-200' : 'text-gray-400'}`}>
                    {DAY_ABBR[day.getDay()]}
                  </span>
                  <span className={`text-base font-bold leading-tight ${isSelected ? 'text-white' : isToday ? 'text-green-700' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    hasJobs ? (isSelected ? 'bg-green-300' : 'bg-green-500') : 'bg-transparent'
                  }`} />
                </button>
              )
            })}
          </div>

          <button
            onClick={nextWeek}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xl cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Date label + view toggle + today shortcut */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="font-bold text-gray-800 text-sm leading-none">
            {view === 'week'
              ? `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : <>
                  {displayDate(selectedDate)}
                  <span className="text-gray-400 font-normal ml-1 text-xs">
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </>
            }
          </p>
          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <button onClick={goToToday} className="text-xs font-semibold text-green-700 hover:underline cursor-pointer">
                Today
              </button>
            )}
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setView('day')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${view === 'day' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
              >
                Day
              </button>
              <button
                onClick={() => { setView('week'); if (profile?.owner_id) fetchWeekJobs() }}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${view === 'week' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
              >
                Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div className="flex-1 p-4 space-y-4">

        {/* Today's summary banner */}
        {view === 'day' && selectedStr === todayStr && jobs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-green-800 font-bold text-sm">
                You have {jobs.length} job{jobs.length !== 1 ? 's' : ''} today
              </p>
              <p className="text-green-600 text-xs mt-0.5">
                {jobs.filter(j => j.status === '🟢 Completed').length} completed · {jobs.filter(j => j.status === '🔵 Scheduled').length} remaining
              </p>
            </div>
            <span className="text-2xl">🌿</span>
          </div>
        )}

        {/* Day view: empty state */}
        {view === 'day' && jobs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-gray-700 font-bold text-lg">No jobs scheduled</p>
            <p className="text-gray-400 text-sm mt-1">Nothing on the schedule for this day.</p>
            <button onClick={goToToday} className="mt-6 text-green-700 font-semibold text-sm hover:underline cursor-pointer">
              Go to Today
            </button>
          </div>
        )}

        {/* Day view: job cards */}
        {view === 'day' && jobs.map(job => renderJobCard(job))}

        {/* Week view: empty state */}
        {view === 'week' && weekJobsByDate.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-gray-700 font-bold text-lg">No jobs this week</p>
            <button onClick={goToToday} className="mt-6 text-green-700 font-semibold text-sm hover:underline cursor-pointer">
              Go to Today
            </button>
          </div>
        )}

        {/* Week view: grouped by day */}
        {view === 'week' && weekJobsByDate.map(({ date, dateStr, jobs: dayJobs }) => (
          <div key={dateStr} className="space-y-3">
            <p className={`text-xs font-bold uppercase tracking-wide ${dateStr === todayStr ? 'text-green-700' : 'text-gray-400'}`}>
              {dateStr === todayStr ? '⬤ ' : ''}{date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            {dayJobs.map(job => renderJobCard(job))}
          </div>
        ))}
      </div>

      {/* Bottom summary */}
      {view === 'day' && jobs.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-3 flex justify-between text-xs font-semibold text-gray-500">
          <span>{jobs.filter(j => j.status === '🟢 Completed').length} of {jobs.length} completed</span>
          <span>{jobs.filter(j => j.status === '🔵 Scheduled').length} remaining</span>
        </div>
      )}
    </div>
  )
}
