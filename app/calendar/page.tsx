'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import Link from 'next/link'

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
}

const STATUS_COLOR: Record<string, string> = {
  '🟢 Completed': 'bg-green-100 text-green-700 border-green-200',
  '🟡 In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '🔴 Cancelled': 'bg-red-100 text-red-700 border-red-200',
  '🔵 Scheduled': 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const { checking } = useSubscriptionGate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchJobs()
      fetchClients()
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
      .select('id, name, address')
      .eq('user_id', user?.id)
    if (data) setClients(data as Client[])
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const jobsByDate = jobs.reduce<Record<string, Job[]>>((acc, job) => {
    if (!acc[job.date]) acc[job.date] = []
    acc[job.date].push(job)
    return acc
  }, {})

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const selectedJobs = selectedDate ? (jobsByDate[selectedDate] || []) : []

  const todayJobs = jobs.filter(j => j.date === today && j.status !== '🔴 Cancelled')
  const todayAddresses = [...new Set(
    todayJobs
      .map(j => clients.find(c => c.id === j.client_id)?.address)
      .filter((a): a is string => !!a && a.trim().length > 0)
  )]
  const routeUrl = todayAddresses.length >= 2
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(todayAddresses[0])}&destination=${encodeURIComponent(todayAddresses[todayAddresses.length - 1])}${todayAddresses.length > 2 ? `&waypoints=${todayAddresses.slice(1, -1).map(a => encodeURIComponent(a)).join('|')}` : ''}`
    : null

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
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">📅</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Calendar</h2>
            <p className="text-gray-500 text-sm">Monthly job overview</p>
          </div>
        </div>
        {routeUrl && (
          <a href={routeUrl} target="_blank" rel="noopener noreferrer">
            <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 px-4 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow text-sm">
              🗺️ Today's Route
            </button>
          </a>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold cursor-pointer transition">‹</button>
        <h3 className="text-lg font-bold text-gray-800">{monthLabel}</h3>
        <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold cursor-pointer transition">›</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayJobs = jobsByDate[dateStr] || []
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`relative min-h-[52px] md:min-h-[72px] rounded-xl p-1.5 text-left transition-all duration-150 cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-md'
                  : isToday
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <span className={`text-xs font-bold ${isSelected ? 'text-white' : isToday ? 'text-indigo-600' : 'text-gray-600'}`}>
                {day}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {dayJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className={`w-full text-xs leading-tight px-1 py-0.5 rounded truncate border ${
                      isSelected ? 'bg-white/20 text-white border-white/30' : STATUS_COLOR[job.status] || STATUS_COLOR['🔵 Scheduled']
                    }`}
                    title={`${job.title} — ${job.client_name}`}
                  >
                    <span className="hidden md:inline">{job.client_name}</span>
                    <span className="md:hidden">•</span>
                  </div>
                ))}
                {dayJobs.length > 3 && (
                  <div className={`text-xs font-bold ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>+{dayJobs.length - 3}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>
            {(() => {
              const addrs = [...new Set(
                selectedJobs
                  .map(j => clients.find(c => c.id === j.client_id)?.address)
                  .filter((a): a is string => !!a && a.trim().length > 0)
              )]
              if (addrs.length < 2) return null
              const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(addrs[0])}&destination=${encodeURIComponent(addrs[addrs.length - 1])}${addrs.length > 2 ? `&waypoints=${addrs.slice(1, -1).map(a => encodeURIComponent(a)).join('|')}` : ''}`
              return (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <button className="text-xs font-bold py-1.5 px-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition cursor-pointer">
                    🗺️ Route
                  </button>
                </a>
              )
            })()}
          </div>
          {selectedJobs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400">No jobs on this day</p>
              <Link href="/jobs">
                <button className="mt-3 text-sm font-bold text-indigo-500 hover:text-indigo-700 cursor-pointer">+ Schedule a job</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedJobs.map((job) => (
                <div key={job.id} className={`flex items-start gap-3 p-3 rounded-xl border ${STATUS_COLOR[job.status] || STATUS_COLOR['🔵 Scheduled']}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{job.title}</p>
                    <p className="text-xs opacity-75">👤 {job.client_name}{job.time ? ` · 🕐 ${job.time}` : ''}</p>
                    {job.recurring && job.recurring !== '🔂 One-time' && (
                      <p className="text-xs opacity-60">🔄 {job.recurring}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold opacity-75 shrink-0">{job.status.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Month summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Scheduled', color: 'blue', status: '🔵 Scheduled' },
          { label: 'In Progress', color: 'yellow', status: '🟡 In Progress' },
          { label: 'Completed', color: 'green', status: '🟢 Completed' },
          { label: 'Cancelled', color: 'red', status: '🔴 Cancelled' },
        ].map(({ label, color, status }) => {
          const count = jobs.filter(j => {
            const d = new Date(j.date + 'T00:00:00')
            return d.getMonth() === month && d.getFullYear() === year && j.status === status
          }).length
          return (
            <div key={label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
