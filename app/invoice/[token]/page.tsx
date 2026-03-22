'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

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
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center shadow-xl max-w-sm w-full">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h1>
          <p className="text-gray-500 text-sm">This link may be invalid or the invoice has been deleted.</p>
        </div>
      </main>
    )
  }

  if (!invoice) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-green-700 text-xl font-bold">Loading invoice...</p>
      </main>
    )
  }

  const statusColor =
    invoice.status === '🟢 Paid' ? 'bg-green-100 text-green-700' :
    invoice.status === '🔴 Overdue' ? 'bg-red-100 text-red-700' :
    'bg-yellow-100 text-yellow-700'

  const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`
  const createdDate = new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6 print:bg-white print:p-0">

      {/* Print button — hidden when printing */}
      <div className="w-full max-w-xl mb-4 flex justify-between items-center print:hidden">
        <Link href="/" className="text-green-700 font-bold hover:underline text-sm">🌿 LawnDesk</Link>
        <button
          onClick={() => window.print()}
          className="bg-green-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-800 transition cursor-pointer text-sm shadow"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Invoice card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden print:shadow-none print:rounded-none">

        {/* Header */}
        <div className="bg-green-700 px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">🌿 LawnDesk</h1>
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
            <span className={`text-sm font-bold py-1.5 px-4 rounded-full ${statusColor}`}>
              {invoice.status}
            </span>
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

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-gray-400 text-xs">Thank you for your business!</p>
            <p className="text-gray-300 text-xs mt-1">Generated by LawnDesk · lawndesk.vercel.app</p>
          </div>

        </div>
      </div>
    </main>
  )
}
