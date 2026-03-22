'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

interface Invoice {
  id: string
  client_name: string
  amount: number
  status: string
  due_date: string
  description: string
  user_id: string
}

interface Client {
  id: string
  name: string
}

export default function InvoicesPage() {
  const { user, loading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [clientName, setClientName] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('🟡 Unpaid')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [editClientName, setEditClientName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editStatus, setEditStatus] = useState('🟡 Unpaid')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user) {
      fetchInvoices()
      fetchClients()
    }
  }, [user])

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('Invoices')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: true })
    if (data) setInvoices(data as Invoice[])
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name')
      .eq('user_id', user?.id)
      .order('name', { ascending: true })
    if (data) setClients(data as Client[])
  }

  const handleAddInvoice = async () => {
    if (!clientName || !amount) {
      setErrorMessage('Client and amount are required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('Invoices')
      .insert([{ client_name: clientName, amount: parseFloat(amount), status, due_date: dueDate || null, description, user_id: user?.id }] as any)
    if (!error) {
      setClientName('')
      setAmount('')
      setStatus('🟡 Unpaid')
      setDueDate('')
      setDescription('')
      setShowForm(false)
      setSuccessMessage('🎉 Invoice created successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchInvoices()
    } else {
      setErrorMessage(`❌ Failed to save: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setEditClientName(invoice.client_name)
    setEditAmount(invoice.amount.toString())
    setEditStatus(invoice.status)
    setEditDueDate(invoice.due_date)
    setEditDescription(invoice.description)
    setShowForm(false)
  }

  const handleUpdateInvoice = async () => {
    if (!editClientName || !editAmount) {
      setErrorMessage('Client and amount are required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const { error } = await (supabase.from('Invoices') as any)
      .update({ client_name: editClientName, amount: parseFloat(editAmount), status: editStatus, due_date: editDueDate || null, description: editDescription })
      .eq('id', editingInvoice!.id)
    if (!error) {
      setEditingInvoice(null)
      setSuccessMessage('Invoice updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchInvoices()
    } else {
      setErrorMessage(`Failed to update: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    await supabase.from('Invoices').delete().eq('id', id)
    fetchInvoices()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('Invoices').update({ status: newStatus }).eq('id', id)
    fetchInvoices()
  }

  const totalRevenue = invoices
    .filter(inv => inv.status === '🟢 Paid')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const totalUnpaid = invoices
    .filter(inv => inv.status === '🟡 Unpaid')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      inv.client_name.toLowerCase().includes(q) ||
      inv.description?.toLowerCase().includes(q)
    const matchesStatus =
      filterStatus === 'All' ||
      inv.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-6 pb-24 md:pb-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">📄</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Invoices</h2>
            <p className="text-gray-500 text-sm">Track payments and outstanding balances</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingInvoice(null) }}
          className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold py-2 px-6 rounded-xl hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer shadow"
        >
          + Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white text-center">
          <div className="text-3xl mb-1">💰</div>
          <p className="text-green-100 mb-1 text-sm font-medium">Total Revenue</p>
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 shadow-lg text-white text-center">
          <div className="text-3xl mb-1">⏳</div>
          <p className="text-amber-100 mb-1 text-sm font-medium">Outstanding Balance</p>
          <p className="text-3xl font-bold">${totalUnpaid.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="🔍 Search by client, description..."
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
          <option>🟡 Unpaid</option>
          <option>🟢 Paid</option>
          <option>🔴 Overdue</option>
        </select>
      </div>

      {successMessage && (
        <div className="bg-green-100 text-green-700 font-bold p-4 rounded-lg mb-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 text-red-700 font-bold p-4 rounded-lg mb-4">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📄 New Invoice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            >
              <option value="">👤 Select a Client *</option>
              {clients.map((client) => (
                <option key={client.id} value={client.name}>
                  {client.name}
                </option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
              <input
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 pl-7 text-gray-800 w-full"
              />
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            >
              <option>🟡 Unpaid</option>
              <option>🟢 Paid</option>
              <option>🔴 Overdue</option>
            </select>
            <textarea
              placeholder="📝 Description (e.g. Lawn mowing - front and back yard)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddInvoice}
              className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow"
            >
              {saving ? '⏳ Saving...' : '💾 Save Invoice'}
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

      {editingInvoice && (
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">✏️ Edit Invoice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={editClientName}
              onChange={(e) => setEditClientName(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            >
              <option value="">👤 Select a Client *</option>
              {clients.map((client) => (
                <option key={client.id} value={client.name}>{client.name}</option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
              <input
                placeholder="0.00"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 pl-7 text-gray-800 w-full"
              />
            </div>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            >
              <option>🟡 Unpaid</option>
              <option>🟢 Paid</option>
              <option>🔴 Overdue</option>
            </select>
            <textarea
              placeholder="📝 Description (e.g. Lawn mowing - front and back yard)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800 sm:col-span-2"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleUpdateInvoice}
              className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow"
            >
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
            <button
              onClick={() => setEditingInvoice(null)}
              className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invoices.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-5xl mb-4">📄</p>
            <p className="text-gray-500 text-lg font-bold">No invoices yet</p>
            <p className="text-gray-400">Click Create Invoice to get started!</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg font-bold">No invoices match your search</p>
            <p className="text-gray-400">Try a different client or status.</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div key={invoice.id} className={`bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-l-4 ${
              invoice.status === '🟢 Paid' ? 'border-green-500' :
              invoice.status === '🔴 Overdue' ? 'border-red-500' :
              'border-yellow-500'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-0.5">{`INV-${String(invoices.indexOf(invoice) + 1).padStart(3, '0')}`}</p>
                  <h3 className="text-base font-bold text-gray-800">👤 {invoice.client_name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditInvoice(invoice)} className="text-blue-400 hover:text-blue-600 hover:scale-110 transition-all duration-200 cursor-pointer text-lg">✏️</button>
                  <button onClick={() => handleDeleteInvoice(invoice.id)} className="text-red-400 hover:text-red-600 hover:scale-110 transition-all duration-200 cursor-pointer text-lg">🗑️</button>
                </div>
              </div>
              <div className={`rounded-xl px-4 py-3 mb-3 ${
                invoice.status === '🟢 Paid' ? 'bg-green-50' :
                invoice.status === '🔴 Overdue' ? 'bg-red-50' :
                'bg-amber-50'
              }`}>
                <p className={`text-2xl font-bold ${
                  invoice.status === '🟢 Paid' ? 'text-green-700' :
                  invoice.status === '🔴 Overdue' ? 'text-red-600' :
                  'text-amber-600'
                }`}>💵 ${invoice.amount.toFixed(2)}</p>
                {invoice.due_date && <p className="text-gray-500 text-xs mt-1">📅 Due: {invoice.due_date}</p>}
              </div>
              {invoice.description && <p className="text-gray-400 text-xs mb-3 bg-gray-50 rounded-lg px-3 py-2">📝 {invoice.description}</p>}
              <select
                value={invoice.status}
                onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                className={`text-xs font-bold py-1.5 px-3 rounded-full border-0 cursor-pointer ${
                  invoice.status === '🟢 Paid' ? 'bg-green-100 text-green-700' :
                  invoice.status === '🔴 Overdue' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}
              >
                <option>🟡 Unpaid</option>
                <option>🟢 Paid</option>
                <option>🔴 Overdue</option>
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
