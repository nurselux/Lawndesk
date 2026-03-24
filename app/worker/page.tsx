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
  user_id: string
}

interface Client {
  id: string
  name: string
  address: string
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
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

export default function WorkerPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth('/login')
  const { profile, loading: profileLoading } = useProfile(user?.id)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [jobs, setJobs] = useState<Job[]>([])
  const [weekJobDates, setWeekJobDates] = useState<Set<string>>(new Set())
  const [clients, setClients] = useState<Client[]>([])
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

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

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('Jobs')
      .select('*')
      .eq('user_id', profile!.owner_id)
      .eq('date', toDateStr(selectedDate))
      .or(`assigned_to.is.null,assigned_to.eq.${profile!.id}`)
      .order('time', { ascending: true })
    if (data) setJobs(data as Job[])
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

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name, address')
      .eq('user_id', profile!.owner_id)
    if (data) setClients(data as Client[])
  }

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    setSaving(jobId)
    await supabase.from('Jobs').update({ status: newStatus }).eq('id', jobId)
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
    setSaving(null)
  }

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
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

  if (authLoading || profileLoading) return (
    <div className="flex items-center justify-center min-h-dvh bg-gray-50">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-green-700 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
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
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-10 px-2 py-3">
        <div className="flex items-center gap-1">
          {/* Prev week */}
          <button
            onClick={prevWeek}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xl cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
          >
            ‹
          </button>

          {/* 7 day pills */}
          <div className="flex flex-1 gap-1">
            {weekDays.map((day, i) => {
              const str = toDateStr(day)
              const isSelected = str === selectedStr
              const isToday = str === todayStr
              const hasJobs = weekJobDates.has(str)

              return (
                <button
                  key={i}
                  onClick={() => selectDay(i)}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all cursor-pointer relative
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
                  {/* Job dot */}
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    hasJobs
                      ? isSelected ? 'bg-green-300' : 'bg-green-500'
                      : 'bg-transparent'
                  }`} />
                </button>
              )
            })}
          </div>

          {/* Next week */}
          <button
            onClick={nextWeek}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xl cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Selected date label + today shortcut */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="font-bold text-gray-800 text-sm leading-none">
            {displayDate(selectedDate)}
            <span className="text-gray-400 font-normal ml-1 text-xs">
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </p>
          {!isCurrentWeek && (
            <button
              onClick={goToToday}
              className="text-xs font-semibold text-green-700 hover:underline cursor-pointer"
            >
              Back to Today
            </button>
          )}
        </div>
      </div>

      {/* Jobs */}
      <div className="flex-1 p-4 space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-gray-700 font-bold text-lg">No jobs scheduled</p>
            <p className="text-gray-400 text-sm mt-1">Nothing on the schedule for this day.</p>
            <button
              onClick={goToToday}
              className="mt-6 text-green-700 font-semibold text-sm hover:underline cursor-pointer"
            >
              Go to Today
            </button>
          </div>
        ) : (
          jobs.map((job) => {
            const client = clients.find(c => c.id === job.client_id)
            const isExpanded = expandedJob === job.id
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
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      className="flex-1 text-xs font-bold py-2 px-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      {isExpanded ? '▲ Hide Photos' : '📸 Photos'}
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
          })
        )}
      </div>

      {/* Bottom summary */}
      {jobs.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-3 flex justify-between text-xs font-semibold text-gray-500">
          <span>{jobs.filter(j => j.status === '🟢 Completed').length} of {jobs.length} completed</span>
          <span>{jobs.filter(j => j.status === '🔵 Scheduled').length} remaining</span>
        </div>
      )}
    </div>
  )
}
