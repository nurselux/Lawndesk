'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

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
  recurring: string
}

interface Client {
  id: string
  name: string
}

const JOB_TYPES = [
  '✏️ Custom',
  '🌿 Lawn Mowing',
  '✂️ Hedge Trimming',
  '💨 Leaf Blowing',
  '🍂 Leaf Removal',
  '🌳 Bush Trimming',
  '🪓 Tree Trimming',
  '🪵 Stump Removal',
  '🪴 Mulching',
  '🌱 Fertilizing',
  '🌾 Weed Control',
  '🕳️ Aeration',
  '🌻 Overseeding',
  '🟩 Sod Installation',
  '🌺 Garden Bed Maintenance',
  '💧 Irrigation System Check',
  '🚿 Pressure Washing',
  '❄️ Snow Removal',
  '🍃 Gutter Cleaning',
  '🧹 General Cleanup',
]

export default function JobsPage() {
  const { user, loading } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [title, setTitle] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState('🔵 Scheduled')
  const [notes, setNotes] = useState('')
  const [recurring, setRecurring] = useState('🔂 One-time')
  const [customRecurring, setCustomRecurring] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCustomTitle, setEditCustomTitle] = useState('')
  const [editClientId, setEditClientId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStatus, setEditStatus] = useState('🔵 Scheduled')
  const [editNotes, setEditNotes] = useState('')
  const [editRecurring, setEditRecurring] = useState('🔂 One-time')
  const [editCustomRecurring, setEditCustomRecurring] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [smsPrompt, setSmsPrompt] = useState<{
    clientName: string
    phone: string
    amount: number
    invoiceNumber: number
    message: string
  } | null>(null)

  useEffect(() => {
    if (user) {
      fetchJobs()
      fetchClients()
    }
  }, [user])

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('Jobs')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: true })
    if (data) setJobs(data as Job[])
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name')
      .eq('user_id', user?.id)
      .order('name', { ascending: true })
    if (data) setClients(data as Client[])
  }

  const generateRecurringDates = (startDate: string, recurringType: string): string[] => {
    const dates: string[] = []
    const start = new Date(startDate)
    const endDate = new Date(start)
    endDate.setMonth(endDate.getMonth() + 3)
    const current = new Date(start)

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      if (recurringType === '📅 Weekly') {
        current.setDate(current.getDate() + 7)
      } else if (recurringType === '🗓️ Biweekly') {
        current.setDate(current.getDate() + 14)
      } else if (recurringType === '📆 Monthly') {
        current.setMonth(current.getMonth() + 1)
      } else {
        break
      }
    }
    return dates
  }

  const handleAddJob = async () => {
    const finalTitle = title === '✏️ Custom' ? customTitle : title
    if (!finalTitle || !clientId || !date) {
      setErrorMessage('Job title, client and date are required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    if (recurring === '✏️ Custom' && !customRecurring) {
      setErrorMessage('Please describe your custom schedule')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)

    const selectedClient = clients.find(c => c.id === clientId)
    const finalRecurring = recurring === '✏️ Custom' ? customRecurring : recurring
    const dates = generateRecurringDates(date, recurring)

    const jobsToInsert = dates.map((d) => ({
      title: finalTitle,
      client_name: selectedClient?.name || '',
      client_id: clientId,
      date: d,
      time,
      status,
      notes,
      recurring: finalRecurring,
      user_id: user?.id,
    }))

    const { error } = await supabase.from('Jobs').insert(jobsToInsert as any)

    if (!error) {
      setTitle('')
      setCustomTitle('')
      setClientId('')
      setDate('')
      setTime('')
      setStatus('🔵 Scheduled')
      setNotes('')
      setRecurring('🔂 One-time')
      setCustomRecurring('')
      setShowForm(false)
      const count = jobsToInsert.length
      setSuccessMessage(
        recurring === '🔂 One-time'
          ? '🎉 Job scheduled successfully!'
          : `🎉 ${count} recurring jobs scheduled for the next 3 months!`
      )
      setTimeout(() => setSuccessMessage(''), 5000)
      fetchJobs()
    } else {
      setErrorMessage(`❌ Failed to save: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleEditJob = (job: Job) => {
    const isKnownType = JOB_TYPES.includes(job.title)
    setEditingJob(job)
    setEditTitle(isKnownType ? job.title : '✏️ Custom')
    setEditCustomTitle(isKnownType ? '' : job.title)
    setEditClientId(job.client_id || '')
    setEditDate(job.date)
    setEditTime(job.time)
    setEditStatus(job.status)
    setEditNotes(job.notes)
    setEditRecurring(job.recurring || '🔂 One-time')
    setEditCustomRecurring('')
    setShowForm(false)
  }

  const handleUpdateJob = async () => {
    const finalTitle = editTitle === '✏️ Custom' ? editCustomTitle : editTitle
    if (!finalTitle || !editClientId || !editDate) {
      setErrorMessage('Job title, client and date are required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const selectedClient = clients.find(c => c.id === editClientId)
    const finalRecurring = editRecurring === '✏️ Custom' ? editCustomRecurring : editRecurring
    const { error } = await (supabase.from('Jobs') as any)
      .update({
        title: finalTitle,
        client_name: selectedClient?.name || '',
        client_id: editClientId,
        date: editDate,
        time: editTime,
        status: editStatus,
        notes: editNotes,
        recurring: finalRecurring,
      })
      .eq('id', editingJob!.id)
    if (!error) {
      setEditingJob(null)
      setSuccessMessage('Job updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchJobs()
    } else {
      setErrorMessage(`Failed to update: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    await supabase.from('Jobs').delete().eq('id', id)
    fetchJobs()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('Jobs').update({ status: newStatus }).eq('id', id)
    fetchJobs()

    if (newStatus === '🟢 Completed') {
      const job = jobs.find(j => j.id === id)
      if (!job?.client_id) return

      const [{ data: clientData }, { data: invoicesData }] = await Promise.all([
        supabase.from('Clients').select('name, phone').eq('id', job.client_id).single(),
        supabase.from('Invoices')
          .select('share_token, amount, invoice_number')
          .eq('client_id', job.client_id)
          .eq('user_id', user?.id)
          .in('status', ['🟡 Unpaid', '🔴 Overdue'])
          .order('created_at', { ascending: false })
          .limit(1),
      ])

      const invoice = invoicesData?.[0]

      if (clientData?.phone && invoice?.share_token) {
        const invoiceUrl = `${window.location.origin}/invoice/${invoice.share_token}`
        const message = `Hi ${clientData.name}! Your lawn service is complete ✅ Here's your invoice for $${Number(invoice.amount).toFixed(2)}: ${invoiceUrl}`
        setSmsPrompt({
          clientName: clientData.name,
          phone: clientData.phone,
          amount: invoice.amount,
          invoiceNumber: invoice.invoice_number,
          message,
        })
      }
    }
  }

  const filteredJobs = jobs.filter((j) => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.client_name.toLowerCase().includes(q) ||
      j.notes?.toLowerCase().includes(q)
    const matchesStatus = filterStatus === 'All' || j.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-6 pb-6 bg-gray-50 min-h-dvh">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">📅</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Jobs</h2>
            <p className="text-gray-500 text-sm">Schedule and track your work</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingJob(null) }}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 px-6 rounded-xl hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer shadow"
        >
          + Schedule Job
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="🔍 Search by title, client, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 text-gray-800 flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 text-gray-800 w-full sm:w-auto"
        >
          <option>All</option>
          <option>🔵 Scheduled</option>
          <option>🟡 In Progress</option>
          <option>🟢 Completed</option>
          <option>🔴 Cancelled</option>
        </select>
      </div>

      {successMessage && (
        <div className="bg-green-100 text-green-700 font-bold p-4 rounded-lg mb-4">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="bg-red-100 text-red-700 font-bold p-4 rounded-lg mb-4">{errorMessage}</div>
      )}

      {smsPrompt && (
        <div className="fixed md:relative bottom-24 md:bottom-auto left-4 right-4 md:left-auto md:right-auto z-40 md:z-auto md:mb-6 bg-white border-2 border-green-400 rounded-2xl p-5 shadow-2xl md:shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 text-green-700 text-2xl w-12 h-12 rounded-xl flex items-center justify-center">📱</div>
            <div>
              <p className="font-bold text-gray-800">Job complete! Text {smsPrompt.clientName}?</p>
              <p className="text-gray-400 text-sm">INV-{String(smsPrompt.invoiceNumber).padStart(3, '0')} · ${Number(smsPrompt.amount).toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
            <p className="text-gray-500 text-xs font-semibold mb-1">Message preview:</p>
            <p className="text-gray-700 text-sm">{smsPrompt.message}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`sms:${smsPrompt.phone}?body=${encodeURIComponent(smsPrompt.message)}`}
              onClick={() => setSmsPrompt(null)}
              className="flex-1"
            >
              <button className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition cursor-pointer">
                📲 Open SMS App
              </button>
            </a>
            <button
              onClick={() => setSmsPrompt(null)}
              className="border-2 border-gray-200 text-gray-500 font-bold py-3 px-5 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🌿 New Job</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              >
                <option value="">Select Job Type *</option>
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {title === '✏️ Custom' && (
                <input
                  placeholder="Enter custom job title *"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="border border-green-400 rounded-lg p-3 text-gray-800"
                />
              )}
            </div>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            >
              <option value="">👤 Select a Client *</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            <select value={recurring} onChange={(e) => setRecurring(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option>🔂 One-time</option>
              <option>📅 Weekly</option>
              <option>🗓️ Biweekly</option>
              <option>📆 Monthly</option>
              <option>✏️ Custom</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option>🔵 Scheduled</option>
              <option>🟡 In Progress</option>
              <option>🟢 Completed</option>
              <option>🔴 Cancelled</option>
            </select>
            {recurring === '✏️ Custom' && (
              <input
                placeholder="Describe your schedule (e.g. Every 10 days)"
                value={customRecurring}
                onChange={(e) => setCustomRecurring(e.target.value)}
                className="border border-green-400 rounded-lg p-3 text-gray-800 sm:col-span-2"
              />
            )}
            <textarea
              placeholder="📝 Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          {recurring !== '🔂 One-time' && recurring !== '✏️ Custom' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-bold text-sm">📅 This will automatically schedule jobs for the next 3 months!</p>
            </div>
          )}
          {recurring === '✏️ Custom' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 font-bold text-sm">📝 Custom schedule will be saved as a note on the job.</p>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddJob} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow">
              {saving ? '⏳ Saving...' : '💾 Save Job'}
            </button>
            <button onClick={() => setShowForm(false)} className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingJob && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">✏️ Edit Job</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <select value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
                <option value="">Select Job Type *</option>
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {editTitle === '✏️ Custom' && (
                <input
                  placeholder="Enter custom job title *"
                  value={editCustomTitle}
                  onChange={(e) => setEditCustomTitle(e.target.value)}
                  className="border border-green-400 rounded-lg p-3 text-gray-800"
                />
              )}
            </div>
            <select value={editClientId} onChange={(e) => setEditClientId(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option value="">👤 Select a Client *</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            <select value={editRecurring} onChange={(e) => setEditRecurring(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option>🔂 One-time</option>
              <option>📅 Weekly</option>
              <option>🗓️ Biweekly</option>
              <option>📆 Monthly</option>
              <option>✏️ Custom</option>
            </select>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option>🔵 Scheduled</option>
              <option>🟡 In Progress</option>
              <option>🟢 Completed</option>
              <option>🔴 Cancelled</option>
            </select>
            {editRecurring === '✏️ Custom' && (
              <input
                placeholder="Describe your schedule (e.g. Every 10 days)"
                value={editCustomRecurring}
                onChange={(e) => setEditCustomRecurring(e.target.value)}
                className="border border-green-400 rounded-lg p-3 text-gray-800 sm:col-span-2"
              />
            )}
            <textarea
              placeholder="📝 Notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleUpdateJob} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow">
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
            <button onClick={() => setEditingJob(null)} className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <p className="text-6xl mb-4">📅</p>
            <p className="text-gray-700 text-xl font-bold mb-2">No jobs scheduled yet</p>
            <p className="text-gray-400 mb-6">Schedule your first job to start tracking your work.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow-md"
            >
              + Schedule Your First Job
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg font-bold">No jobs match your search</p>
            <p className="text-gray-400">Try a different title, client, or status.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className={`bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-t-4 ${
              job.status === '🟢 Completed' ? 'border-green-500' :
              job.status === '🟡 In Progress' ? 'border-yellow-500' :
              job.status === '🔴 Cancelled' ? 'border-red-500' :
              'border-blue-500'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-gray-800">{job.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleEditJob(job)} className="text-blue-400 hover:text-blue-600 hover:scale-110 transition-all duration-200 cursor-pointer text-lg">✏️</button>
                  <button onClick={() => handleDeleteJob(job.id)} className="text-red-400 hover:text-red-600 hover:scale-110 transition-all duration-200 cursor-pointer text-lg">🗑️</button>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-gray-500 text-sm">👤 {job.client_name}</p>
                {job.date && <p className="text-sm"><span className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full text-xs">📅 {job.date}</span>{job.time && <span className="ml-1 bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full text-xs">🕐 {job.time}</span>}</p>}
                {job.recurring && job.recurring !== '🔂 One-time' && (
                  <p className="text-xs"><span className="bg-cyan-50 text-cyan-600 font-semibold px-2 py-0.5 rounded-full">🔄 {job.recurring}</span></p>
                )}
                {job.notes && <p className="text-gray-400 text-xs mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">📝 {job.notes}</p>}
              </div>
              <select
                value={job.status}
                onChange={(e) => handleStatusChange(job.id, e.target.value)}
                className={`text-xs font-bold py-1.5 px-3 rounded-full border-0 cursor-pointer ${
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
          ))
        )}
      </div>
    </div>
  )
}
