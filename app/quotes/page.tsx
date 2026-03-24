'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface Quote {
  id: string
  client_id: string | null
  client_name: string
  title: string
  description: string | null
  line_items: LineItem[]
  amount: number
  status: string
  share_token: string
  expires_at: string | null
  notes: string | null
  created_at: string
}

interface Client {
  id: string
  name: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '📝 Draft',
  sent: '📤 Sent',
  approved: '✅ Approved',
  declined: '❌ Declined',
  converted: '🔁 Converted',
}

const emptyItem = (): LineItem => ({ description: '', quantity: 1, unit_price: 0 })

export default function QuotesPage() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('All')

  // Form state
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyItem()])
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user) {
      fetchQuotes()
      fetchClients()
    }
  }, [user])

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('Quotes')
      .select('id, client_id, client_name, title, description, line_items, amount, status, share_token, expires_at, notes, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setQuotes(data as Quote[])
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name')
      .eq('user_id', user?.id)
      .order('name')
    if (data) setClients(data as Client[])
  }

  const calcTotal = (items: LineItem[]) =>
    items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  const handleClientChange = (id: string) => {
    setClientId(id)
    const c = clients.find((c) => c.id === id)
    if (c) setClientName(c.name)
  }

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const addItem = () => setLineItems((prev) => [...prev, emptyItem()])
  const removeItem = (idx: number) => setLineItems((prev) => prev.filter((_, i) => i !== idx))

  const handleCreate = async () => {
    if (!title.trim()) {
      setErrorMessage('Quote title is required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    if (!clientName.trim()) {
      setErrorMessage('Client name is required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const amount = calcTotal(lineItems)
    const { error } = await supabase.from('Quotes').insert([{
      user_id: user?.id,
      client_id: clientId || null,
      client_name: clientName.trim(),
      title: title.trim(),
      description: description.trim() || null,
      line_items: lineItems.filter((i) => i.description.trim()),
      amount,
      status: 'draft',
      expires_at: expiresAt || null,
      notes: notes.trim() || null,
    }])
    if (!error) {
      resetForm()
      setSuccessMessage('Quote created!')
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchQuotes()
    } else {
      setErrorMessage(`Error: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 4000)
    }
    setSaving(false)
  }

  const resetForm = () => {
    setShowForm(false)
    setClientId('')
    setClientName('')
    setTitle('')
    setDescription('')
    setLineItems([emptyItem()])
    setExpiresAt('')
    setNotes('')
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('Quotes').update({ status }).eq('id', id)
    fetchQuotes()
  }

  const deleteQuote = async (id: string) => {
    if (!confirm('Delete this quote?')) return
    await supabase.from('Quotes').delete().eq('id', id)
    fetchQuotes()
  }

  const convertToJob = async (quote: Quote) => {
    if (!confirm('Convert this quote to a job?')) return
    const { data: job, error } = await supabase
      .from('Jobs')
      .insert([{
        user_id: user?.id,
        client_id: quote.client_id,
        client_name: quote.client_name,
        title: quote.title,
        notes: quote.description || quote.notes || '',
        status: '🔵 Scheduled',
      }])
      .select('id')
      .single()
    if (!error && job) {
      await supabase.from('Quotes').update({ status: 'converted', job_id: job.id }).eq('id', quote.id)
      setSuccessMessage('Quote converted to job!')
      setTimeout(() => setSuccessMessage(''), 4000)
      fetchQuotes()
    }
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quote/${token}`)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const markSent = async (id: string, token: string) => {
    await supabase.from('Quotes').update({ status: 'sent' }).eq('id', id)
    copyLink(token)
    fetchQuotes()
  }

  const filtered = quotes.filter((q) =>
    filterStatus === 'All' || q.status === filterStatus.toLowerCase()
  )

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  const total = calcTotal(lineItems)

  return (
    <div className="p-6 pb-6 bg-gray-50 min-h-dvh">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">📋</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Quotes</h2>
            <p className="text-gray-500 text-sm">Send estimates and win more work</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm) }}
          className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold py-2 px-6 rounded-xl hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer shadow"
        >
          + New Quote
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', 'Draft', 'Sent', 'Approved', 'Declined', 'Converted'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {successMessage && (
        <div className="bg-green-100 text-green-700 font-bold p-4 rounded-lg mb-4">✅ {successMessage}</div>
      )}
      {errorMessage && (
        <div className="bg-red-100 text-red-700 font-bold p-4 rounded-lg mb-4">❌ {errorMessage}</div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">New Quote</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {clients.length > 0 ? (
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              >
                <option value="">Select client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Client Name *"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              />
            )}
            {clients.length > 0 && !clientId && (
              <input
                placeholder="Or type client name *"
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setClientId('') }}
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              />
            )}
            <input
              placeholder="Quote Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-semibold">Expires</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="mb-4">
            <h4 className="font-bold text-gray-700 mb-2">Line Items</h4>
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="col-span-6 border border-gray-300 rounded-lg p-2 text-gray-800 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    min={1}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="col-span-2 border border-gray-300 rounded-lg p-2 text-gray-800 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unit_price}
                    min={0}
                    step={0.01}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="col-span-3 border border-gray-300 rounded-lg p-2 text-gray-800 text-sm"
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={lineItems.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-30 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-2 text-sm text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              + Add line item
            </button>
            {total > 0 && (
              <p className="text-right text-lg font-bold text-gray-800 mt-3">
                Total: ${total.toFixed(2)}
              </p>
            )}
          </div>

          <textarea
            placeholder="Internal notes (not shown to client)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="border border-gray-300 rounded-lg p-3 text-gray-800 w-full mb-4 text-sm"
          />

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Quote'}
            </button>
            <button
              onClick={resetForm}
              className="border-2 border-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quotes list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-gray-700 font-bold mb-1">No quotes yet</p>
          <p className="text-gray-400 text-sm">Create your first quote to send to a client.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((quote) => (
            <div key={quote.id} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-bold py-1 px-2 rounded-full ${STATUS_COLORS[quote.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[quote.status] ?? quote.status}
                    </span>
                    {quote.expires_at && (
                      <span className="text-xs text-gray-400">Expires {new Date(quote.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg truncate">{quote.title}</h4>
                  <p className="text-gray-500 text-sm">{quote.client_name}</p>
                  {quote.description && <p className="text-gray-400 text-xs mt-1 truncate">{quote.description}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-blue-700">${quote.amount.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs">{new Date(quote.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Line items preview */}
              {quote.line_items?.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                  {quote.line_items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600">
                      <span>{item.description}</span>
                      <span className="font-semibold">{item.quantity} × ${item.unit_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {quote.status === 'draft' && (
                  <button
                    onClick={() => markSent(quote.id, quote.share_token)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    📤 Send (Copy Link)
                  </button>
                )}
                {quote.status === 'sent' && (
                  <button
                    onClick={() => copyLink(quote.share_token)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    {copiedId === quote.share_token ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                )}
                {quote.status === 'approved' && (
                  <button
                    onClick={() => convertToJob(quote)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                  >
                    🔁 Convert to Job
                  </button>
                )}
                {quote.status !== 'converted' && quote.status !== 'declined' && (
                  <>
                    {quote.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(quote.id, 'approved')}
                        className="text-xs font-bold py-2 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                      >
                        ✅ Mark Approved
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(quote.id, 'declined')}
                      className="text-xs font-bold py-2 px-3 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      ❌ Mark Declined
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteQuote(quote.id)}
                  className="text-xs font-bold py-2 px-3 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors cursor-pointer ml-auto"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
