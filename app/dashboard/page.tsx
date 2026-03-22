'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [clientCount, setClientCount] = useState(0)
  const [jobCount, setJobCount] = useState(0)
  const [invoiceCount, setInvoiceCount] = useState(0)

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    const { count: clients } = await supabase
      .from('Clients')
      .select('*', { count: 'exact', head: true })

    const { count: jobs } = await supabase
      .from('Jobs')
      .select('*', { count: 'exact', head: true })

    const { count: invoices } = await supabase
      .from('Invoices')
      .select('*', { count: 'exact', head: true })

    if (clients) setClientCount(clients)
    if (jobs) setJobCount(jobs)
    if (invoices) setInvoiceCount(invoices)
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <nav className="bg-green-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🌿 LawnDesk</h1>
        <p className="text-sm">Welcome back!</p>
      </nav>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow text-center">
            <p className="text-gray-500 mb-2">Total Clients</p>
            <p className="text-4xl font-bold text-green-700">{clientCount}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow text-center">
            <p className="text-gray-500 mb-2">Jobs This Week</p>
            <p className="text-4xl font-bold text-green-700">{jobCount}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow text-center">
            <p className="text-gray-500 mb-2">Pending Invoices</p>
            <p className="text-4xl font-bold text-green-700">{invoiceCount}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link href="/clients">
                <button className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  + Add New Client
                </button>
              </Link>
              <Link href="/jobs">
                <button className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  + Schedule Job
                </button>
              </Link>
              <Link href="/invoices">
                <button className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  + Create Invoice
                </button>
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            <p className="text-gray-400 text-center mt-8">No activity yet</p>
          </div>
        </div>
      </div>
    </main>
  )
}