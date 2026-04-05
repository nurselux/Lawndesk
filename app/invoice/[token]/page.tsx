'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { Leaf, Search, Printer, CreditCard, Loader2, CheckCircle2 } from 'lucide-react'
import { InvoiceStatusBadge } from '../../../lib/statusIcons'

interface Invoice {
  id: string
  invoice_number: number
  client_name: string
  amount: number
  status: string
  due_date: string
  description: string
  created_at: string
}

export default function PublicInvoicePage() {
  const params = useParams()
  const token = params.token as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [justPaid, setJustPaid] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('paid=true')) {
      setJustPaid(true)
    }
  }, [])

  useEffect(() => {
    const fetchInvoice = async () => {
      const { data, error } = await supabase
        .from('Invoices')
        .select('id, invoice_number, client_name, amount, status, due_date, description, created_at')
        .eq('share_token', token)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setInvoice(data as Invoice)
      }
    }
    fetchInvoice()
  }, [token])

  if (notFound) {
    return (
      <main className="min-h-dvh bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center shadow-xl max-w-sm w-full">
          <Search className="w-14 h-14 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h1>
          <p className="text-gray-500 text-sm">This link may be invalid or the invoice has been deleted.</p>
        </div>
      </main>
    )
  }

  if (!invoice) {
    return (
      <main className="min-h-dvh bg-gray-100 flex items-center justify-center">
        <p className="text-green-700 text-xl font-bold">Loading invoice...</p>
      </main>
    )
  }

  const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`
  const createdDate = new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-dvh bg-gray-100 flex flex-col items-center justify-start p-6 print:bg-white print:p-0">

      {/* Success banner */}
      {justPaid && (
        <div className="w-full max-w-xl mb-4 bg-green-100 border border-green-300 text-green-800 font-bold p-4 rounded-xl print:hidden">
          <CheckCircle2 className="w-5 h-5 shrink-0 inline mr-2" aria-hidden="true" />Payment received! Thank you — your invoice has been marked as paid.
        </div>
      )}

      {/* Print button — hidden when printing */}
      <div className="w-full max-w-xl mb-4 flex justify-between items-center print:hidden">
        <Link href="/" className="text-green-700 font-bold hover:underline text-sm flex items-center gap-1"><Leaf className="w-4 h-4" aria-hidden="true" />LawnDesk</Link>
        <button
          onClick={() => window.print()}
          className="bg-white border border-gray-300 text-gray-600 font-bold py-2 px-5 rounded-lg hover:bg-gray-50 transition cursor-pointer text-sm shadow flex items-center gap-1"
        >
          <Printer className="w-4 h-4" aria-hidden="true" /> Print / Save PDF
        </button>
      </div>

      {/* Invoice card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden print:shadow-none print:rounded-none">

        {/* Header */}
        <div className="bg-green-700 px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Leaf className="w-6 h-6" aria-hidden="true" />LawnDesk</h1>
            <p className="text-green-200 text-sm">Professional Lawn Services</p>
          </div>
          <div className="text-right">
            <p className="text-green-200 text-xs font-semibold uppercase tracking-wide">Invoice</p>
            <p className="text-white text-2xl font-bold font-mono">{invoiceNum}</p>
          </div>
        </div>

        <div className="px-8 py-6">

          {/* Status badge */}
          <div className="flex justify-end mb-6">
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          {/* Bill to / dates */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Bill To</p>
              <p className="text-lg font-bold text-gray-800">{invoice.client_name}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Issue Date</p>
                <p className="text-gray-700 font-medium">{createdDate}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Due Date</p>
                  <p className={`font-bold ${invoice.status === '🔴 Overdue' ? 'text-red-600' : 'text-gray-700'}`}>
                    {new Date(invoice.due_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line item */}
          <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-2 grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span className="col-span-2">Description</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="px-4 py-4 grid grid-cols-3 items-center border-t border-gray-100">
              <p className="col-span-2 text-gray-700">{invoice.description || 'Lawn services'}</p>
              <p className="text-right font-bold text-gray-800">${invoice.amount.toFixed(2)}</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-right min-w-[180px]">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Total Due</p>
              <p className="text-3xl font-bold text-green-700">${invoice.amount.toFixed(2)}</p>
            </div>
          </div>

          {/* Pay Now button */}
          {invoice.status !== '🟢 Paid' && (
            <div className="mb-6 print:hidden">
              <button
                onClick={async () => {
                  setPayLoading(true)
                  try {
                    const res = await fetch('/api/create-invoice-payment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ invoiceId: invoice.id, token }),
                    })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                  } catch {
                    alert('Something went wrong. Please try again.')
                  }
                  setPayLoading(false)
                }}
                disabled={payLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition cursor-pointer text-lg shadow-md disabled:opacity-50"
              >
                {payLoading ? <><Loader2 className="w-5 h-5 animate-spin inline mr-2" aria-hidden="true" />Redirecting...</> : <><CreditCard className="w-5 h-5 inline mr-2" aria-hidden="true" />Pay ${invoice.amount.toFixed(2)} Now</>}
              </button>
              <p className="text-center text-gray-400 text-xs mt-2">Secure payment powered by Stripe</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-gray-400 text-xs">Thank you for your business!</p>
            <p className="text-gray-300 text-xs mt-1">Generated by LawnDesk · lawndesk.pro</p>
          </div>

        </div>
      </div>
    </main>
  )
}
