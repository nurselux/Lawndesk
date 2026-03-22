'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

interface Job {
  id: string
  title: string
  client_name: string
  date: string
  time: string
  status: string
}

interface Invoice {
  id: string
  client_name: string
  amount: number
  status: string
  due_date: string
}

function DashboardContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const stripeSuccess = searchParams.get('success') === 'true'
  const [clientCount, setClientCount] = useState(0)
  const [jobsThisWeek, setJobsThisWeek] = useState(0)
  const [unpaidCount, setUnpaidCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Start and end of current week (Mon–Sun)
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const [
      { count: clients },
      { count: thisWeek },
      { data: invoiceData },
      { data: upcoming },
      { data: overdue },
    ] = await Promise.all([
      (supabase as any).from('Clients').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      (supabase as any).from('Jobs').select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr),
      (supabase as any).from('Invoices').select('amount, status').eq('user_id', user!.id),
      (supabase as any).from('Jobs').select('id, title, client_name, date, time, status')
        .eq('user_id', user!.id)
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .limit(5),
      (supabase as any).from('Invoices').select('id, client_name, amount, status, due_date')
        .eq('user_id', user!.id)
        .eq('status', '🔴 Overdue')
        .order('due_date', { ascending: true })
        .limit(5),
    ])

    setClientCount(clients ?? 0)
    setJobsThisWeek(thisWeek ?? 0)

    if (invoiceData) {
      const unpaid = invoiceData.filter((inv: any) => inv.status === '🟡 Unpaid')
      const paid = invoiceData.filter((inv: any) => inv.status === '🟢 Paid')
      setUnpaidCount(unpaid.length)
      setTotalRevenue(paid.reduce((sum: number, inv: any) => sum + inv.amount, 0))
    }

    if (upcoming) setUpcomingJobs(upcoming as Job[])
    if (overdue) setOverdueInvoices(overdue as Invoice[])
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  const statusColor = (status: string) => {
    if (status === '🟢 Completed') return 'bg-green-100 text-green-700'
    if (status === '🟡 In Progress') return 'bg-yellow-100 text-yellow-700'
    if (status === '🔴 Cancelled') return 'bg-red-100 text-red-700'
    return 'bg-blue-100 text-blue-700'
  }

  return (
    <div className="p-6 pb-24 md:pb-6">
      {stripeSuccess && (
        <div className="bg-green-100 text-green-800 font-bold p-4 rounded-xl mb-6 flex items-center gap-3">
          🎉 Payment successful! Welcome to LawnDesk Pro. Your subscription is now active.
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow text-center">
          <p className="text-gray-500 mb-1 text-xs sm:text-sm">Total Clients</p>
          <p className="text-3xl sm:text-4xl font-bold text-green-700">{clientCount}</p>
          <Link href="/clients" className="text-xs text-green-600 hover:underline mt-1 inline-block">View all →</Link>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow text-center">
          <p className="text-gray-500 mb-1 text-xs sm:text-sm">Jobs This Week</p>
          <p className="text-3xl sm:text-4xl font-bold text-green-700">{jobsThisWeek}</p>
          <Link href="/jobs" className="text-xs text-green-600 hover:underline mt-1 inline-block">View all →</Link>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow text-center">
          <p className="text-gray-500 mb-1 text-xs sm:text-sm">Unpaid Invoices</p>
          <p className={`text-3xl sm:text-4xl font-bold ${unpaidCount > 0 ? 'text-yellow-600' : 'text-green-700'}`}>{unpaidCount}</p>
          <Link href="/invoices" className="text-xs text-green-600 hover:underline mt-1 inline-block">View all →</Link>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow text-center">
          <p className="text-gray-500 mb-1 text-xs sm:text-sm">Total Revenue</p>
          <p className="text-3xl sm:text-4xl font-bold text-green-700">${totalRevenue.toFixed(0)}</p>
          <Link href="/invoices" className="text-xs text-green-600 hover:underline mt-1 inline-block">View invoices →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Jobs */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Upcoming Jobs</h3>
            <Link href="/jobs" className="text-sm text-green-600 hover:underline">View all →</Link>
          </div>
          {upcomingJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-gray-400">No upcoming jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map((job) => (
                <div key={job.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-800">{job.title}</p>
                    <p className="text-sm text-gray-500">👤 {job.client_name} · 📅 {job.date}{job.time ? ` · 🕐 ${job.time}` : ''}</p>
                  </div>
                  <span className={`text-xs font-bold py-1 px-3 rounded-full ${statusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link href="/clients">
                <button className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  + Add Client
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

          {/* Overdue Invoices */}
          <div className="bg-white rounded-xl p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Overdue Invoices</h3>
              <Link href="/invoices" className="text-sm text-green-600 hover:underline">View all →</Link>
            </div>
            {overdueInvoices.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-gray-400 text-sm">Nothing overdue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueInvoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{inv.client_name}</p>
                      {inv.due_date && <p className="text-xs text-red-400">Due {inv.due_date}</p>}
                    </div>
                    <p className="font-bold text-red-500">${inv.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
