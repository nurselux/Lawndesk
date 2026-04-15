'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import { ClipboardList, Mail, MessageSquare, Link2, Trash2, Receipt, RefreshCw, FileText, Send, CheckCircle2, XCircle, MapPin, CalendarDays, Clock, CreditCard, UserPlus, Phone } from 'lucide-react'
import { QuoteStatusBadge } from '../../lib/statusIcons'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface Quote {
  id: string
  client_id: string | null
  client_name: string
  client_email: string | null
  client_phone: string | null
  title: string
  description: string | null
  line_items: LineItem[]
  amount: number
  status: string
  share_token: string
  expires_at: string | null
  notes: string | null
  service_date: string | null
  service_time: string | null
  address: string | null
  require_payment: boolean
  deposit_amount: number | null
  created_at: string
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

const emptyItem = (): LineItem => ({ description: '', quantity: 1, unit_price: 0 })

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function QuotesPage() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [savedClientIds, setSavedClientIds] = useState<Set<string>>(new Set())

  // Booking request this quote was created from (for back-linking)
  const [fromReqId, setFromReqId] = useState('')

  // Form state
  const [useExistingClient, setUseExistingClient] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyItem()])
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [serviceTime, setServiceTime] = useState('')
  const [address, setAddress] = useState('')
  const [requirePayment, setRequirePayment] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')

  useEffect(() => {
    if (user) {
      fetchQuotes()
      fetchClients()
    }
  }, [user])

  // Pre-fill form when arriving from a service request via ?from_req_* params
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const name = p.get('from_req_name')
    if (!name) return
    setClientName(name)
    setClientPhone(p.get('from_req_phone') ?? '')
    setClientEmail(p.get('from_req_email') ?? '')
    setTitle(p.get('from_req_service') ?? '')
    setFromReqId(p.get('from_req_id') ?? '')
    setShowForm(true)
  }, [])

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('Quotes')
      .select('id, client_id, client_name, client_email, client_phone, title, description, line_items, amount, status, share_token, expires_at, notes, service_date, service_time, address, require_payment, deposit_amount, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setQuotes(data as Quote[])
  }

  const fetchClients = async () => {
    const { data } = await supabase
      .from('Clients')
      .select('id, name, email, phone, address')
      .eq('user_id', user?.id)
      .order('name')
    if (data) setClients(data as Client[])
  }

  const calcTotal = (items: LineItem[]) =>
    items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  const handleClientSelect = (id: string) => {
    setClientId(id)
    const c = clients.find(c => c.id === id)
    if (c) {
      setClientName(c.name)
      setClientEmail(c.email || '')
      setClientPhone(c.phone || '')
      setAddress(c.address || '')
    }
  }

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const addItem = () => setLineItems(prev => [...prev, emptyItem()])
  const removeItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx))

  const getQuoteLink = (token: string) => `${window.location.origin}/estimate/${token}`
  const getPortalLink = () => `${window.location.origin}/portal`

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
    const validItems = lineItems.filter(i => i.description.trim())
    const { data: quote, error } = await supabase.from('Quotes').insert([{
      user_id: user?.id,
      client_id: clientId || null,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      client_phone: clientPhone.trim() || null,
      title: title.trim(),
      description: description.trim() || null,
      line_items: validItems,
      amount,
      status: clientEmail.trim() ? 'sent' : 'draft',
      expires_at: expiresAt || null,
      notes: notes.trim() || null,
      service_date: serviceDate || null,
      service_time: serviceTime || null,
      address: address.trim() || null,
      require_payment: requirePayment,
      deposit_amount: requirePayment && depositAmount ? parseFloat(depositAmount) : null,
    }]).select().single()

    if (!error && quote) {
      // If this quote was created from a booking request, link it back
      if (fromReqId) {
        await (supabase as any)
          .from('booking_requests')
          .update({ quote_id: quote.id })
          .eq('id', fromReqId)
        setFromReqId('')
      }
      resetForm()
      fetchQuotes()
      if (clientEmail.trim()) {
        // Auto-send email
        await sendQuoteEmail(quote as Quote)
      } else {
        setSuccessMessage('Quote created!')
        setTimeout(() => setSuccessMessage(''), 4000)
      }
    } else if (error) {
      setErrorMessage(`Error: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 4000)
    }
    setSaving(false)
  }

  const sendQuoteEmail = async (quote: Quote) => {
    if (!quote.client_email) {
      setErrorMessage('No email address for this client.')
      setTimeout(() => setErrorMessage(''), 4000)
      return
    }
    setSending(quote.id)
    try {
      const res = await fetch(
        'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-quote-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: quote.client_email,
            recipientName: quote.client_name,
            quoteTitle: quote.title,
            amount: quote.amount,
            description: quote.description,
            lineItems: quote.line_items,
            expiresAt: quote.expires_at,
            quoteLink: getQuoteLink(quote.share_token),
            portalLink: getPortalLink(),
          }),
        }
      )
      if (res.ok) {
        if (quote.status === 'draft') {
          await supabase.from('Quotes').update({ status: 'sent' }).eq('id', quote.id)
          fetchQuotes()
        }
        setSuccessMessage(`Quote emailed to ${quote.client_email}!`)
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

  const sendQuoteSMS = async (quote: Quote) => {
    if (!quote.client_phone) {
      setErrorMessage('No phone number for this client.')
      setTimeout(() => setErrorMessage(''), 4000)
      return
    }
    setSending(quote.id)
    const link = getQuoteLink(quote.share_token)
    const msg = `Hi ${quote.client_name}, here's your quote for $${quote.amount.toFixed(2)} from LawnDesk. Review and approve it here: ${link}`
    try {
      const res = await fetch(
        'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-sms',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: quote.client_phone, message: msg }),
        }
      )
      if (res.ok) {
        setSuccessMessage(`Quote texted to ${quote.client_phone}!`)
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

  const saveAsClient = async (quote: Quote) => {
    // Check for existing client with same name
    const { data: existing } = await supabase
      .from('Clients')
      .select('id')
      .eq('user_id', user?.id)
      .ilike('name', quote.client_name)
      .maybeSingle()
    if (existing) {
      setSavedClientIds(prev => new Set([...prev, quote.id]))
      setSuccessMessage(`${quote.client_name} is already in your clients list.`)
      setTimeout(() => setSuccessMessage(''), 3000)
      return
    }
    const { error } = await supabase.from('Clients').insert([{
      user_id: user?.id,
      name: quote.client_name,
      email: quote.client_email || null,
      phone: quote.client_phone || null,
    }])
    if (!error) {
      setSavedClientIds(prev => new Set([...prev, quote.id]))
      setSuccessMessage(`${quote.client_name} added to your clients!`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } else {
      setErrorMessage(`Failed to save client: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 4000)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setUseExistingClient(false)
    setClientId('')
    setClientName('')
    setClientEmail('')
    setClientPhone('')
    setTitle('')
    setDescription('')
    setLineItems([emptyItem()])
    setExpiresAt('')
    setNotes('')
    setServiceDate('')
    setServiceTime('')
    setAddress('')
    setRequirePayment(false)
    setDepositAmount('')
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('Quotes').update({ status }).eq('id', id)
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q))
  }

  const deleteQuote = async (id: string) => {
    if (!confirm('Delete this quote?')) return
    await supabase.from('Quotes').delete().eq('id', id)
    fetchQuotes()
  }

  const convertToInvoice = async (quote: Quote) => {
    if (!confirm('Convert this quote to an invoice?')) return
    const { data: invoice, error } = await supabase
      .from('Invoices')
      .insert([{
        user_id: user?.id,
        client_id: quote.client_id || null,
        client_name: quote.client_name,
        client_email: quote.client_email || null,
        client_phone: quote.client_phone || null,
        amount: quote.amount,
        status: 'unpaid',
        description: quote.title + (quote.description ? ` — ${quote.description}` : ''),
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      }])
      .select('id')
      .single()
    if (!error && invoice) {
      await supabase.from('Quotes').update({ status: 'converted' }).eq('id', quote.id)
      setSuccessMessage('Quote converted to invoice!')
      setTimeout(() => setSuccessMessage(''), 4000)
      fetchQuotes()
    }
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
        status: 'scheduled',
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
    navigator.clipboard.writeText(getQuoteLink(token))
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = quotes.filter(q =>
    filterStatus === 'All' || q.status === filterStatus.toLowerCase()
  )

  if (checking) return (
    <div className="pb-8 bg-gray-50 min-h-dvh max-w-2xl mx-auto px-4 pt-4">
      <div className="flex justify-between items-center mb-6">
        <div className="h-10 w-36 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-2xl mb-4 animate-pulse" />
      ))}
    </div>
  )

  const total = calcTotal(lineItems)

  return (
    <div className="pb-8 bg-gray-50 min-h-dvh max-w-2xl mx-auto">

      {/* Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-violet-600" aria-hidden="true" />Estimates</h2>
            <p className="text-gray-400 text-sm mt-0.5">Send estimates, win more work</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="shrink-0 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow text-sm"
          >
            + New Estimate
          </button>
        </div>
      </div>

      {/* Filter tabs — scrollable with fade hint */}
      <div className="relative mb-4">
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {['All', 'Draft', 'Sent', 'Approved', 'Declined', 'Converted'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                filterStatus === s
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {/* Right fade to hint scrollability */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
      </div>

      <div className="px-4">

      {successMessage && <div className="bg-green-100 text-green-700 font-bold p-3 rounded-xl mb-4 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />{successMessage}</div>}
      {errorMessage && <div className="bg-red-100 text-red-700 font-bold p-3 rounded-xl mb-4 text-sm flex items-center gap-2"><XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />{errorMessage}</div>}

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-violet-200 rounded-2xl p-5 mb-5 shadow-sm space-y-5">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" aria-hidden="true" />New Estimate</h3>

          {/* Client section */}
          <div className="space-y-3">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button
                onClick={() => { setUseExistingClient(false); setClientId(''); setClientName(''); setClientEmail(''); setClientPhone('') }}
                className={`flex-1 text-sm font-semibold py-2.5 transition-all cursor-pointer ${
                  !useExistingClient ? 'bg-violet-600 text-white' : 'bg-white text-gray-500'
                }`}
              >
                New / Walk-in
              </button>
              <button
                onClick={() => setUseExistingClient(true)}
                className={`flex-1 text-sm font-semibold py-2.5 transition-all cursor-pointer ${
                  useExistingClient ? 'bg-violet-600 text-white' : 'bg-white text-gray-500'
                }`}
              >
                Existing Client
              </button>
            </div>

            {useExistingClient && (
              <select
                value={clientId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800 bg-white"
              >
                <option value="">Select client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ''}</option>
                ))}
              </select>
            )}

            <input
              placeholder="Client Name *"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800"
              readOnly={useExistingClient && !!clientId}
            />
            <input
              type="tel"
              placeholder="Phone (for SMS)"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800"
            />
            <input
              type="email"
              placeholder="Email (to send estimate)"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800"
            />
          </div>

          {/* Quote details */}
          <div className="space-y-3">
            <input
              placeholder="Estimate Title *  e.g. Spring Lawn Cleanup"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800 font-medium"
            />
            <input
              placeholder="Short description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800"
            />
            {/* Service location */}
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Service address (optional)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-3.5 text-gray-800"
              />
            </div>
            {/* Service date + time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />Service Date
                </label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={e => setServiceDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />Service Time
                </label>
                <input
                  type="time"
                  value={serviceTime}
                  onChange={e => setServiceTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Line Items</p>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 mb-1 px-0.5">
              <span className="col-span-6 text-xs text-gray-400 font-semibold">Description</span>
              <span className="col-span-2 text-xs text-gray-400 font-semibold text-center">Qty</span>
              <span className="col-span-4 text-xs text-gray-400 font-semibold">$ Price</span>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    placeholder="e.g. Lawn mowing"
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    className="col-span-6 border border-gray-200 rounded-xl p-3 text-gray-800 text-sm"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="col-span-2 border border-gray-200 rounded-xl p-3 text-gray-800 text-sm text-center"
                    inputMode="decimal"
                  />
                  <div className="col-span-3 flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <span className="pl-2.5 text-gray-400 text-sm font-semibold">$</span>
                    <input
                      type="number"
                      value={item.unit_price}
                      min={0}
                      step={0.01}
                      onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="flex-1 p-3 text-gray-800 text-sm focus:outline-none w-full"
                      inputMode="decimal"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={lineItems.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-20 text-lg cursor-pointer flex items-center justify-center h-full"
                  >✕</button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3">
              <button onClick={addItem} className="text-sm text-violet-600 font-bold cursor-pointer">
                + Add line
              </button>
              {total > 0 && (
                <p className="text-base font-bold text-gray-800 bg-violet-50 px-3 py-1 rounded-lg">
                  Total: ${total.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Deposit / payment required */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requirePayment}
                onChange={e => { setRequirePayment(e.target.checked); if (!e.target.checked) setDepositAmount('') }}
                className="w-4 h-4 accent-violet-600 cursor-pointer"
              />
              <span className="text-sm font-bold text-gray-700">Require payment to approve</span>
            </label>
            {requirePayment && (
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1.5">Deposit Amount (leave blank to require full payment)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder={total > 0 ? total.toFixed(2) : '0.00'}
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-3.5 py-3 text-gray-800"
                    inputMode="decimal"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {depositAmount && total > 0
                    ? `Client pays $${parseFloat(depositAmount).toFixed(2)} now — $${(total - parseFloat(depositAmount || '0')).toFixed(2)} remaining after service`
                    : 'Client must pay the full amount to approve this quote'}
                </p>
              </div>
            )}
          </div>

          {/* Expires + Notes — stacked, not side by side */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1.5">Expiry Date (optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1.5">Internal Notes (not shown to client)</label>
              <input
                placeholder="e.g. Client wants early morning..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800"
              />
            </div>
          </div>

          {clientEmail && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-sm text-violet-700 font-semibold">
              <Mail className="w-4 h-4 inline mr-1" aria-hidden="true" />Quote will be emailed to {clientEmail} on save
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold py-4 rounded-xl text-base cursor-pointer shadow disabled:opacity-50"
            >
              {saving ? 'Saving…' : clientEmail ? <span className="flex items-center justify-center gap-1.5"><Mail className="w-4 h-4" aria-hidden="true" />Save & Send</span> : 'Save Estimate'}
            </button>
            <button
              onClick={resetForm}
              className="border-2 border-gray-200 text-gray-600 font-bold py-4 px-5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quote list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-14 h-14 mx-auto text-gray-300 mb-3" aria-hidden="true" />
          <p className="text-gray-700 font-bold mb-1">No estimates yet</p>
          <p className="text-gray-400 text-sm">Create your first estimate above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(quote => (
            <div key={quote.id} className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-violet-600 hover:shadow-md transition-all duration-200">

              {/* Main content */}
              <div className="p-4">

                {/* Header row: status badges (top-left) + total (top-right) */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <QuoteStatusBadge status={quote.status} />
                    {quote.require_payment && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold py-1 px-2 rounded-full bg-violet-100 text-violet-700">
                        <CreditCard className="w-3 h-3" aria-hidden="true" />
                        {quote.deposit_amount ? `$${quote.deposit_amount.toFixed(2)} dep.` : 'Full pay req.'}
                      </span>
                    )}
                    {quote.expires_at && (
                      <span className="text-xs text-gray-400">Exp {new Date(quote.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-violet-700 shrink-0 leading-none">${quote.amount.toFixed(2)}</p>
                </div>

                {/* Title + client + date */}
                <h4 className="font-bold text-gray-800 text-base mb-0.5">{quote.title}</h4>
                <p className="text-gray-500 text-sm">
                  {quote.client_name}
                  <span className="text-gray-300 mx-1">·</span>
                  <span className="text-gray-400 text-xs">{new Date(quote.created_at).toLocaleDateString()}</span>
                </p>

                {/* Touch-friendly contact links */}
                <div className="space-y-0.5 mt-1">
                  {quote.client_phone && (
                    <a href={`tel:${quote.client_phone}`} className="flex items-center gap-2 py-2.5 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-gray-600 text-sm">
                      <Phone className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{quote.client_phone}</span>
                    </a>
                  )}
                  {quote.client_email && (
                    <a href={`mailto:${quote.client_email}`} className="flex items-center gap-2 py-2.5 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-gray-600 text-sm min-w-0">
                      <Mail className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span className="truncate">{quote.client_email}</span>
                    </a>
                  )}
                  {quote.address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(quote.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 py-2.5 -mx-1 px-1 rounded-lg active:bg-gray-100 transition-colors text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
                      <span className="break-words">{quote.address}</span>
                    </a>
                  )}
                </div>

                {/* Service date / time */}
                {(quote.service_date || quote.service_time) && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                    {quote.service_date && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-gray-400" aria-hidden="true" />
                        {new Date(quote.service_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {quote.service_time && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" aria-hidden="true" />
                        {fmtTime(quote.service_time)}
                      </span>
                    )}
                  </div>
                )}

                {quote.description && <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{quote.description}</p>}
              </div>

              {/* Line items — subtle gray footer */}
              {quote.line_items?.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
                  {quote.line_items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-500">
                      <span className="truncate">{item.description}</span>
                      <span className="font-semibold shrink-0 ml-2">{item.quantity} × ${item.unit_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="border-t border-gray-100 px-4 py-3 rounded-b-2xl flex items-center gap-2">

                {/* Icon-only share buttons — min 44px tap targets */}
                <button
                  onClick={() => sendQuoteEmail(quote)}
                  disabled={!quote.client_email || sending === quote.id}
                  title={quote.client_email ? `Email ${quote.client_email}` : 'No email on file'}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => sendQuoteSMS(quote)}
                  disabled={!quote.client_phone}
                  title={quote.client_phone ? `Text ${quote.client_phone}` : 'No phone on file'}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => copyLink(quote.share_token)}
                  title="Copy share link"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                >
                  {copiedId === quote.share_token
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    : <Link2 className="w-4 h-4" aria-hidden="true" />}
                </button>

                {/* Approve — non-terminal statuses only */}
                {quote.status !== 'converted' && quote.status !== 'declined' && quote.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(quote.id, 'approved')}
                    className="min-h-[44px] flex-1 text-xs font-bold px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve
                  </button>
                )}

                {/* Convert (approved only) — single select that dispatches to invoice or job */}
                {quote.status === 'approved' && (
                  <>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === 'invoice') convertToInvoice(quote)
                        if (e.target.value === 'job') convertToJob(quote)
                      }}
                      className="min-h-[44px] flex-1 text-xs font-bold px-3 rounded-lg bg-violet-600 text-white border-0 cursor-pointer text-center appearance-none"
                    >
                      <option value="" disabled>Convert →</option>
                      <option value="invoice">→ Invoice</option>
                      <option value="job">→ Job</option>
                    </select>
                    {!quote.client_id && (
                      <button
                        onClick={() => saveAsClient(quote)}
                        disabled={savedClientIds.has(quote.id)}
                        title={savedClientIds.has(quote.id) ? 'Already saved' : 'Save as client'}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {savedClientIds.has(quote.id)
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                          : <UserPlus className="w-4 h-4" aria-hidden="true" />}
                      </button>
                    )}
                  </>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteQuote(quote.id)}
                  aria-label="Delete estimate"
                  className="min-h-[44px] min-w-[44px] ml-auto flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-400 hover:border-red-200 active:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
