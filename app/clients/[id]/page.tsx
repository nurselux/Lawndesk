'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/useAuth'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  notes: string
}

interface Job {
  id: string
  title: string
  date: string
  time: string
  status: string
  recurring: string
}

interface Invoice {
  id: string
  amount: number
  status: string
  due_date: string
  description: string
}

export default function ClientDetailPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  const fetchAll = async () => {
    const { data: clientData } = await supabase
      .from('Clients')
      .select('*')
      .eq('id', params.id as string)
      .eq('user_id', user!.id)
      .single()

    if (!clientData) {
      router.push('/clients')
      return
    }
    const typedClient = clientData as Client
    setClient(typedClient)

    const [{ data: jobData }, { data: invoiceData }] = await Promise.all([
      supabase.from('Jobs').select('id, title, date, time, status, recurring')
        .eq('user_id', user!.id)
        .eq('client_id', typedClient.id)
        .order('date', { ascending: false }),
      supabase.from('Invoices').select('id, amount, status, due_date, description')
        .eq('user_id', user!.id)
        .eq('client_id', typedClient.id)
        .order('created_at', { ascending: false }),
    ])

    if (jobData) setJobs(jobData as Job[])
    if (invoiceData) setInvoices(invoiceData as Invoice[])
    setDataLoading(false)
  }

  const handleEditOpen = (c: Client) => {
    setEditName(c.name)
    setEditEmail(c.email)
    setEditPhone(c.phone)
    setEditAddress(c.address)
    setEditNotes(c.notes)
    setEditing(true)
  }

  const handleUpdateClient = async () => {
    if (!editName) {
      setErrorMessage('Client name is required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const updateData = { name: editName, email: editEmail, phone: editPhone, address: editAddress, notes: editNotes }
    const { error } = await (supabase.from('Clients') as any).update(updateData).eq('id', client!.id)
    if (!error) {
      setEditing(false)
      setSuccessMessage('Client updated!')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchAll()
    } else {
      setErrorMessage(`Failed to update: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const totalRevenue = invoices.filter(i => i.status === '🟢 Paid').reduce((s, i) => s + i.amount, 0)
  const totalOwed = invoices.filter(i => i.status === '🟡 Unpaid' || i.status === '🔴 Overdue').reduce((s, i) => s + i.amount, 0)

  const jobStatusColor = (status: string) => {
    if (status === '🟢 Completed') return 'bg-green-100 text-green-700'
    if (status === '🟡 In Progress') return 'bg-yellow-100 text-yellow-700'
    if (status === '🔴 Cancelled') return 'bg-red-100 text-red-700'
    return 'bg-blue-100 text-blue-700'
  }

  const invoiceStatusColor = (status: string) => {
    if (status === '🟢 Paid') return 'bg-green-100 text-green-700'
    if (status === '🔴 Overdue') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  if (loading || dataLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  if (!client) return null

  return (
    <div className="p-6 pb-6 max-w-4xl mx-auto">
      <Link href="/clients" className="text-green-700 font-semibold hover:underline text-sm mb-6 inline-block">
        ← Back to Clients
      </Link>

      {successMessage && (
        <div className="bg-green-100 text-green-700 font-bold p-4 rounded-xl mb-4">✅ {successMessage}</div>
      )}
      {errorMessage && (
        <div className="bg-red-100 text-red-700 font-bold p-4 rounded-xl mb-4">❌ {errorMessage}</div>
      )}

      {/* Client Header / Edit Form */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        {editing ? (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Client</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <input placeholder="Full Name *" value={editName} onChange={(e) => setEditName(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
              <input placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
              <input placeholder="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
              <input placeholder="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800" />
              <textarea placeholder="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleUpdateClient} className="bg-green-700 text-white font-bold py-3 px-8 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{client.name}</h2>
                <div className="space-y-1">
                  {client.email && <p className="text-gray-500">📧 {client.email}</p>}
                  {client.phone && <p className="text-gray-500">📞 {client.phone}</p>}
                  {client.address && <p className="text-gray-500">📍 {client.address}</p>}
                  {client.notes && <p className="text-gray-400 text-sm mt-2">📝 {client.notes}</p>}
                </div>
              </div>
              <button
                onClick={() => handleEditOpen(client)}
                className="border-2 border-green-700 text-green-700 font-bold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer text-sm"
              >
                ✏️ Edit
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-700">{jobs.length}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Total Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-700 truncate">${totalRevenue.toFixed(0)}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Revenue</p>
              </div>
              <div className="text-center">
                <p className={`text-xl sm:text-2xl font-bold truncate ${totalOwed > 0 ? 'text-yellow-600' : 'text-green-700'}`}>${totalOwed.toFixed(0)}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Outstanding</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Jobs */}
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Jobs ({jobs.length})</h3>
            <Link href="/jobs" className="text-sm text-green-600 hover:underline">+ Schedule Job</Link>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-gray-400 text-sm">No jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.date}{job.time ? ` · ${job.time}` : ''}</p>
                  </div>
                  <span className={`text-xs font-bold py-1 px-2 rounded-full ${jobStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Invoices ({invoices.length})</h3>
            <Link href="/invoices" className="text-sm text-green-600 hover:underline">+ Create Invoice</Link>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📄</p>
              <p className="text-gray-400 text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-gray-800">${inv.amount.toFixed(2)}</p>
                    {inv.description && <p className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[160px]">{inv.description}</p>}
                    {inv.due_date && <p className="text-xs text-gray-400">Due {inv.due_date}</p>}
                  </div>
                  <span className={`text-xs font-bold py-1 px-2 rounded-full ${invoiceStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
