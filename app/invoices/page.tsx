'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'

interface Invoice {
  id: string
  client_name: string
  client_id: string
  client_email: string | null
  client_phone: string | null
  amount: number
  status: string
  due_date: string
  description: string
  user_id: string
  invoice_number: number
  share_token: string
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
}

type SendState = { id: string; type: 'email' | 'sms' }

function InvoicesContent() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('filter') || 'All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<SendState | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [clientId, setClientId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [formStatus, setFormStatus] = useState('🟡 Unpaid')

  useEffect(() => {
    if (user) {
      markOverdueInvoices().then(fetchInvoices)
      fetchClients()
    }
  }, [user])

  const markOverdueInvoices = async () => {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('Invoices').update({ status: '🔴 Overdue' })
      .eq('user_id', user?.id).eq('status', '🟡 Unpaid')
      .lt('due_date', today).not('due_date', 'is', null)
  }

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('Invoices')
      .select('id, client_name, client_id, client_email, client_phone, amount, status, due_date, description, user_id, invoice_number, share_token')
      .eq('user_id', user?.id)
      .order('invoice_number', { ascending: false })
    if (data) setInvoices(data as Invoice[])
  }

  const fetchClients = async () => {
    const { data } = await supabase.from('Clients').select('id, name, email, phone')
      .eq('user_id', user?.id).order('name')
    if (data) setClients(data as Client[])
  }

  const getNextInvoiceNumber = async () => {
    const { data } = await supabase.from('Invoices').select('invoice_number')
      .eq('user_id', user?.id).order('invoice_number', { ascending: false }).limit(1)
    return (data?.[0]?.invoice_number || 0) + 1
  }

  const getInvoiceLink = (token: string) => `${window.location.origin}/invoice/${token}`

  const handleClientSelect = (id: string) => {
    setClientId(id)
  }

  const handleCreate = async () => {
    if (!clientId || !amount) {
      setErrorMessage('Client and amount are required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const client = clients.find(c => c.id === clientId)
    const nextNum = await getNextInvoiceNumber()
    const { data: inv, error } = await supabase.from('Invoices').insert([{
      client_name: client?.name || '',
      client_id: clientId,
      client_email: client?.email || null,
      client_phone: client?.phone || null,
      amount: parseFloat(amount),
      status: formStatus,
      due_date: dueDate || null,
      description,
      invoice_number: nextNum,
      user_id: user?.id,
    }] as any).select().single()

    if (!error && inv) {
      resetForm()
      await fetchInvoices()
      setSuccessMessage(`Invoice #${String(nextNum).padStart(3, '0')} created!`)
      setTimeout(() => setSuccessMessage(''), 4000)
      // Offer to send immediately if client has email
      if (client?.email) {
        const link = getInvoiceLink((inv as any).share_token)
        handleSendEmail(inv as any, client.email, link)
      }
    } else if (error) {
      setErrorMessage(`Error: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 4000)
    }
    setSaving(false)
  }

  const handleUpdate = async () => {
    if (!editingInvoice) return
    if (!clientId || !amount) {
      setErrorMessage('Client and amount are required')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const client = clients.find(c => c.id === clientId)
    const { error } = await (supabase.from('Invoices') as any).update({
      client_name: client?.name || '',
      client_id: clientId,
      client_email: client?.email || null,
      client_phone: client?.phone || null,
      amount: parseFloat(amount),
      status: formStatus,
      due_date: dueDate || null,
      description,
    }).eq('id', editingInvoice.id)

    if (!error) {
      setEditingInvoice(null)
      resetForm()
      fetchInvoices()
      setSuccessMessage('Invoice updated!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } else {
      setErrorMessage(`Error: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
    setSaving(false)
  }

  const resetForm = () => {
    setClientId('')
    setAmount('')
    setDueDate('')
    setDescription('')
    setFormStatus('🟡 Unpaid')
    setShowForm(false)
    setEditingInvoice(null)
  }

  const openEdit = (inv: Invoice) => {
    setEditingInvoice(inv)
    setClientId(inv.client_id || '')
    setAmount(inv.amount.toString())
    setDueDate(inv.due_date || '')
    setDescription(inv.description || '')
    setFormStatus(inv.status)
    setShowForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const markPaid = async (id: string) => {
    await supabase.from('Invoices').update({ status: '🟢 Paid' }).eq('id', id)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: '🟢 Paid' } : inv))
    setSuccessMessage('Marked as paid!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return
    await supabase.from('Invoices').delete().eq('id', id)
    fetchInvoices()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('Invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv))
  }

  const copyLink = (inv: Invoice) => {
    navigator.clipboard.writeText(getInvoiceLink(inv.share_token))
    setCopiedId(inv.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSendEmail = async (inv: Invoice, emailOverride?: string, linkOverride?: string) => {
    const email = emailOverride || inv.client_email
    if (!email) {
      setErrorMessage('No email on file for this client. Edit the invoice or update the client.')
      setTimeout(() => setErrorMessage(''), 5000)
      return
    }
    setSending({ id: inv.id, type: 'email' })
    const link = linkOverride || getInvoiceLink(inv.share_token)
    try {
      const res = await fetch(
        'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-invoice-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: email,
            recipientName: inv.client_name,
            invoiceNumber: inv.invoice_number,
            amount: inv.amount,
            description: inv.description,
            dueDate: inv.due_date,
            invoiceLink: link,
            portalLink: `${window.location.origin}/portal`,
          }),
        }
      )
      if (res.ok) {
        setSuccessMessage(`📧 Invoice emailed to ${email}!`)
      } else {
        setErrorMessage('Email failed — use Copy Link to share manually.')
      }
    } catch {
      setErrorMessage('Email failed — use Copy Link to share manually.')
    }
    setTimeout(() => setSuccessMessage(''), 5000)
    setTimeout(() => setErrorMessage(''), 5000)
    setSending(null)
  }

  const handleSendSMS = async (inv: Invoice) => {
    const phone = inv.client_phone
    if (!phone) {
      setErrorMessage('No phone on file for this client.')
      setTimeout(() => setErrorMessage(''), 4000)
      return
    }
    setSending({ id: inv.id, type: 'sms' })
    const link = getInvoiceLink(inv.share_token)
    const msg = `Hi ${inv.client_name}, your invoice for $${inv.amount.toFixed(2)} is ready. View and pay here: ${link}`
    try {
      const res = await fetch(
        'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-sms',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: phone, message: msg }),
        }
      )
      if (res.ok) {
        setSuccessMessage(`💬 Invoice texted to ${phone}!`)
      } else {
        setErrorMessage('Text failed — use Copy Link to share manually.')
      }
    } catch {
      setErrorMessage('Text failed — use Copy Link to share manually.')
    }
    setTimeout(() => setSuccessMessage(''), 5000)
    setTimeout(() => setErrorMessage(''), 5000)
    setSending(null)
  }

  const totalRevenue = invoices.filter(i => i.status === '🟢 Paid').reduce((s, i) => s + i.amount, 0)
  const totalOutstanding = invoices.filter(i => i.status !== '🟢 Paid').reduce((s, i) => s + i.amount, 0)

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = !q || inv.client_name.toLowerCase().includes(q) || inv.description?.toLowerCase().includes(q)
    const matchStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Unpaid' && inv.status === '🟡 Unpaid') ||
      (filterStatus === 'Overdue' && inv.status === '🔴 Overdue') ||
      (filterStatus === 'Paid' && inv.status === '🟢 Paid')
    return matchSearch && matchStatus
  })

  const isEditing = !!editingInvoice
  const showAnyForm = showForm || isEditing

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-4 pb-8 bg-gray-50 min-h-dvh max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">📄</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">Invoices</h2>
            <p className="text-gray-500 text-sm">
              {invoices.length > 0
                ? `${invoices.filter(i => i.status !== '🟢 Paid').length} outstanding`
                : 'Track payments'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold py-2.5 px-5 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow text-sm"
        >
          + New
        </button>
      </div>

      {/* Stats */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white text-center shadow">
            <p className="text-green-100 text-xs font-semibold mb-0.5">Collected</p>
            <p className="text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white text-center shadow">
            <p className="text-amber-100 text-xs font-semibold mb-0.5">Outstanding</p>
            <p className="text-2xl font-bold">${totalOutstanding.toFixed(0)}</p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['All', 'Unpaid', 'Overdue', 'Paid'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === s
                ? s === 'Overdue' ? 'bg-red-600 text-white'
                  : s === 'Paid' ? 'bg-green-600 text-white'
                  : s === 'Unpaid' ? 'bg-amber-500 text-white'
                  : 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-400'
            }`}
          >
            {s === 'All' ? `All (${invoices.length})` :
             s === 'Unpaid' ? `Unpaid (${invoices.filter(i => i.status === '🟡 Unpaid').length})` :
             s === 'Overdue' ? `Overdue (${invoices.filter(i => i.status === '🔴 Overdue').length})` :
             `Paid (${invoices.filter(i => i.status === '🟢 Paid').length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        placeholder="🔍 Search client or description…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 mb-4 bg-white text-sm"
      />

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-100 text-green-700 font-bold p-3 rounded-xl mb-4 text-sm">✅ {successMessage}</div>
      )}
      {errorMessage && (
        <div className="bg-red-100 text-red-700 font-bold p-3 rounded-xl mb-4 text-sm">❌ {errorMessage}</div>
      )}

      {/* Create / Edit Form */}
      {showAnyForm && (
        <div className="bg-white border border-purple-200 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 text-base">
            {isEditing ? `✏️ Edit INV-${String(editingInvoice!.invoice_number).padStart(3, '0')}` : '📄 New Invoice'}
          </h3>
          <div className="space-y-3">
            <select
              value={clientId}
              onChange={e => handleClientSelect(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 bg-white"
            >
              <option value="">Select client *</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.email ? ` · ${c.email}` : ''}
                </option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-gray-500 font-bold">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 pl-8 text-gray-800"
                inputMode="decimal"
              />
            </div>
            <textarea
              placeholder="Description (e.g. Lawn mowing — front + back)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 text-sm resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-semibold block mb-1">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold block mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 bg-white"
                >
                  <option>🟡 Unpaid</option>
                  <option>🟢 Paid</option>
                  <option>🔴 Overdue</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={isEditing ? handleUpdate : handleCreate}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow disabled:opacity-50"
            >
              {saving ? '⏳ Saving…' : isEditing ? 'Save Changes' : 'Create Invoice'}
            </button>
            <button
              onClick={resetForm}
              className="border-2 border-gray-200 text-gray-600 font-bold py-3 px-5 rounded-xl cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          {!isEditing && clients.find(c => c.id === clientId)?.email && (
            <p className="text-xs text-green-600 mt-2 font-semibold">
              ✉️ Invoice will be emailed to {clients.find(c => c.id === clientId)?.email} automatically.
            </p>
          )}
        </div>
      )}

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">📄</p>
          <p className="text-gray-700 font-bold mb-1">No invoices yet</p>
          <p className="text-gray-400 text-sm mb-6">Create your first invoice to start getting paid.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold py-3 px-8 rounded-xl cursor-pointer shadow"
          >
            + Create Invoice
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 font-bold">No invoices match</p>
          <p className="text-gray-400 text-sm">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => {
            const isPaid = inv.status === '🟢 Paid'
            const isOverdue = inv.status === '🔴 Overdue'
            const isSendingEmail = sending?.id === inv.id && sending.type === 'email'
            return (
              <div
                key={inv.id}
                className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden ${
                  isPaid ? 'border-green-500' : isOverdue ? 'border-red-500' : 'border-amber-500'
                }`}
              >
                {/* Main row */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-mono leading-none mb-0.5">
                        INV-{String(inv.invoice_number).padStart(3, '0')}
                      </p>
                      <p className="font-bold text-gray-800 text-base leading-tight">{inv.client_name}</p>
                      {inv.description && (
                        <p className="text-gray-400 text-xs truncate mt-0.5">{inv.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold leading-none ${
                        isPaid ? 'text-green-700' : isOverdue ? 'text-red-600' : 'text-amber-600'
                      }`}>${inv.amount.toFixed(2)}</p>
                      {inv.due_date && (
                        <p className="text-xs text-gray-400 mt-0.5">Due {inv.due_date}</p>
                      )}
                    </div>
                  </div>

                  {/* Status + quick mark paid */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={inv.status}
                      onChange={e => handleStatusChange(inv.id, e.target.value)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-full border-0 cursor-pointer ${
                        isPaid ? 'bg-green-100 text-green-700' :
                        isOverdue ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <option>🟡 Unpaid</option>
                      <option>🟢 Paid</option>
                      <option>🔴 Overdue</option>
                    </select>
                    {!isPaid && (
                      <button
                        onClick={() => markPaid(inv.id)}
                        className="text-xs font-bold py-1.5 px-3 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
                      >
                        ✓ Mark Paid
                      </button>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center gap-2 flex-wrap">
                  {/* Send email */}
                  <button
                    onClick={() => handleSendEmail(inv)}
                    disabled={isSendingEmail}
                    className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                      inv.client_email
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title={inv.client_email || 'No email on file'}
                  >
                    {isSendingEmail ? '⏳' : '📧'} {isSendingEmail ? 'Sending…' : 'Email'}
                  </button>

                  {/* Send SMS */}
                  <button
                    onClick={() => handleSendSMS(inv)}
                    className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                      inv.client_phone
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title={inv.client_phone || 'No phone on file'}
                  >
                    💬 Text
                  </button>

                  {/* Copy link */}
                  <button
                    onClick={() => copyLink(inv)}
                    className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                  >
                    {copiedId === inv.id ? '✓ Copied!' : '🔗 Copy Link'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(inv)}
                    className="ml-auto text-xs font-bold py-2 px-3 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    ✏️
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesContent />
    </Suspense>
  )
}
