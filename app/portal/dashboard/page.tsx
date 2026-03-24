'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

interface Quote {
  id: string
  title: string
  description: string | null
  amount: number
  status: string
  share_token: string
  expires_at: string | null
  created_at: string
  line_items: { description: string; quantity: number; unit_price: number }[]
}

interface Invoice {
  id: string
  description: string | null
  amount: number
  status: string
  due_date: string | null
  invoice_number: number
  share_token: string
  created_at: string
}

const QUOTE_STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-400',
  converted: 'bg-purple-100 text-purple-700',
}

export default function PortalDashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/portal'); return }
      const userEmail = session.user.email!
      setEmail(userEmail)
      fetchData(userEmail)
    })
  }, [router])

  const fetchData = async (userEmail: string) => {
    const [{ data: quoteData }, { data: invoiceData }] = await Promise.all([
      supabase
        .from('Quotes')
        .select('id, title, description, amount, status, share_token, expires_at, created_at, line_items')
        .eq('client_email', userEmail)
        .order('created_at', { ascending: false }),
      supabase
        .from('Invoices')
        .select('id, description, amount, status, due_date, invoice_number, share_token, created_at')
        .eq('client_email', userEmail)
        .order('created_at', { ascending: false }),
    ])
    if (quoteData) setQuotes(quoteData as Quote[])
    if (invoiceData) setInvoices(invoiceData as Invoice[])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/portal')
  }

  const totalOwed = invoices
    .filter(i => i.status !== '🟢 Paid')
    .reduce((s, i) => s + i.amount, 0)

  const pendingQuotes = quotes.filter(q => q.status === 'sent')

  if (loading) return (
    <div className="min-h-dvh bg-gradient-to-br from-green-800 to-emerald-900 flex items-center justify-center">
      <div className="text-white text-center">
        <p className="text-4xl mb-3">🌿</p>
        <p className="text-lg font-bold">Loading your portal…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-gray-50">

      {/* Header */}
      <div className="bg-green-800 text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-none">🌿 LawnDesk</h1>
          <p className="text-green-300 text-xs mt-0.5">{email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-green-200 text-sm font-semibold hover:text-white transition cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Summary */}
        {(totalOwed > 0 || pendingQuotes.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {pendingQuotes.length > 0 && (
              <div className="bg-blue-600 rounded-2xl p-4 text-white text-center shadow">
                <p className="text-blue-100 text-xs font-semibold mb-0.5">Awaiting Approval</p>
                <p className="text-2xl font-bold">{pendingQuotes.length} quote{pendingQuotes.length !== 1 ? 's' : ''}</p>
              </div>
            )}
            {totalOwed > 0 && (
              <div className="bg-amber-500 rounded-2xl p-4 text-white text-center shadow">
                <p className="text-amber-100 text-xs font-semibold mb-0.5">Amount Due</p>
                <p className="text-2xl font-bold">${totalOwed.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        {/* Quotes */}
        <section>
          <h2 className="font-bold text-gray-800 text-lg mb-3">
            Quotes {quotes.length > 0 && <span className="text-gray-400 font-normal text-sm">({quotes.length})</span>}
          </h2>
          {quotes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-400 text-sm">No quotes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map(q => (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800">{q.title}</p>
                        {q.description && <p className="text-gray-400 text-sm truncate">{q.description}</p>}
                        <p className="text-gray-400 text-xs mt-1">{new Date(q.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-gray-800">${q.amount.toFixed(2)}</p>
                        <span className={`text-xs font-bold py-1 px-2 rounded-full ${QUOTE_STATUS_STYLE[q.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {q.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(q.status === 'sent' || q.status === 'draft') && (
                    <div className="border-t border-gray-100 bg-blue-50 px-4 py-3 flex justify-between items-center">
                      <p className="text-blue-700 text-sm font-semibold">Review and approve this quote</p>
                      <a
                        href={`/quote/${q.share_token}`}
                        className="bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-green-800 transition"
                      >
                        Review →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invoices */}
        <section>
          <h2 className="font-bold text-gray-800 text-lg mb-3">
            Invoices {invoices.length > 0 && <span className="text-gray-400 font-normal text-sm">({invoices.length})</span>}
          </h2>
          {invoices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-3xl mb-2">📄</p>
              <p className="text-gray-400 text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => {
                const isPaid = inv.status === '🟢 Paid'
                const isOverdue = inv.status === '🔴 Overdue'
                return (
                  <div key={inv.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
                    isPaid ? 'border-green-500' : isOverdue ? 'border-red-500' : 'border-amber-500'
                  }`}>
                    <div className="p-4 flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-mono mb-0.5">INV-{String(inv.invoice_number).padStart(3, '0')}</p>
                        {inv.description && <p className="font-semibold text-gray-800 truncate">{inv.description}</p>}
                        {inv.due_date && <p className="text-xs text-gray-400 mt-1">Due {inv.due_date}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-bold ${isPaid ? 'text-green-700' : isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                          ${inv.amount.toFixed(2)}
                        </p>
                        <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                          isPaid ? 'bg-green-100 text-green-700' :
                          isOverdue ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                    {!isPaid && (
                      <div className="border-t border-gray-100 bg-amber-50 px-4 py-3 flex justify-between items-center">
                        <p className="text-amber-700 text-sm font-semibold">Payment due</p>
                        <a
                          href={`/invoice/${inv.share_token}`}
                          className="bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-green-800 transition"
                        >
                          Pay Now →
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <p className="text-center text-gray-400 text-xs pb-4">
          Powered by <a href="https://lawndesk.pro" className="hover:text-gray-600">LawnDesk</a>
        </p>
      </div>
    </div>
  )
}
