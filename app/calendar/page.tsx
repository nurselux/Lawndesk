'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import Link from 'next/link'
import { JOB_STATUS_CONFIG, JobStatus } from '../../lib/status-config'
import { stripEmoji, recurringConfig } from '../../lib/statusIcons'
import { CalendarDays, ChevronDown, LayoutGrid, Columns, Map, Phone, Navigation, Ruler, RefreshCw, Mail, MapPin, Clock, User, FileText, Inbox, Scissors, Wind, TreePine, Axe, Layers, Sprout, Ban, Circle, Wheat, Grid3x3, Flower2, Droplets, Zap, Snowflake, Pipette, Trash2, Pencil, Minus, type LucideIcon } from 'lucide-react'

const CAL_JOB_ICONS: Record<string, LucideIcon> = {
  '✏️ Custom':                 Pencil,
  '🌿 Lawn Mowing':            Scissors,
  '✂️ Hedge Trimming':         Scissors,
  '💨 Leaf Blowing':           Wind,
  '🍂 Leaf Removal':           Wind,
  '🌳 Bush Trimming':          TreePine,
  '🪓 Tree Trimming':          TreePine,
  '🪵 Stump Removal':          Axe,
  '🪴 Mulching':               Layers,
  '🌱 Fertilizing':            Sprout,
  '🌾 Weed Control':           Ban,
  '🕳️ Aeration':              Circle,
  '🌻 Overseeding':            Wheat,
  '🟩 Sod Installation':       Grid3x3,
  '🌺 Garden Bed Maintenance': Flower2,
  '💧 Irrigation System Check':Droplets,
  '🚿 Pressure Washing':       Zap,
  '❄️ Snow Removal':           Snowflake,
  '🍃 Gutter Cleaning':        Pipette,
  '🧹 General Cleanup':        Trash2,
}


type ViewMode = 'month' | 'week'

interface Job {
  id: string
  title: string
  client_name: string
  client_id: string
  date: string
  time: string
  status: string
  recurring: string
}

interface Client {
  id: string
  name: string
  address: string
  phone: string | null
}

interface EstimateVisit {
  id: string
  client_name: string
  client_phone: string | null
  client_email: string | null
  service_type: string
  address: string | null
  preferred_date: string | null
  preferred_time: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  quote_id: string | null
}

interface Quote {
  id: string
  amount: number
  status: string
}

