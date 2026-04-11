'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'
import {
  Receipt, Mail, MessageSquare, Link2, Pencil, Trash2, Search,
  CheckCircle2, Plus, Minus, Copy, ExternalLink, ArrowUpDown,
  FileText, AlertTriangle, Clock, DollarSign, X, CreditCard
} from 'lucide-react'
import { InvoiceStatusBadge } from '../../lib/statusIcons'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface Invoice {
  id: string
  client_name: string
  client_id: string
  client_email: string | null
  client_phone: string | null
  amount: number
  amount_paid: number
  status: string
  due_date: string
  description: string
  notes: string | null
  tax_rate: number | null
  line_items: LineItem[]
  user_id: string
  invoice_number: number
  share_token: string
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

type SendState = { id: string; type: 'email' | 'sms' }
type SortKey = 'number' | 'amount' | 'due_date' | 'status'

const STATUSES = [
  { value: '📝 Draft',    label: 'Draft' },
  { value: '🟡 Unpaid',  label: 'Unpaid' },
  { value: '🟠 Partial', label: 'Partial' },
  { value: '🟢 Paid',    label: 'Paid' },
  { value: '🔴 Overdue', label: 'Overdue' },
]

const emptyLine = (): LineItem => ({ description: '', quantity: 1, unit_price: 0 })

function calcSubtotal(items: LineItem[]) {
  return items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
}

function InvoicesContent() {
  const { user } = useAuth()
  const { checking } = useSubscriptionGate()
  const searchParams = useSearchParams()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('filter') || 'All')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('number')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<SendState | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)
  const [defaultDueDays, setDefaultDueDays] = useState(15)
  const [recordingPaymentId, setRecordingPaymentId] = useState<string | null>(null)
  const [recordPaymentInput, setRecordPaymentInput] = useState('')
  const [recordingSaving, setRecordingSaving] = useState(false)

  // Form state
  const [clientId, setClientId] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()])
  const [taxRate, setTaxRate] = useState('0')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formStatus, setFormStatus] = useState('🟡 Unpaid')

  const subtotal = calcSubtotal(lineItems)
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100
  const total = subtotal + taxAmount

  useEffect(() => {
    if (user) {
      markOverdueInvoices().then(fetchInvoices)
      fetchClients()
      supabase.from('profiles').select('invoice_due_days').eq('id', user.id).single()
        .then(({ data }) => {
          const days = (data as any)?.invoice_due_days ?? 15
          setDefaultDueDays(days)
          const d = new Date()
          d.setDate(d.getDate() + days)
          setDueDate(d.toISOString().split('T')[0])
        })
    }
  }, [user])

  const markOverdueInvoices = async () => {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('Invoices').update({ status: '🔴 Overdue' })
      .eq('user_id', user?.id).in('status', ['🟡 Unpaid', '🟠 Partial'])
      .lt('due_date', today).not('due_date', 'is', null)
  }

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('Invoices')
      .select('id, client_name, client_id, client_email, client_phone, amount, amount_paid, status, due_date, description, notes, tax_rate, line_items, user_id, invoice_number, share_token')
      .eq('user_id', user?.id)
      .order('invoice_number', { ascending: false })
    if (data) setInvoices(data as Invoice[])
  }

  const fetchClients = async () => {
    const { data } = await supabase.from('Clients').select('id, name, email, phone, address')
      .eq('user_id', user?.id).order('name')
    if (data) setClients(data as Client[])
  }

  const getNextInvoiceNumber = async () => {
    const { data } = await supabase.from('Invoices').select('invoice_number')
      .eq('user_id', user?.id).order('invoice_number', { ascending: false }).limit(1)
    return (data?.[0]?.invoice_number || 0) + 1
  }

  const getInvoiceLink = (token: string) => `${window.location.origin}/invoice/${token}`

  const resetForm = () => {
    setClientId('')
    setLineItems([emptyLine()])
    setTaxRate('0')
    const d = new Date()
    d.setDate(d.getDate() + defaultDueDays)
    setDueDate(d.toISOString().split('T')[0])
    setNotes('')
    setFormStatus('🟡 Unpaid')
    setShowForm(false)
    setEditingInvoice(null)
  }

  const handleClientSelect = (id: string) => {
    setClientId(id)
  }

  // Line item helpers
  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }
  const addLine = () => setLineItems(prev => [...prev, emptyLine()])
  const removeLine = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    if (!clientId || total <= 0) {
      setErrorMessage('Select a client and add at least one line item')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const client = clients.find(c => c.id === clientId)
    const nextNum = await getNextInvoiceNumber()
    const validLines = lineItems.filter(l => l.description.trim())
    const { data: inv, error } = await supabase.from('Invoices').insert([{
      client_name: client?.name || '',
      client_id: clientId,
      client_email: client?.email || null,
      client_phone: client?.phone || null,
      amount: total,
      status: formStatus,
      due_date: dueDate || null,
      description: validLines.map(l => l.description).join(', '),
      line_items: validLines,
      notes: notes || null,
      tax_rate: parseFloat(taxRate) || 0,
      invoice_number: nextNum,
      user_id: user?.id,
    }] as any).select().single()

    if (!error && inv) {
      resetForm()
      await fetchInvoices()
      setSuccessMessage(`Invoice #${String(nextNum).padStart(3, '0')} created!`)
      setTimeout(() => setSuccessMessage(''), 4000)
      if (client?.email && formStatus !== '📝 Draft') {
        handleSendEmail(inv as any, client.email, getInvoiceLink((inv as any).share_token))
      }
    } else if (error) {
      setErrorMessage(`Error: ${error.message}`)
      setTimeout(() => setErrorMessage(''), 4000)
    }
    setSaving(false)
  }

  const handleUpdate = async () => {
    if (!editingInvoice) return
    if (!clientId || total <= 0) {
      setErrorMessage('Select a client and add at least one line item')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    setSaving(true)
    const client = clients.find(c => c.id === clientId)
    const validLines = lineItems.filter(l => l.description.trim())
    const { error } = await (supabase.from('Invoices') as any).update({
      client_name: client?.name || '',
      client_id: clientId,
      client_email: client?.email || null,
      client_phone: client?.phone || null,
      amount: total,
      status: formStatus,
      due_date: dueDate || null,
      description: validLines.map(l => l.description).join(', '),
      line_items: validLines,
      notes: notes || null,
      tax_rate: parseFloat(taxRate) || 0,
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

  const openEdit = (inv: Invoice) => {
    setEditingInvoice(inv)
    setClientId(inv.client_id || '')
    const lines = Array.isArray(inv.line_items) && inv.line_items.length > 0
      ? inv.line_items
      : [{ description: inv.description || '', quantity: 1, unit_price: inv.amount }]
    setLineItems(lines)
    setTaxRate(String(inv.tax_rate ?? 0))
    setDueDate(inv.due_date || '')
    setNotes(inv.notes || '')
    setFormStatus(inv.status)
    setShowForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const duplicateInvoice = async (inv: Invoice) => {
    const nextNum = await getNextInvoiceNumber()
    const d = new Date()
    d.setDate(d.getDate() + defaultDueDays)
    const { error } = await supabase.from('Invoices').insert([{
      client_name: inv.client_name,
      client_id: inv.client_id,
      client_email: inv.client_email,
      client_phone: inv.client_phone,
      amount: inv.amount,
      status: '📝 Draft',
      due_date: d.toISOString().split('T')[0],
      description: inv.description,
      line_items: inv.line_items ?? [],
      notes: inv.notes,
      tax_rate: inv.tax_rate ?? 0,
      invoice_number: nextNum,
      user_id: user?.id,
    }] as any)
    if (!error) {
      fetchInvoices()
      setSuccessMessage(`Duplicated as INV-${String(nextNum).padStart(3, '0')} (Draft)`)
      setTimeout(() => setSuccessMessage(''), 4000)
    }
  }

  const markPaid = async (id: string) => {
    const inv = invoices.find(i => i.id === id)
    const newAmountPaid = inv ? inv.amount : 0
    await supabase.from('Invoices').update({ status: '🟢 Paid', amount_paid: newAmountPaid }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: '🟢 Paid', amount_paid: newAmountPaid } : i))
    setSuccessMessage('Marked as paid!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const recordPayment = async (inv: Invoice) => {
    const payment = parseFloat(recordPaymentInput)
    if (!payment || payment <= 0) return
    setRecordingSaving(true)
    const newAmountPaid = (inv.amount_paid || 0) + payment
    const newStatus = newAmountPaid >= inv.amount ? '🟢 Paid' : '🟠 Partial'
    const { error } = await supabase
      .from('Invoices')
      .update({ amount_paid: newAmountPaid, status: newStatus })
      .eq('id', inv.id)
    if (!error) {
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, amount_paid: newAmountPaid, status: newStatus } : i))
      setRecordingPaymentId(null)
      setRecordPaymentInput('')
      setSuccessMessage(newStatus === '🟢 Paid' ? 'Invoice fully paid!' : `Payment of $${payment.toFixed(2)} recorded — $${(inv.amount - newAmountPaid).toFixed(2)} remaining`)
      setTimeout(() => setSuccessMessage(''), 5000)
    }
    setRecordingSaving(false)
  }

  const bulkMarkPaid = async () => {
    if (selectedIds.size === 0) return
    setBulkSaving(true)
    const ids = Array.from(selectedIds)
    await supabase.from('Invoices').update({ status: '🟢 Paid' }).in('id', ids)
    setInvoices(prev => prev.map(inv => selectedIds.has(inv.id) ? { ...inv, status: '🟢 Paid' } : inv))
    setSelectedIds(new Set())
    setSuccessMessage(`${ids.length} invoice${ids.length !== 1 ? 's' : ''} marked as paid!`)
    setTimeout(() => setSuccessMessage(''), 4000)
    setBulkSaving(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
      setErrorMessage('No email on file for this client.')
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
        setSuccessMessage(`Invoice emailed to ${email}!`)
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
        setSuccessMessage(`Invoice texted to ${phone}!`)
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

  // Stats
  const totalRevenue = invoices.filter(i => i.status === '🟢 Paid').reduce((s, i) => s + i.amount, 0)
  const totalOutstanding = invoices
    .filter(i => ['🟡 Unpaid', '🔴 Overdue', '🟠 Partial'].includes(i.status))
    .reduce((s, i) => s + (i.amount - (i.amount_paid || 0)), 0)
  const overdueCount = invoices.filter(i => i.status === '🔴 Overdue').length

  // Sort + filter
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = invoices
    .filter(inv => {
      const q = search.toLowerCase()
      const matchSearch = !q || inv.client_name.toLowerCase().includes(q) || inv.description?.toLowerCase().includes(q)
      const matchStatus =
        filterStatus === 'All' ||
        (filterStatus === 'Draft' && inv.status === '📝 Draft') ||
        (filterStatus === 'Unpaid' && inv.status === '🟡 Unpaid') ||
        (filterStatus === 'Partial' && inv.status === '🟠 Partial') ||
        (filterStatus === 'Overdue' && inv.status === '🔴 Overdue') ||
        (filterStatus === 'Paid' && inv.status === '🟢 Paid')
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      let aVal: any, bVal: any
      if (sortKey === 'number') { aVal = a.invoice_number; bVal = b.invoice_number }
      else if (sortKey === 'amount') { aVal = a.amount; bVal = b.amount }
      else if (sortKey === 'due_date') { aVal = a.due_date || ''; bVal = b.due_date || '' }
      else if (sortKey === 'status') { aVal = a.status; bVal = b.status }
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    })

  const isEditing = !!editingInvoice
  const showAnyForm = showForm || isEditing

  if (checking) return (
    <div className="p-4 bg-gray-50 min-h-dvh max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-2xl mb-3 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="p-4 pb-8 bg-gray-50 min-h-dvh max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200" aria-hidden="true">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none">Invoices</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {overdueCount > 0
                ? <span className="text-red-500 font-semibold">{overdueCount} overdue</span>
                : invoices.filter(i => i.status !== '🟢 Paid').length > 0
                ? `${invoices.filter(i => ['🟡 Unpaid','🔴 Overdue'].includes(i.status)).length} outstanding`
                : 'All collected'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-gradient-to-r from-emerald-600 to-green-700 text-white font-bold py-3 px-5 rounded-xl hover:from-emerald-500 hover:to-green-600 transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-200 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> New
        </button>
      </div>

      {/* Stats */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-3 text-white text-center shadow-md shadow-emerald-100">
            <p className="text-emerald-100 text-xs font-semibold mb-0.5">Collected</p>
            <p className="text-xl font-black">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-3 text-white text-center shadow-md shadow-amber-100">
            <p className="text-amber-100 text-xs font-semibold mb-0.5">Outstanding</p>
            <p className="text-xl font-black">${totalOutstanding.toLocaleString()}</p>
          </div>
          <div className={`rounded-2xl p-3 text-white text-center shadow-md ${overdueCount > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-100' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
            <p className="text-red-100 text-xs font-semibold mb-0.5">Overdue</p>
            <p className="text-xl font-black">{overdueCount}</p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'All', color: 'emerald' },
          { key: 'Draft', color: 'gray' },
          { key: 'Unpaid', color: 'amber' },
          { key: 'Partial', color: 'orange' },
          { key: 'Overdue', color: 'red' },
          { key: 'Paid', color: 'green' },
        ].map(({ key, color }) => {
          const count = key === 'All' ? invoices.length
            : key === 'Draft' ? invoices.filter(i => i.status === '📝 Draft').length
            : key === 'Unpaid' ? invoices.filter(i => i.status === '🟡 Unpaid').length
            : key === 'Partial' ? invoices.filter(i => i.status === '🟠 Partial').length
            : key === 'Overdue' ? invoices.filter(i => i.status === '🔴 Overdue').length
            : invoices.filter(i => i.status === '🟢 Paid').length
          const active = filterStatus === key
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? color === 'red' ? 'bg-red-600 text-white'
                  : color === 'amber' ? 'bg-amber-500 text-white'
                  : color === 'orange' ? 'bg-orange-500 text-white'
                  : color === 'green' ? 'bg-green-600 text-white'
                  : color === 'gray' ? 'bg-gray-600 text-white'
                  : 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
              }`}
            >
              {key} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            placeholder="Search client or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 pl-9 text-gray-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-sm"
          />
        </div>
        <div className="flex gap-1">
          {([['number', '#'], ['amount', '$'], ['due_date', 'Due'], ['status', 'Status']] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                sortKey === key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'
              }`}
            >
              {label}
              {sortKey === key && <ArrowUpDown className="w-3 h-3" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold p-3 rounded-xl mb-4 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 font-semibold p-3 rounded-xl mb-4 flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
          {errorMessage}
        </div>
      )}

      {/* Create / Edit Form */}
      {showAnyForm && (
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
              {isEditing
                ? <><Pencil className="w-4 h-4 text-emerald-600" />Edit INV-{String(editingInvoice!.invoice_number).padStart(3, '0')}</>
                : <><Receipt className="w-4 h-4 text-emerald-600" />New Invoice</>
              }
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Client */}
            <select
              value={clientId}
              onChange={e => handleClientSelect(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
            >
              <option value="">Select client *</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ''}</option>
              ))}
            </select>

            {/* Line items */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Line Items</label>
              <div className="space-y-2">
                {lineItems.map((line, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="Description"
                      value={line.description}
                      onChange={e => updateLine(i, 'description', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl p-3 text-gray-800 text-sm focus:border-emerald-400 outline-none"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-14 border border-gray-200 rounded-xl p-3 text-gray-800 text-sm text-center focus:border-emerald-400 outline-none"
                      inputMode="decimal"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-3.5 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={line.unit_price || ''}
                        onChange={e => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-200 rounded-xl p-3 pl-6 text-gray-800 text-sm focus:border-emerald-400 outline-none"
                        inputMode="decimal"
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-600 w-16 text-right shrink-0">
                      ${(line.quantity * line.unit_price).toFixed(2)}
                    </span>
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors">
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addLine}
                className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600 font-semibold hover:text-emerald-700 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Add line item
              </button>
            </div>

            {/* Tax + Totals */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">Tax</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value)}
                    className="w-16 border border-gray-200 rounded-lg p-1.5 text-sm text-center focus:border-emerald-400 outline-none"
                    inputMode="decimal"
                  />
                  <span className="text-sm text-gray-400">%</span>
                  <span className="text-sm font-semibold text-gray-700 ml-1">${taxAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-black text-emerald-700">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Due date + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:border-emerald-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 bg-white focus:border-emerald-400 outline-none"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Notes / Terms (optional)</label>
              <textarea
                placeholder="e.g. Payment due within 15 days. Thank you for your business!"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 text-sm resize-none focus:border-emerald-400 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={isEditing ? handleUpdate : handleCreate}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-700 text-white font-bold py-3.5 rounded-xl hover:from-emerald-500 hover:to-green-600 transition-all cursor-pointer shadow disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Invoice'}
            </button>
            <button
              onClick={resetForm}
              className="border-2 border-gray-200 text-gray-500 font-bold py-3.5 px-5 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>

          {!isEditing && clients.find(c => c.id === clientId)?.email && formStatus !== '📝 Draft' && (
            <p className="text-xs text-emerald-600 mt-2 font-semibold flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Will auto-email to {clients.find(c => c.id === clientId)?.email}
            </p>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-700 text-white rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow-lg">
          <span className="font-bold text-sm">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={bulkMarkPaid}
              disabled={bulkSaving}
              className="bg-white text-emerald-700 font-bold text-xs py-2 px-4 rounded-lg hover:bg-emerald-50 transition cursor-pointer disabled:opacity-50"
            >
              {bulkSaving ? 'Saving…' : 'Mark All Paid'}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-emerald-200 hover:text-white text-xs font-semibold cursor-pointer">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-emerald-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-10 h-10 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-gray-900 font-bold mb-1">No invoices yet</p>
          <p className="text-gray-500 text-sm mb-6">Create your first invoice to start getting paid.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-emerald-600 to-green-700 text-white font-bold py-3 px-8 rounded-xl cursor-pointer shadow"
          >
            + Create Invoice
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-900 font-bold mb-1">No invoices match</p>
          <p className="text-gray-500 text-sm">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => {
            const isPaid = inv.status === '🟢 Paid'
            const isOverdue = inv.status === '🔴 Overdue'
            const isDraft = inv.status === '📝 Draft'
            const isPartial = inv.status === '🟠 Partial'
            const amountPaid = inv.amount_paid || 0
            const remaining = inv.amount - amountPaid
            const isSendingEmail = sending?.id === inv.id && sending.type === 'email'
            const isSendingSMS = sending?.id === inv.id && sending.type === 'sms'
            const borderColor = isPaid ? 'border-emerald-500' : isOverdue ? 'border-red-500' : isDraft ? 'border-gray-300' : isPartial ? 'border-orange-400' : 'border-amber-400'
            return (
              <div
                key={inv.id}
                className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden ${borderColor} ${selectedIds.has(inv.id) ? 'ring-2 ring-emerald-400' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {!isPaid && !isDraft && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv.id)}
                          onChange={() => toggleSelect(inv.id)}
                          className="mt-1 accent-emerald-600 cursor-pointer shrink-0 w-4 h-4"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-mono leading-none mb-0.5">
                          INV-{String(inv.invoice_number).padStart(3, '0')}
                        </p>
                        <p className="font-bold text-gray-900 text-base leading-tight">{inv.client_name}</p>
                        {inv.description && (
                          <p className="text-gray-400 text-xs truncate mt-0.5 max-w-[200px]">{inv.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-black leading-none ${isPaid ? 'text-emerald-600' : isOverdue ? 'text-red-500' : isDraft ? 'text-gray-400' : isPartial ? 'text-orange-600' : 'text-amber-600'}`}>
                        ${inv.amount.toFixed(2)}
                      </p>
                      {isPartial && amountPaid > 0 && (
                        <p className="text-xs text-orange-500 font-semibold mt-0.5">${remaining.toFixed(2)} remaining</p>
                      )}
                      {inv.due_date && (
                        <p className={`text-xs mt-0.5 font-medium flex items-center justify-end gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                          {isOverdue && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
                          {isOverdue ? 'Overdue ' : 'Due '}{inv.due_date}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status + Mark Paid + Record Payment */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={inv.status}
                      onChange={e => handleStatusChange(inv.id, e.target.value)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-full border-0 cursor-pointer ${
                        isPaid ? 'bg-emerald-100 text-emerald-700' :
                        isOverdue ? 'bg-red-100 text-red-700' :
                        isDraft ? 'bg-gray-100 text-gray-600' :
                        isPartial ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {!isPaid && !isDraft && (
                      <button
                        onClick={() => markPaid(inv.id)}
                        className="text-xs font-bold py-1.5 px-3 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Mark Paid
                      </button>
                    )}
                    {!isPaid && !isDraft && (
                      <button
                        onClick={() => { setRecordingPaymentId(inv.id); setRecordPaymentInput('') }}
                        className="text-xs font-bold py-1.5 px-3 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" aria-hidden="true" /> Record Payment
                      </button>
                    )}
                  </div>

                  {/* Record Payment inline form */}
                  {recordingPaymentId === inv.id && (
                    <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={remaining}
                          placeholder={remaining.toFixed(2)}
                          value={recordPaymentInput}
                          onChange={e => setRecordPaymentInput(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-gray-800 text-sm focus:border-blue-400 outline-none"
                          inputMode="decimal"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => recordPayment(inv)}
                        disabled={recordingSaving || !recordPaymentInput}
                        className="bg-blue-600 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {recordingSaving ? '…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setRecordingPaymentId(null)}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {isPartial && amountPaid > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      ${amountPaid.toFixed(2)} paid · ${remaining.toFixed(2)} remaining
                    </p>
                  )}
                </div>

                {/* Action bar */}
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2.5 flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleSendEmail(inv)}
                    disabled={isSendingEmail}
                    className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                      inv.client_email ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" /> {isSendingEmail ? 'Sending…' : 'Email'}
                  </button>

                  <button
                    onClick={() => handleSendSMS(inv)}
                    disabled={isSendingSMS}
                    className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                      inv.client_phone ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" /> {isSendingSMS ? 'Sending…' : 'Text'}
                  </button>

                  <button
                    onClick={() => copyLink(inv)}
                    className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" /> {copiedId === inv.id ? 'Copied!' : 'Link'}
                  </button>

                  <a
                    href={getInvoiceLink(inv.share_token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> View
                  </a>

                  <button
                    onClick={() => duplicateInvoice(inv)}
                    className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Dupe
                  </button>

                  <button
                    onClick={() => openEdit(inv)}
                    aria-label="Edit invoice"
                    className="ml-auto text-xs font-bold py-2 px-3 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    onClick={() => handleDelete(inv.id)}
                    aria-label="Delete invoice"
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
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
