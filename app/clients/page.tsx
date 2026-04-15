'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import { Users, User, Search, Phone, Mail, MapPin, Pencil, Trash2, StickyNote } from 'lucide-react'
import AddressAutocomplete from '../../components/AddressAutocomplete'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  notes: string
  user_id: string
}

export default function ClientsPage() {
  const { user, loading } = useAuth()
  const { checking, profile } = useSubscriptionGate()
  const [clients, setClients] = useState<Client[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('name-asc')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [lastServicedMap, setLastServicedMap] = useState<Record<string, string>>({})
  const [lastServicedLoaded, setLastServicedLoaded] = useState(false)

  useEffect(() => {
    if (user) {
      fetchClients()
      fetchLastServiced()
    }
  }, [user])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name, email, phone, address, notes, user_id')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setClients(data as Client[])
  }

  const fetchLastServiced = async () => {
    const { data } = await supabase
      .from('Jobs')
      .select('client_id, date')
      .eq('user_id', user?.id)
      .eq('status', '🟢 Completed')
      .order('date', { ascending: false })
    if (data) {
      const map: Record<string, string> = {}
      for (const job of data) {
        if (job.client_id && !map[job.client_id]) {
          map[job.client_id] = job.date
        }
      }
      setLastServicedMap(map)
    }
    setLastServicedLoaded(true)
  }

  const handleAddClient = async () => {
    if (!name) {
      setErrorMessage('Client name is required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    if (profile?.subscription_plan === 'starter' && clients.length >= 10) {
      setErrorMessage('Starter plan is limited to 10 clients. Upgrade to Pro for unlimited clients.')
      setTimeout(() => setErrorMessage(''), 5000)
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('Clients')
      .insert([{ name, email, phone, address, notes, user_id: user?.id }] as any)
    if (!error) {
      setName('')
      setEmail('')
      setPhone('')
      setAddress('')
      setNotes('')
      setShowForm(false)
      setSuccessMessage('Client added successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchClients()
      fetchLastServiced()
    } else {
      setErrorMessage(`Failed to save: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setEditName(client.name)
    setEditEmail(client.email)
    setEditPhone(client.phone)
    setEditAddress(client.address)
    setEditNotes(client.notes)
    setShowForm(false)
  }

  const handleUpdateClient = async () => {
    if (!editName) {
      setErrorMessage('Client name is required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const { error } = await (supabase.from('Clients') as any)
      .update({ name: editName, email: editEmail, phone: editPhone, address: editAddress, notes: editNotes })
      .eq('id', editingClient!.id)
    if (!error) {
      setEditingClient(null)
      setSuccessMessage('Client updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchClients()
    } else {
      setErrorMessage(`Failed to update: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    await supabase.from('Clients').delete().eq('id', id)
    fetchClients()
  }

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Has Email' && !!c.email) ||
      (filter === 'Has Phone' && !!c.phone) ||
      (filter === 'Has Address' && !!c.address)
    return matchesSearch && matchesFilter
  })

  const DAY_MS = 86400000
  const nowMs = Date.now()

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
    if (sortBy === 'stale-first') {
      const aMs = lastServicedMap[a.id] ? new Date(lastServicedMap[a.id] + 'T00:00:00').getTime() : 0
      const bMs = lastServicedMap[b.id] ? new Date(lastServicedMap[b.id] + 'T00:00:00').getTime() : 0
      return aMs - bMs
    }
    return 0 // 'recent' = keep fetch order (newest added first)
  })

  if (checking) return (
    <div className="p-6 bg-slate-50 min-h-dvh">
      <div className="flex justify-between items-center mb-8">
        <div className="h-12 w-36 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-10 w-28 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-6 pb-6 bg-slate-50 min-h-dvh">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200" aria-hidden="true"><Users className="w-7 h-7" /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 leading-none">Clients</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your client roster</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingClient(null) }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transition-all duration-200 cursor-pointer shadow whitespace-nowrap"
        >
          + Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            placeholder="Search by name, email, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 pl-10 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 sm:flex-none border border-slate-200 rounded-xl p-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none min-h-[48px]"
          >
            <option>All</option>
            <option>Has Email</option>
            <option>Has Phone</option>
            <option>Has Address</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 sm:flex-none border border-slate-200 rounded-xl p-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none min-h-[48px]"
          >
            <option value="name-asc">A–Z</option>
            <option value="name-desc">Z–A</option>
            <option value="recent">Recently Added</option>
            <option value="stale-first">Needs Attention</option>
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-slate-800 font-semibold p-4 rounded-xl mb-4 flex items-center gap-3 shadow-sm">
          <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✓</span>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-slate-800 font-semibold p-4 rounded-xl mb-4 flex items-center gap-3 shadow-sm">
          <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">!</span>
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">New Client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                placeholder="Address"
                className="border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none w-full"
              />
            </div>
            <div className="relative sm:col-span-2">
              <StickyNote className="absolute left-3 top-3.5 w-4 h-4 text-emerald-600 pointer-events-none" aria-hidden="true" />
              <textarea
                placeholder="Property Notes — gate code, dog in yard, where to park, special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-emerald-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-emerald-50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleAddClient}
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-8 rounded-xl hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transition-all duration-200 cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Client'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={saving}
              className="border-2 border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingClient && (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Full Name *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <AddressAutocomplete
                value={editAddress}
                onChange={setEditAddress}
                placeholder="Address"
                className="border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none w-full"
              />
            </div>
            <div className="relative sm:col-span-2">
              <StickyNote className="absolute left-3 top-3.5 w-4 h-4 text-emerald-600 pointer-events-none" aria-hidden="true" />
              <textarea
                placeholder="Property Notes — gate code, dog in yard, where to park, special instructions..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full border border-emerald-200 rounded-xl py-3 pl-9 pr-3 text-slate-800 bg-emerald-50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleUpdateClient}
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-8 rounded-xl hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transition-all duration-200 cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditingClient(null)}
              disabled={saving}
              className="border-2 border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-green-400" aria-hidden="true" />
            </div>
            <p className="text-slate-900 text-lg font-bold mb-1">No clients yet</p>
            <p className="text-slate-500">Click Add Client to get started!</p>
          </div>
        ) : sortedClients.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" aria-hidden="true" />
            </div>
            <p className="text-slate-900 text-lg font-bold mb-1">No clients match your search</p>
            <p className="text-slate-500">Try a different name or filter.</p>
          </div>
        ) : (
          sortedClients.map((client) => {
            const lastServiced = lastServicedMap[client.id]
            const isStale = lastServiced
              ? (nowMs - new Date(lastServiced + 'T00:00:00').getTime()) > 21 * DAY_MS
              : false
            const lastServicedLabel = lastServiced
              ? new Date(lastServiced + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : null

            return (
              <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-600 hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <Link href={`/clients/${client.id}`} className="font-bold text-slate-900 hover:text-emerald-600 transition-colors leading-tight">{client.name}</Link>
                      {lastServicedLabel ? (
                        <p className={`text-xs mt-0.5 ${isStale ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                          Last Serviced: {lastServicedLabel}
                        </p>
                      ) : lastServicedLoaded ? (
                        <p className="text-xs mt-0.5 text-slate-400">Never serviced</p>
                      ) : null}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEditClient(client)} aria-label={`Edit ${client.name}`} className="text-slate-400 hover:text-blue-500 transition-colors duration-200 cursor-pointer hover:bg-blue-50 p-1.5 rounded-lg"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                      <button onClick={() => handleDeleteClient(client.id)} aria-label={`Delete ${client.name}`} className="text-slate-400 hover:text-red-500 transition-colors duration-200 cursor-pointer hover:bg-red-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-slate-600 text-sm"
                      >
                        <Phone className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        <span>{client.phone}</span>
                      </a>
                    )}
                    {client.address && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-slate-600 text-sm"
                      >
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
                        <span className="break-words">{client.address}</span>
                      </a>
                    )}
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        className="flex items-center gap-2 py-3 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-slate-600 text-sm min-w-0"
                      >
                        <Mail className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        <span className="truncate">{client.email}</span>
                      </a>
                    )}
                    {client.notes && (
                      <p className="text-emerald-900 text-xs mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 font-medium leading-relaxed break-words">{client.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