export default function CalendarPage() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()

  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [estimateVisits, setEstimateVisits] = useState<EstimateVisit[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showEstimatesList, setShowEstimatesList] = useState(false)
  const [showJobsList, setShowJobsList] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  useEffect(() => {
    if (user) {
      fetchJobs()
      fetchClients()
      fetchEstimateVisits()
      fetchQuotes()
      fetchPendingRequestCount()
    }
  }, [user])

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('Jobs')
      .select('id, title, client_name, client_id, date, time, status, recurring')
      .eq('user_id', user?.id)
    if (data) setJobs(data as Job[])
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name, address, phone')
      .eq('user_id', user?.id)
    if (data) setClients(data as Client[])
  }

  const fetchEstimateVisits = async () => {
    const { data } = await (supabase as any)
      .from('booking_requests')
      .select('id, client_name, client_phone, client_email, service_type, address, preferred_date, preferred_time, scheduled_date, scheduled_time, quote_id')
      .eq('owner_id', user?.id)
      .eq('status', 'approved')
    if (data) setEstimateVisits(data as EstimateVisit[])
  }

  const fetchPendingRequestCount = async () => {
    const { count } = await (supabase as any)
      .from('booking_requests')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user?.id)
      .eq('status', 'pending')
      .is('deleted_at', null)
    setPendingRequestCount(count ?? 0)
  }

  const fetchQuotes = async () => {
    const { data } = await (supabase as any)
      .from('quotes')
      .select('id, amount, status')
      .eq('user_id', user?.id)
      .not('status', 'in', '("declined","converted")')
    if (data) setQuotes(data as Quote[])
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Week view helpers
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay()) // anchor to Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const weekLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const jobsByDate = jobs.reduce<Record<string, Job[]>>((acc, job) => {
    if (!acc[job.date]) acc[job.date] = []
    acc[job.date].push(job)
    return acc
  }, {})

  const visitsByDate = estimateVisits.reduce<Record<string, EstimateVisit[]>>((acc, v) => {
    const date = v.scheduled_date || v.preferred_date
    if (!date) return acc
    if (!acc[date]) acc[date] = []
    acc[date].push(v)
    return acc
  }, {})

  const goToPrev = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1))
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))
  }
  const goToNext = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1))
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))
  }


  const selectedJobs = selectedDate ? (jobsByDate[selectedDate] || []) : []
  const selectedVisits = selectedDate ? (visitsByDate[selectedDate] || []) : []

  // Today's route
  const todayJobs = jobs.filter(j => j.date === todayStr && j.status !== 'cancelled')
  const todayVisits = visitsByDate[todayStr] || []
  const todayAddresses = [...new Set([
    ...todayJobs.map(j => clients.find(c => c.id === j.client_id)?.address).filter((a): a is string => !!a && a.trim().length > 0),
    ...todayVisits.map(v => v.address).filter((a): a is string => !!a && a.trim().length > 0),
  ])]
  const routeUrl = todayAddresses.length >= 2
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(todayAddresses[0])}&destination=${encodeURIComponent(todayAddresses[todayAddresses.length - 1])}${todayAddresses.length > 2 ? `&waypoints=${todayAddresses.slice(1, -1).map(a => encodeURIComponent(a)).join('|')}` : ''}`
    : null

  // Render event pills for a given date (shared between month and week views)
  const renderEventPills = (dateStr: string, maxVisible: number, isSelected: boolean) => {
    const dayJobs = jobsByDate[dateStr] || []
    const dayVisits = visitsByDate[dateStr] || []
    const allItems: Array<{ type: 'job'; item: Job } | { type: 'visit'; item: EstimateVisit }> = [
      ...dayJobs.map(j => ({ type: 'job' as const, item: j })),
      ...dayVisits.map(v => ({ type: 'visit' as const, item: v })),
    ]
    const visible = allItems.slice(0, maxVisible)
    const overflow = allItems.length - maxVisible

    return (
      <div className="flex flex-col gap-0.5 mt-1 w-full">
        {visible.map((entry) => {
          if (entry.type === 'job') {
            const job = entry.item
            return (
              <div
                key={job.id}
                className={`w-full text-xs leading-tight rounded overflow-hidden font-medium ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-emerald-600 text-white'
                }`}
                title={`${job.title} — ${job.client_name}`}
              >
                <span className="md:hidden flex items-center justify-center h-3">
                  <span className="w-2 h-2 rounded-full bg-white/90" />
                </span>
                <span className="hidden md:block px-1 py-0.5 truncate">{job.client_name}</span>
              </div>
            )
          } else {
            const visit = entry.item
            return (
              <div
                key={visit.id}
                className={`w-full text-xs leading-tight rounded overflow-hidden font-medium ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-violet-600 text-white'
                }`}
                title={`Estimate: ${visit.client_name} — ${visit.service_type}`}
              >
                <span className="md:hidden flex items-center justify-center h-3">
                  <span className="w-2 h-2 rounded-full bg-white/90" />
                </span>
                <span className="hidden md:flex items-center gap-0.5 px-1 py-0.5 truncate"><Ruler className="w-3 h-3 shrink-0" />{visit.client_name}</span>
              </div>
            )
          }
        })}
        {overflow > 0 && (
          <div className={`text-xs font-bold leading-none pl-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
            +{overflow} more
          </div>
        )}
      </div>
    )
  }

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-dvh">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Calendar</h2>
            <p className="text-gray-500 text-sm">Monthly job overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition cursor-pointer ${viewMode === 'month' ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              aria-label="Month view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition cursor-pointer ${viewMode === 'week' ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              aria-label="Week view"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Week</span>
            </button>
          </div>
          {routeUrl && (
            <a href={routeUrl} target="_blank" rel="noopener noreferrer">
              <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 px-4 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow text-sm">
                <Map className="w-4 h-4" /><span className="hidden sm:inline ml-1">Today's Route</span>
              </button>
            </a>
          )}
        </div>
      </div>

      {/* Month/Week navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrev}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xl font-bold cursor-pointer transition"
          aria-label="Previous"
        >‹</button>
        <h3 className="text-lg font-bold text-gray-800">{viewMode === 'month' ? monthLabel : weekLabel}</h3>
        <button
          onClick={goToNext}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xl font-bold cursor-pointer transition"
          aria-label="Next"
        >›</button>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-600 shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-gray-600">Jobs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-violet-600 shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-gray-600">Estimates</span>
        </div>
      </div>

      {/* ── MONTH VIEW ── */}
      {viewMode === 'month' && (
        <div className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden mb-6">
          {/* Day labels */}
          <div className="grid grid-cols-7 bg-white border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 min-h-[52px] md:min-h-[72px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative min-h-[52px] md:min-h-[72px] p-1.5 text-left align-top transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-500'
                      : isToday
                      ? 'bg-blue-50'
                      : 'bg-white hover:bg-indigo-50'
                  }`}
                  aria-label={`${day} ${isToday ? '(today)' : ''}`}
                  aria-pressed={isSelected}
                >
                  {/* Date number — always top-left */}
                  <span className={`block text-xs font-bold leading-none mb-0.5 ${
                    isSelected ? 'text-white' : isToday ? 'text-indigo-700 font-extrabold' : 'text-gray-600'
                  }`}>
                    {day}
                  </span>
                  {renderEventPills(dateStr, 3, isSelected)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {viewMode === 'week' && (
        <div className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden mb-6">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {weekDays.map((d) => {
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dayJobs = jobsByDate[dateStr] || []
              const dayVisits = visitsByDate[dateStr] || []
              const hasEvents = dayJobs.length > 0 || dayVisits.length > 0

              return (
                <div key={dateStr} className="flex flex-col">
                  {/* Day header */}
                  <div className={`text-center py-2 border-b border-gray-100 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className="text-xs font-bold text-gray-400 uppercase">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-extrabold leading-none mt-0.5 ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {d.getDate()}
                    </div>
                  </div>
                  {/* Events column */}
                  <button
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`flex-1 min-h-[120px] p-1.5 text-left transition cursor-pointer w-full ${
                      isSelected ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-400' : isToday ? 'bg-blue-50/50' : 'bg-white hover:bg-indigo-50'
                    }`}
                    aria-label={`Select ${dateStr}`}
                    aria-pressed={isSelected}
                  >
                    {hasEvents ? (
                      renderEventPills(dateStr, 5, isSelected)
                    ) : (
                      <span className="text-xs text-gray-300 leading-tight">—</span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected day detail — Daily Agenda */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <h4 className="font-bold text-gray-800">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>
            {(() => {
              const jobAddrs = selectedJobs
                .map(j => clients.find(c => c.id === j.client_id)?.address)
                .filter((a): a is string => !!a && a.trim().length > 0)
              const visitAddrs = selectedVisits
                .map(v => v.address)
                .filter((a): a is string => !!a && a.trim().length > 0)
              const allAddrs = [...new Set([...jobAddrs, ...visitAddrs])]
              const url = allAddrs.length >= 2
                ? `https://maps.google.com/maps?saddr=${encodeURIComponent(allAddrs[0])}&daddr=${allAddrs.slice(1).map(a => encodeURIComponent(a)).join('+to:')}`
                : null
              return url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <button className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition cursor-pointer">
                    <Navigation className="w-3.5 h-3.5" /> Route ({allAddrs.length} stops)
                  </button>
                </a>
              ) : null
            })()}
          </div>

          {selectedJobs.length === 0 && selectedVisits.length === 0 ? (
            <div className="text-center py-8 px-5 space-y-3">
              <p className="text-gray-400">Nothing scheduled for this day</p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href={`/jobs?date=${selectedDate}`}>
                  <button className="flex items-center gap-1.5 text-sm font-bold py-2 px-4 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition cursor-pointer">
                    <CalendarDays className="w-4 h-4" /> Schedule a Job
                  </button>
                </Link>
                <Link href={`/requests?date=${selectedDate}`}>
                  <button className="flex items-center gap-1.5 text-sm font-bold py-2 px-4 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer">
                    <Ruler className="w-4 h-4" /> Add Estimate
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {selectedJobs.map((job) => {
                const client = clients.find(c => c.id === job.client_id)
                const address = client?.address
                const phone = client?.phone
                const mapsUrl = address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : null
                const callUrl = phone ? `tel:${phone}` : null
                const statusCfg = JOB_STATUS_CONFIG[job.status as JobStatus]
                return (
                  <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-600 mx-3 my-2 p-4 hover:shadow-md transition-all duration-200">
                    <p className="font-bold text-sm text-gray-800 flex items-center gap-1.5 mb-1">
                      {(() => { const Icon = CAL_JOB_ICONS[job.title]; return Icon ? <><Icon className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />{stripEmoji(job.title)}</> : stripEmoji(job.title) })()}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <User className="w-3 h-3 shrink-0" />{job.client_name}
                      {job.time && <><Clock className="w-3 h-3 shrink-0 ml-1" />{job.time}</>}
                    </p>
                    {job.recurring && !job.recurring.toLowerCase().includes('one') && (
                      <p className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                        <RefreshCw className="w-3 h-3 shrink-0" />{recurringConfig[job.recurring]?.label ?? stripEmoji(job.recurring)}
                      </p>
                    )}
                    {statusCfg && (
                      <span className={`inline-block mb-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bgColor} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    )}
                    <div className="space-y-0.5 mt-1">
                      {callUrl && (
                        <a href={callUrl} className="flex items-center gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-gray-600 text-xs">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                          <span>{phone}</span>
                        </a>
                      )}
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-gray-600 text-xs">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
                          <span className="break-words">{address}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
              {selectedVisits.map((visit) => {
                const mapsUrl = visit.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(visit.address)}` : null
                const callUrl = visit.client_phone ? `tel:${visit.client_phone}` : null
                return (
                  <div key={visit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-violet-600 mx-3 my-2 p-4 hover:shadow-md transition-all duration-200">
                    <p className="flex items-center gap-1.5 font-bold text-sm text-gray-800 mb-1">
                      <Ruler className="w-4 h-4 shrink-0 text-violet-600" aria-hidden="true" /> Estimate — {visit.service_type}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <User className="w-3 h-3 shrink-0" />{visit.client_name}
                      {(visit.scheduled_time || visit.preferred_time) && <><Clock className="w-3 h-3 shrink-0 ml-1" />{visit.scheduled_time || visit.preferred_time}</>}
                    </p>
                    <div className="space-y-0.5 mt-1">
                      {callUrl && (
                        <a href={callUrl} className="flex items-center gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-gray-600 text-xs">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-violet-600" aria-hidden="true" />
                          <span>{visit.client_phone}</span>
                        </a>
                      )}
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-gray-600 text-xs">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-600" aria-hidden="true" />
                          <span className="break-words">{visit.address}</span>
                        </a>
                      )}
                    </div>
                    <Link href={`/estimates?from_req_id=${visit.id}&from_req_name=${encodeURIComponent(visit.client_name)}&from_req_service=${encodeURIComponent(visit.service_type)}${visit.client_phone ? `&from_req_phone=${encodeURIComponent(visit.client_phone)}` : ''}${visit.client_email ? `&from_req_email=${encodeURIComponent(visit.client_email)}` : ''}`} className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold py-2 px-3 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 active:bg-violet-200 transition-colors">
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />{visit.quote_id ? 'View Quote' : 'Create Estimate'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Month overview — Jobs + Estimates as collapsible cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Jobs this month */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowJobsList(v => !v)}
            className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50 transition"
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Jobs</p>
              <p className="text-sm font-bold text-gray-800">
                {jobs.filter(j => { const d = new Date(j.date + 'T00:00:00'); return d.getMonth() === month && d.getFullYear() === year }).length} this month
              </p>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showJobsList ? 'rotate-180' : ''}`} />
          </button>
          {showJobsList && (
            <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-1.5">
              {[
                { label: 'Scheduled', color: 'text-blue-600', status: 'scheduled' },
                { label: 'Completed', color: 'text-green-700', status: 'completed' },
                { label: 'Cancelled', color: 'text-red-500', status: 'cancelled' },
              ].map(({ label, color, status }) => {
                const count = jobs.filter(j => {
                  const d = new Date(j.date + 'T00:00:00')
                  return d.getMonth() === month && d.getFullYear() === year && j.status === status
                }).length
                return (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{count}</span>
                  </div>
                )
              })}
              <div className="pt-1">
                <Link href="/jobs"><span className="text-xs text-indigo-500 font-semibold cursor-pointer">View all jobs →</span></Link>
              </div>
            </div>
          )}
        </div>

        {/* Estimate visits this month */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowEstimatesList(v => !v)}
            className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50 transition"
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estimates</p>
              <p className="text-sm font-bold text-gray-800">
                {estimateVisits.filter(v => { const date = v.scheduled_date || v.preferred_date; if (!date) return false; const d = new Date(date + 'T00:00:00'); return d.getMonth() === month && d.getFullYear() === year }).length} this month
              </p>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showEstimatesList ? 'rotate-180' : ''}`} />
          </button>
          {showEstimatesList && (
            <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-1.5">
              {(() => {
                const monthVisits = estimateVisits.filter(v => {
                  const date = v.scheduled_date || v.preferred_date
                  if (!date) return false
                  const d = new Date(date + 'T00:00:00')
                  return d.getMonth() === month && d.getFullYear() === year
                })
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Visits scheduled</span>
                      <span className="text-sm font-bold text-purple-700">{monthVisits.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Awaiting estimate</span>
                      <span className="text-sm font-bold text-amber-600">{monthVisits.filter(v => !v.quote_id).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">New requests</span>
                      <span className={`text-sm font-bold ${pendingRequestCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{pendingRequestCount}</span>
                    </div>
                    {monthVisits.length > 0 && (
                      <div className="pt-2 divide-y divide-gray-50">
                        {[...monthVisits]
                          .sort((a, b) => {
                            const da = a.scheduled_date || a.preferred_date || ''
                            const db = b.scheduled_date || b.preferred_date || ''
                            return da.localeCompare(db)
                          })
                          .map(visit => {
                            const date = visit.scheduled_date || visit.preferred_date
                            return (
                              <div key={visit.id} className="flex items-center gap-3 py-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">{visit.client_name}</p>
                                  <p className="text-xs text-gray-500 truncate">{visit.service_type}{date ? ` · ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</p>
                                </div>
                                <Link href={`/estimates?from_req_id=${visit.id}&from_req_name=${encodeURIComponent(visit.client_name)}&from_req_service=${encodeURIComponent(visit.service_type)}${visit.client_phone ? `&from_req_phone=${encodeURIComponent(visit.client_phone)}` : ''}${visit.client_email ? `&from_req_email=${encodeURIComponent(visit.client_email)}` : ''}`}>
                                  <button className={`flex items-center justify-center text-xs font-bold px-2 py-1 rounded-lg cursor-pointer shrink-0 transition ${visit.quote_id ? 'bg-gray-100 text-gray-500' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}>
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                </Link>
                              </div>
                            )
                          })}
                      </div>
                    )}
                    <div className="pt-1">
                      <Link href="/requests"><span className="text-xs text-purple-600 font-semibold cursor-pointer">Manage requests →</span></Link>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Pending requests action banner */}
      {pendingRequestCount > 0 && (
        <Link href="/requests">
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-yellow-800">{pendingRequestCount} unscheduled {pendingRequestCount === 1 ? 'request' : 'requests'}</p>
                <p className="text-xs text-yellow-700">Tap to schedule visits</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-yellow-600 -rotate-90" />
          </div>
        </Link>
      )}

      {/* Open quotes pipeline */}
      {quotes.length > 0 && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-900 text-sm">Estimate Pipeline</p>
                <p className="text-xs text-amber-700">Potential revenue — not yet confirmed</p>
              </div>
            </div>
            <Link href="/estimates">
              <span className="text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer">View all →</span>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['draft', 'sent', 'approved'] as const).map((status) => {
              const matching = quotes.filter(q => q.status === status)
              const total = matching.reduce((sum, q) => sum + (q.amount || 0), 0)
              const label = status === 'draft' ? 'Draft' : status === 'sent' ? 'Sent' : 'Approved'
              return (
                <div key={status} className="bg-white rounded-xl p-3 text-center border border-amber-100">
                  <p className="text-xl font-bold text-amber-700">{matching.length}</p>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  {total > 0 && (
                    <p className="text-xs text-amber-600 font-semibold">${total.toLocaleString()}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
