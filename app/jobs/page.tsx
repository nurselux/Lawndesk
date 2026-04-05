'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import JobPhotoUpload from '../../components/JobPhotoUpload'
import JobPhotoGallery from '../../components/JobPhotoGallery'
import { getJobPhotos, getPhotoUrl, JobPhoto } from '../../lib/jobPhotos'
import { Leaf, Map, Pencil, Trash2, MessageSquare, CalendarDays, Clock, FileText, User, Search, Phone, MapPin, Camera, RefreshCw, Minus } from 'lucide-react'
import { JobStatusBadge, jobStatusConfig, stripEmoji } from '../../lib/statusIcons'

interface Job {
  id: string
  title: string
  client_name: string
  client_id: string
  date: string
  time: string
  status: string
  notes: string
  worker_notes?: string | null
  clocked_in_at?: string | null
  clocked_out_at?: string | null
  user_id: string
  recurring: string
  assigned_to?: string
}

function fmtClock(ts: string | null | undefined) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDuration(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return ''
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface Client {
  id: string
  name: string
  address: string
  phone: string
  email: string
}

interface Worker {
  id: string
  name: string | null
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
  const { checking } = useSubscriptionGate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [title, setTitle] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState('🔵 Scheduled')
  const [notes, setNotes] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [recurring, setRecurring] = useState('🔂 One-time')
  const [customRecurring, setCustomRecurring] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterPeriod, setFilterPeriod] = useState('All')
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
  const [editAssignedTo, setEditAssignedTo] = useState('')
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
  const [photosUploadedFor, setPhotosUploadedFor] = useState<string | null>(null)
  const [showPhotos, setShowPhotos] = useState<string | null>(null)
  const [cardPhotos, setCardPhotos] = useState<Record<string, JobPhoto[]>>({})
  const [notifyingJob, setNotifyingJob] = useState<string | null>(null)
  const [notifiedJob, setNotifiedJob] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchJobs()
      fetchClients()
      fetchWorkers()
    }
  }, [user])

  const fetchAllPhotos = async (jobIds: string[]) => {
    const entries = await Promise.all(
      jobIds.map(async (id) => [id, await getJobPhotos(id)] as [string, JobPhoto[]])
    )
    setCardPhotos(Object.fromEntries(entries))
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('Jobs')
      .select('id, title, client_name, client_id, date, time, status, notes, worker_notes, clocked_in_at, clocked_out_at, user_id, assigned_to, recurring')
      .eq('user_id', user?.id)
      .order('date', { ascending: true })
    if (data) {
      setJobs(data as Job[])
      fetchAllPhotos(data.map((j) => j.id))
    }
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name, address, phone, email')
      .eq('user_id', user?.id)
      .order('name', { ascending: true })
    if (data) setClients(data as Client[])
  }

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('owner_id', user?.id)
      .eq('role', 'worker')
    if (data) setWorkers(data as Worker[])
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
      time: time || null,
      status,
      notes,
      recurring: finalRecurring,
      user_id: user?.id,
      assigned_to: assignedTo || null,
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
      setAssignedTo('')
      setRecurring('🔂 One-time')
      setCustomRecurring('')
      setShowForm(false)
      const count = jobsToInsert.length
      setSuccessMessage(
        recurring === '🔂 One-time'
          ? 'Job scheduled successfully!'
          : `${count} recurring jobs scheduled for the next 3 months!`
      )
      setTimeout(() => setSuccessMessage(''), 5000)
      fetchJobs()
    } else {
      setErrorMessage(`Failed to save: ${error.message}`)
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
    setEditAssignedTo(job.assigned_to || '')
    setEditRecurring(job.recurring || '🔂 One-time')
    setEditCustomRecurring('')
    setShowForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        time: editTime || null,
        status: editStatus,
        notes: editNotes,
        recurring: finalRecurring,
        assigned_to: editAssignedTo || null,
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

  const handleNotifyClient = async (job: Job) => {
    const client = clients.find(c => c.id === job.client_id)
    if (!client?.phone && !client?.email) {
      setErrorMessage('No phone or email on file for this client.')
      setTimeout(() => setErrorMessage(''), 4000)
      return
    }
    setNotifyingJob(job.id)
    try {
      await fetch('https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-job-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.name,
          clientEmail: client.email || null,
          clientPhone: client.phone || null,
          jobTitle: job.title,
          jobDate: job.date,
          jobTime: job.time || null,
        }),
      })
      setNotifiedJob(job.id)
      setTimeout(() => setNotifiedJob(null), 4000)
    } catch {
      setErrorMessage('Failed to send notification.')
      setTimeout(() => setErrorMessage(''), 4000)
    }
    setNotifyingJob(null)
  }

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    await supabase.from('Jobs').delete().eq('id', id)
    fetchJobs()
  }

  const getNextInvoiceNumber = async () => {
    const { data } = await supabase.from('Invoices').select('invoice_number')
      .eq('user_id', user?.id).order('invoice_number', { ascending: false }).limit(1)
    return (data?.[0]?.invoice_number || 0) + 1
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('Jobs').update({ status: newStatus }).eq('id', id)
    fetchJobs()

    if (newStatus === '🟢 Completed') {
      const job = jobs.find(j => j.id === id)
      if (!job?.client_id) return

      const [{ data: clientData }, { data: invoicesData }] = await Promise.all([
        supabase.from('Clients').select('name, phone, email').eq('id', job.client_id).single(),
        supabase.from('Invoices')
          .select('share_token, amount, invoice_number')
          .eq('client_id', job.client_id)
          .eq('user_id', user?.id)
          .in('status', ['🟡 Unpaid', '🔴 Overdue'])
          .order('created_at', { ascending: false })
          .limit(1),
      ])

      let invoice = invoicesData?.[0]

      // Auto-create invoice if none exists for this client
      if (!invoice) {
        const nextNum = await getNextInvoiceNumber()
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7)
        const { data: newInv } = await supabase.from('Invoices').insert([{
          client_name: clientData?.name || '',
          client_id: job.client_id,
          client_email: clientData?.email || null,
          client_phone: clientData?.phone || null,
          amount: 0,
          status: '🟡 Unpaid',
          due_date: dueDate.toISOString().split('T')[0],
          description: job.title,
          invoice_number: nextNum,
          user_id: user?.id,
        }] as any).select().single()
        invoice = newInv
        setSuccessMessage(`Job complete! Invoice #${String(nextNum).padStart(3, '0')} created — set the amount in Invoices.`)
        setTimeout(() => setSuccessMessage(''), 6000)
      }

      if (clientData?.phone && invoice?.share_token) {
        const invoiceUrl = `${window.location.origin}/invoice/${invoice.share_token}`
        const message = `Hi ${clientData.name}! Your lawn service is complete ✅ Your invoice for $${Number(invoice.amount).toFixed(2)} is ready: ${invoiceUrl}`
        fetch('https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: clientData.phone, message }),
        })
        if (!invoicesData?.[0]) {
          // message already set above
        } else {
          setSuccessMessage(`Job complete! Invoice text sent to ${clientData.name}.`)
          setTimeout(() => setSuccessMessage(''), 5000)
        }
      }

      // Send Google review request if business has set a review link
      const { data: profileData } = await supabase
        .from('profiles')
        .select('google_review_link')
        .eq('id', user?.id)
        .single()

      if (clientData?.phone && (profileData as any)?.google_review_link) {
        fetch('https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientData.phone,
            message: `Hi ${clientData.name}! Thanks for choosing us today 🌿 We'd love a quick Google review if you have a moment: ${(profileData as any).google_review_link}`,
          }),
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

    let matchesPeriod = true
    if (filterPeriod !== 'All') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const jobDate = new Date(j.date + 'T00:00:00')
      if (filterPeriod === 'Today') {
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
        matchesPeriod = jobDate >= today && jobDate < tomorrow
      } else if (filterPeriod === 'This Week') {
        const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
        matchesPeriod = jobDate >= weekStart && jobDate < weekEnd
      } else if (filterPeriod === 'This Month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        matchesPeriod = jobDate >= monthStart && jobDate < monthEnd
      }
    }

    return matchesSearch && matchesStatus && matchesPeriod
  })

  const groupedJobs = filteredJobs.reduce<Record<string, typeof filteredJobs>>((acc, job) => {
    const key = job.date || 'No Date'
    if (!acc[key]) acc[key] = []
    acc[key].push(job)
    return acc
  }, {})
  const sortedDates = Object.keys(groupedJobs).sort()

  if (checking) return (
    <div className="pb-6 bg-gray-50 min-h-dvh">
      <div className="flex justify-between items-center mb-6">
        <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse" />)}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-2xl mb-3 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="pb-6 bg-gray-50 min-h-dvh">
      <div className="flex justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-md" aria-hidden="true"><Leaf className="w-6 h-6" /></div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Jobs</h2>
            <p className="text-gray-500 text-sm">Schedule and track your work</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end shrink-0">
          {(() => {
            const today = new Date().toISOString().split('T')[0]
            const todayJobs = jobs.filter(j => j.date === today && j.status !== '🔴 Cancelled')
            const addresses = [...new Set(todayJobs.map(j => clients.find(c => c.id === j.client_id)?.address).filter((a): a is string => !!a && a.trim().length > 0))]
            if (addresses.length < 2) return null
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(addresses[0])}&destination=${encodeURIComponent(addresses[addresses.length - 1])}${addresses.length > 2 ? `&waypoints=${addresses.slice(1, -1).map(a => encodeURIComponent(a)).join('|')}` : ''}`
            return (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 px-3 rounded-xl hover:opacity-90 hover:shadow-md transition-all duration-200 shadow text-sm whitespace-nowrap"
              >
                <Map className="w-4 h-4 inline mr-1" aria-hidden="true" />Today's Route
              </a>
            )
          })()}
          <button
            onClick={() => { setShowForm(!showForm); setEditingJob(null) }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-xl hover:opacity-90 hover:shadow-md transition-all duration-200 cursor-pointer shadow whitespace-nowrap text-sm"
          >
            + Schedule Job
          </button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['Today', 'This Week', 'This Month', 'All'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPeriod(p)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              filterPeriod === p
                ? 'bg-blue-500 text-white shadow'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-500'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Search by title, client, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 text-gray-800 flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 text-gray-800 w-full sm:w-auto"
        >
          <option value="All">All</option>
          <option value="🔵 Scheduled">Scheduled</option>
          <option value="🟡 In Progress">In Progress</option>
          <option value="🟢 Completed">Completed</option>
          <option value="🔴 Cancelled">Cancelled</option>
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
            <div className="bg-green-100 text-green-700 text-2xl w-12 h-12 rounded-xl flex items-center justify-center"><MessageSquare className="w-5 h-5" aria-hidden="true" /></div>
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
              className="flex-1 block bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors text-center"
            >
              Open SMS App
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
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-blue-500" aria-hidden="true" />New Job</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              >
                <option value="">Select Job Type *</option>
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>{stripEmoji(type)}</option>
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
              <option value="">Select a Client *</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 px-1 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 px-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />Time (optional)</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            </div>
            <select value={recurring} onChange={(e) => setRecurring(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option value="🔂 One-time">One-time</option>
              <option value="📅 Weekly">Weekly</option>
              <option value="🗓️ Biweekly">Biweekly</option>
              <option value="📆 Monthly">Monthly</option>
              <option value="✏️ Custom">Custom</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option value="🔵 Scheduled">Scheduled</option>
              <option value="🟡 In Progress">In Progress</option>
              <option value="🟢 Completed">Completed</option>
              <option value="🔴 Cancelled">Cancelled</option>
            </select>
            {workers.length > 0 && (
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
                <option value="">Assign to Worker (optional)</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name || 'Unnamed Worker'}</option>
                ))}
              </select>
            )}
            {recurring === '✏️ Custom' && (
              <input
                placeholder="Describe your schedule (e.g. Every 10 days)"
                value={customRecurring}
                onChange={(e) => setCustomRecurring(e.target.value)}
                className="border border-green-400 rounded-lg p-3 text-gray-800 sm:col-span-2"
              />
            )}
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          {recurring !== '🔂 One-time' && recurring !== '✏️ Custom' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-bold text-sm flex items-center gap-1.5"><RefreshCw className="w-4 h-4" aria-hidden="true" />This will automatically schedule jobs for the next 3 months!</p>
            </div>
          )}
          {recurring === '✏️ Custom' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 font-bold text-sm flex items-center gap-1.5"><FileText className="w-4 h-4" aria-hidden="true" />Custom schedule will be saved as a note on the job.</p>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddJob} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 transition-opacity duration-200 cursor-pointer shadow">
              {saving ? 'Saving...' : 'Save Job'}
            </button>
            <button onClick={() => setShowForm(false)} className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingJob && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Pencil className="w-5 h-5 text-blue-500" aria-hidden="true" />Edit Job</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <select value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
                <option value="">Select Job Type *</option>
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>{stripEmoji(type)}</option>
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
              <option value="">Select a Client *</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 px-1 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />Date *</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 px-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />Time (optional)</label>
              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
            </div>
            <select value={editRecurring} onChange={(e) => setEditRecurring(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option value="🔂 One-time">One-time</option>
              <option value="📅 Weekly">Weekly</option>
              <option value="🗓️ Biweekly">Biweekly</option>
              <option value="📆 Monthly">Monthly</option>
              <option value="✏️ Custom">Custom</option>
            </select>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
              <option value="🔵 Scheduled">Scheduled</option>
              <option value="🟡 In Progress">In Progress</option>
              <option value="🟢 Completed">Completed</option>
              <option value="🔴 Cancelled">Cancelled</option>
            </select>
            {workers.length > 0 && (
              <select value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800">
                <option value="">Assign to Worker (optional)</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name || 'Unnamed Worker'}</option>
                ))}
              </select>
            )}
            {editRecurring === '✏️ Custom' && (
              <input
                placeholder="Describe your schedule (e.g. Every 10 days)"
                value={editCustomRecurring}
                onChange={(e) => setEditCustomRecurring(e.target.value)}
                className="border border-green-400 rounded-lg p-3 text-gray-800 sm:col-span-2"
              />
            )}
            <textarea
              placeholder="Notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          
          {/* Photo Upload Section */}
          {editingJob && (
            <div className="mt-6 border-t border-blue-200 pt-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Camera className="w-4 h-4" aria-hidden="true" />Job Photos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JobPhotoUpload
                  jobId={editingJob.id}
                  userId={user?.id}
                  photoType="before"
                  onSuccess={() => { setPhotosUploadedFor(editingJob.id); fetchAllPhotos([editingJob.id]) }}
                />
                <JobPhotoUpload
                  jobId={editingJob.id}
                  userId={user?.id}
                  photoType="after"
                  onSuccess={() => { setPhotosUploadedFor(editingJob.id); fetchAllPhotos([editingJob.id]) }}
                />
              </div>
              <div className="mt-4">
                <JobPhotoGallery
                  jobId={editingJob.id}
                  onPhotoDeleted={() => { setPhotosUploadedFor(editingJob.id); fetchAllPhotos([editingJob.id]) }}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <button onClick={handleUpdateJob} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setEditingJob(null)} className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-16 h-16 mx-auto text-gray-300 mb-4" aria-hidden="true" />
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
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-gray-500 text-lg font-bold">No jobs match your search</p>
            <p className="text-gray-400">Try a different period, status, or search term.</p>
          </div>
        ) : (
          sortedDates.map((dateKey) => {
            const label = (() => {
              const today = new Date(); today.setHours(0,0,0,0)
              const d = new Date(dateKey + 'T00:00:00')
              const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
              if (diff === 0) return 'Today'
              if (diff === 1) return 'Tomorrow'
              if (diff === -1) return 'Yesterday'
              return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            })()
            return (
              <div key={dateKey} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{label}</h3>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-semibold">{groupedJobs[dateKey].length} job{groupedJobs[dateKey].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedJobs[dateKey].map((job) => (
            <div key={job.id} className={`bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-t-4 ${
              job.status === '🟢 Completed' ? 'border-green-500' :
              job.status === '🟡 In Progress' ? 'border-yellow-500' :
              job.status === '🔴 Cancelled' ? 'border-red-500' :
              'border-blue-500'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-gray-800">{job.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleEditJob(job)} aria-label="Edit job" className="text-blue-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                  <button onClick={() => handleDeleteJob(job.id)} aria-label="Delete job" className="text-red-400 hover:text-red-600 transition-colors duration-200 cursor-pointer"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-gray-500 text-sm flex items-center gap-1"><User className="w-3.5 h-3.5" aria-hidden="true" /> {job.client_name}</p>
                {job.assigned_to && workers.find(w => w.id === job.assigned_to) && (
                  <p className="text-xs"><span className="bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">{workers.find(w => w.id === job.assigned_to)?.name || 'Worker'}</span></p>
                )}
                {job.date && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide w-12 shrink-0">Date:</span>
                    <span className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><CalendarDays className="w-3 h-3" aria-hidden="true" />{job.date}</span>
                  </div>
                )}
                {job.time && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide w-12 shrink-0">Time:</span>
                    <span className="bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{job.time}</span>
                  </div>
                )}
                {job.recurring && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide w-12 shrink-0">Sched:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${job.recurring === '🔂 One-time' ? 'bg-gray-100 text-gray-500' : 'bg-cyan-50 text-cyan-600'}`}>
                      {job.recurring === '🔂 One-time' ? <Minus className="w-3 h-3" aria-hidden="true" /> : <RefreshCw className="w-3 h-3" aria-hidden="true" />}
                      {stripEmoji(job.recurring)}
                    </span>
                  </div>
                )}
                {job.notes && <p className="text-gray-400 text-xs mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-1.5"><FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />{job.notes}</p>}
                {job.worker_notes && <p className="text-gray-500 text-xs mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"><span className="font-semibold">Worker:</span> {job.worker_notes}</p>}
                {job.clocked_in_at && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Time on job:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${job.clocked_out_at ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      <Clock className="w-3 h-3" aria-hidden="true" /> {job.clocked_out_at ? fmtDuration(job.clocked_in_at, job.clocked_out_at) : 'In progress'}
                    </span>
                    <span className="text-xs text-gray-400">{fmtClock(job.clocked_in_at)}{job.clocked_out_at ? ` – ${fmtClock(job.clocked_out_at)}` : ''}</span>
                  </div>
                )}
              </div>
              {cardPhotos[job.id]?.length > 0 && (
                <div className="flex gap-1.5 mb-3">
                  {cardPhotos[job.id].map((photo) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt={photo.photo_type}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      />
                      <span className="absolute -top-1 -right-1 text-xs leading-none">
                        {photo.photo_type === 'before' ? <Camera className="w-3 h-3" aria-hidden="true" /> : <Camera className="w-3 h-3" aria-hidden="true" />}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <select
                value={job.status}
                onChange={(e) => handleStatusChange(job.id, e.target.value)}
                className={`text-xs font-bold py-1.5 px-3 rounded-full border-0 cursor-pointer w-full ${
                  job.status === '🟢 Completed' ? 'bg-green-100 text-green-700' :
                  job.status === '🟡 In Progress' ? 'bg-yellow-100 text-yellow-700' :
                  job.status === '🔴 Cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}
              >
                <option value="🔵 Scheduled">Scheduled</option>
                <option value="🟡 In Progress">In Progress</option>
                <option value="🟢 Completed">Completed</option>
                <option value="🔴 Cancelled">Cancelled</option>
              </select>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(job.status === '🔵 Scheduled' || job.status === '🟡 In Progress') && (clients.find(c => c.id === job.client_id)?.phone || clients.find(c => c.id === job.client_id)?.email) && (
                  <button
                    onClick={() => handleNotifyClient(job)}
                    disabled={notifyingJob === job.id}
                    className="text-xs font-bold py-1.5 px-3 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {notifyingJob === job.id ? 'Notifying...' : notifiedJob === job.id ? 'Sent!' : <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />} Notify
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingJob(job)
                    setEditTitle(job.title.includes('Custom') ? '✏️ Custom' : job.title)
                    setEditCustomTitle(job.title.includes('Custom') ? job.title : '')
                    setEditClientId(job.client_id)
                    setEditDate(job.date)
                    setEditTime(job.time)
                    setEditStatus(job.status)
                    setEditNotes(job.notes)
                    setEditRecurring(job.recurring || '🔂 One-time')
                    setShowPhotos(job.id)
                  }}
                  className="text-xs font-bold py-1.5 px-3 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 mr-1" aria-hidden="true" />Photos
                </button>
                {clients.find(c => c.id === job.client_id)?.phone && (
                  <a
                    href={`tel:${clients.find(c => c.id === job.client_id)!.phone}`}
                    className="text-xs font-bold py-1.5 px-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" /> Call
                  </a>
                )}
                {clients.find(c => c.id === job.client_id)?.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(clients.find(c => c.id === job.client_id)!.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold py-1.5 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Map
                  </a>
                )}
              </div>
            </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
