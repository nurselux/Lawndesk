'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

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
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user) fetchClients()
  }, [user])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setClients(data as Client[])
  }

  const handleAddClient = async () => {
    if (!name) {
      setErrorMessage('Client name is required')
      setTimeout(() => setErrorMessage(''), 3000)
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-6 pb-6 bg-gray-50 min-h-dvh">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">👥</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Clients</h2>
            <p className="text-gray-500 text-sm">Manage your client roster</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingClient(null) }}
          className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-2 px-6 rounded-xl hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer shadow"
        >
          + Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="🔍 Search by name, email, phone, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 text-gray-800 flex-1"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 text-gray-800 w-full sm:w-auto"
        >
          <option>All</option>
          <option>Has Email</option>
          <option>Has Phone</option>
          <option>Has Address</option>
        </select>
      </div>

      {successMessage && (
        <div className="bg-green-100 text-green-700 font-bold p-4 rounded-lg mb-4">
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 text-red-700 font-bold p-4 rounded-lg mb-4">
          ❌ {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">New Client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddClient}
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow"
            >
              {saving ? 'Saving...' : 'Save Client'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingClient && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="Full Name *"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <input
              placeholder="Email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <input
              placeholder="Phone"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <input
              placeholder="Address"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <textarea
              placeholder="Notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleUpdateClient}
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditingClient(null)}
              className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-gray-500 text-lg font-bold">No clients yet</p>
            <p className="text-gray-400">Click Add Client to get started!</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg font-bold">No clients match your search</p>
            <p className="text-gray-400">Try a different name or filter.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-amber-50 rounded-2xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg w-11 h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <Link href={`/clients/${client.id}`} className="text-lg font-bold text-gray-800 hover:text-green-700 transition-colors">{client.name}</Link>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClient(client)} className="text-blue-400 hover:text-blue-600 hover:scale-110 transition-all duration-200 cursor-pointer text-lg">✏️</button>
                  <button onClick={() => handleDeleteClient(client.id)} className="text-red-400 hover:text-red-600 hover:scale-110 transition-all duration-200 cursor-pointer text-lg">🗑️</button>
                </div>
              </div>
              <div className="space-y-1 pl-14 min-w-0">
                {client.email && <p className="text-gray-500 text-sm flex items-center gap-1.5 min-w-0"><span className="text-base shrink-0">📧</span> <span className="truncate">{client.email}</span></p>}
                {client.phone && <p className="text-gray-500 text-sm flex items-center gap-1.5"><span className="text-base">📞</span> {client.phone}</p>}
                {client.address && <p className="text-gray-500 text-sm flex items-center gap-1.5 min-w-0"><span className="text-base shrink-0">📍</span> <span className="truncate">{client.address}</span></p>}
                {client.notes && <p className="text-gray-400 text-xs mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">📝 {client.notes}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
