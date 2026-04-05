'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Leaf, Search, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface Quote {
  id: string
  client_name: string
  title: string
  description: string | null
  line_items: LineItem[]
  amount: number
  status: string
  expires_at: string | null
  notes: string | null
  created_at: string
  share_token: string
}

export default function PublicQuotePage() {
  const params = useParams()
  const token = params.token as string
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionDone, setActionDone] = useState<'approved' | 'declined' | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (token) fetchQuote()
  }, [token])

  const fetchQuote = async () => {
    const { data } = await supabase
      .from('Quotes')
      .select('id, client_name, title, description, line_items, amount, status, expires_at, notes, created_at, share_token')
      .eq('share_token', token)
      .single()
    if (data) setQuote(data as Quote)
    setLoading(false)
  }

  const handleAction = async (action: 'approved' | 'declined') => {
    if (!quote) return
    setWorking(true)
    await fetch('/api/approve-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: quote.id, token: quote.share_token, action }),
    })
    setActionDone(action)
    setQuote((prev) => prev ? { ...prev, status: action } : prev)
    setWorking(false)
  }

  const isExpired = quote?.expires_at
    ? new Date(quote.expires_at) < new Date()
    : false

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh bg-gray-50">
      <p className="text-green-700 text-xl font-bold">Loading quote…</p>
    </div>
  )

  if (!quote) return (
    <div className="flex items-center justify-center min-h-dvh bg-gray-50">
      <div className="text-center">
        <Search className="w-14 h-14 text-gray-300 mx-auto mb-4" aria-hidden="true" />
        <p className="text-gray-700 font-bold text-xl">Quote not found</p>
        <p className="text-gray-400 mt-2">This link may have expired or been removed.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-800 text-white px-5 py-2 rounded-full text-lg font-bold mb-4">
            <Leaf className="w-5 h-5" aria-hidden="true" /> LawnDesk
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{quote.title}</h1>
          <p className="text-gray-500 mt-1">Prepared for {quote.client_name}</p>
          {quote.expires_at && (
            <p className={`text-sm mt-2 font-semibold ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
              {isExpired ? <><AlertTriangle className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />This quote has expired</> : `Valid until ${new Date(quote.expires_at).toLocaleDateString()}`}
            </p>
          )}
        </div>

        {/* Quote card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {quote.description && (
            <div className="px-6 pt-6 pb-2">
              <p className="text-gray-600">{quote.description}</p>
            </div>
          )}

          {/* Line items */}
          {quote.line_items?.length > 0 && (
            <div className="px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-left">
                    <th className="pb-2 font-semibold">Description</th>
                    <th className="pb-2 font-semibold text-right">Qty</th>
                    <th className="pb-2 font-semibold text-right">Unit Price</th>
                    <th className="pb-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.line_items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 text-gray-800">{item.description}</td>
                      <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-2.5 text-right text-gray-600">${item.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
            <span className="font-bold text-gray-700 text-lg">Total Estimate</span>
            <span className="text-3xl font-bold text-green-700">${quote.amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Status / Action */}
        {actionDone === 'approved' || quote.status === 'approved' ? (
          <div className="bg-green-100 border border-green-300 text-green-800 font-bold text-center py-5 rounded-2xl text-lg">
            <CheckCircle2 className="w-5 h-5 inline mr-2" aria-hidden="true" />You approved this quote! We&apos;ll be in touch soon to schedule.
          </div>
        ) : actionDone === 'declined' || quote.status === 'declined' ? (
          <div className="bg-gray-100 border border-gray-200 text-gray-600 font-bold text-center py-5 rounded-2xl text-lg">
            You declined this quote. Feel free to reach out if you change your mind.
          </div>
        ) : quote.status === 'converted' ? (
          <div className="bg-purple-100 border border-purple-200 text-purple-700 font-bold text-center py-5 rounded-2xl text-lg">
            <RefreshCw className="w-5 h-5 inline mr-2" aria-hidden="true" />This quote has been converted to a job. We&apos;re already working on it!
          </div>
        ) : isExpired ? (
          <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-center py-5 rounded-2xl">
            <AlertTriangle className="w-5 h-5 inline mr-2" aria-hidden="true" />This quote has expired. Please contact us for an updated estimate.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <p className="text-gray-600 mb-5">Does this look right? Let us know!</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleAction('approved')}
                disabled={working}
                className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow disabled:opacity-50"
              >
                {working ? '…' : <><CheckCircle2 className="w-4 h-4 inline mr-1" aria-hidden="true" />Approve Quote</>}
              </button>
              <button
                onClick={() => handleAction('declined')}
                disabled={working}
                className="border-2 border-red-300 text-red-500 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 inline mr-1" aria-hidden="true" />Decline
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">
          Powered by LawnDesk · {new Date(quote.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
