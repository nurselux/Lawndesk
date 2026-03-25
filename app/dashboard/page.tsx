'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'

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

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }
    if (target === 0) { setCount(0); return }

    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic
      setCount(Math.round(eased * target))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return count
}

function DashboardContent() {
  const { user, loading } = useAuth()
  const { checking } = useSubscriptionGate()
  const router = useRouter()
  const searchParams = useSearchParams()
  const stripeSuccess = searchParams.get('success') === 'true'
  const [clientCount, setClientCount] = useState(0)
  const [jobsThisWeek, setJobsThisWeek] = useState(0)
  const [unpaidCount, setUnpaidCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('onboarding_dismissed') === '1'
  )
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0)
  const [lastMonthJobs, setLastMonthJobs] = useState(0)

  const animatedClients = useCountUp(clientCount)
  const animatedJobs = useCountUp(jobsThisWeek)
  const animatedUnpaid = useCountUp(unpaidCount)
  const animatedRevenue = useCountUp(totalRevenue, 1400)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      supabase.from('profiles').select('subscription_status, trial_ends_at, onboarding_complete').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setSubscriptionStatus(data.subscription_status)
            setTrialEndsAt(data.trial_ends_at)
            if (data.onboarding_complete === false) {
              router.replace('/onboarding')
            }
          }
        })
    }
  }, [user])

  const fetchDashboardData = async () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    await supabase
      .from('Invoices')
      .update({ status: '🔴 Overdue' })
      .eq('user_id', user!.id)
      .eq('status', '🟡 Unpaid')
      .lt('due_date', todayStr)
      .not('due_date', 'is', null)

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
    setDataLoaded(true)

    // Fetch last month stats for trend comparison
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
    const [{ data: lastInvoices }, { count: lastJobCount }] = await Promise.all([
      (supabase as any).from('Invoices').select('amount, status').eq('user_id', user!.id)
        .eq('status', '🟢 Paid').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
      (supabase as any).from('Jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id)
        .gte('date', lastMonthStart).lte('date', lastMonthEnd),
    ])
    if (lastInvoices) setLastMonthRevenue(lastInvoices.reduce((s: number, i: any) => s + i.amount, 0))
    setLastMonthJobs(lastJobCount ?? 0)
  }

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  const statusColor = (status: string) => {
    if (status === '🟢 Completed') return 'bg-green-100 text-green-700'
    if (status === '🟡 In Progress') return 'bg-yellow-100 text-yellow-700'
    if (status === '🔴 Cancelled') return 'bg-red-100 text-red-700'
    return 'bg-blue-100 text-blue-700'
  }

  const revenueTrend = lastMonthRevenue > 0
    ? Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : null

  const jobsTrend = lastMonthJobs > 0
    ? Math.round(((jobsThisWeek - lastMonthJobs) / lastMonthJobs) * 100)
    : null

  const statCards = [
    {
      gradient: 'from-green-500 to-emerald-600',
      emoji: '👥',
      label: 'Total Clients',
      display: String(animatedClients),
      href: '/clients',
      linkLabel: 'View all →',
      delay: 0,
      trend: null,
    },
    {
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '📅',
      label: 'Jobs This Week',
      display: String(animatedJobs),
      href: '/jobs',
      linkLabel: 'View all →',
      delay: 80,
      trend: jobsTrend,
    },
    {
      gradient: 'from-amber-400 to-orange-500',
      emoji: '⚠️',
      label: 'Unpaid Invoices',
      display: String(animatedUnpaid),
      href: '/invoices',
      linkLabel: 'View all →',
      delay: 160,
      trend: null,
    },
    {
      gradient: 'from-purple-500 to-violet-600',
      emoji: '💰',
      label: 'Total Revenue',
      display: `$${animatedRevenue.toLocaleString()}`,
      href: '/invoices',
      linkLabel: 'View invoices →',
      delay: 240,
      trend: revenueTrend,
    },
  ]

  return (
    <div className="p-6 pb-6 min-h-dvh bg-gray-50">
      {stripeSuccess && (
        <div className="bg-green-100 text-green-800 font-bold p-4 rounded-xl mb-6 flex items-center gap-3">
          🎉 You're all set! Your 14-day free trial has started. No charge until your trial ends.
        </div>
      )}

      {subscriptionStatus === 'trialing' && !stripeSuccess && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold p-4 rounded-xl mb-6 flex items-center justify-between">
          <span>
            🎁 You&apos;re on a free trial —{' '}
            {trialEndsAt
              ? (() => {
                  const days = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
                  return days > 0 ? `${days} day${days === 1 ? '' : 's'} remaining.` : 'trial ending soon.'
                })()
              : 'enjoy full access!'}{' '}
            Your card won&apos;t be charged until the trial ends.
          </span>
          <Link href="/settings" className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ml-4">
            Manage Billing
          </Link>
        </div>
      )}

      {subscriptionStatus === 'past_due' && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-semibold p-4 rounded-xl mb-6 flex items-center justify-between">
          <span>⚠️ Your payment failed. Please update your billing info to keep access.</span>
          <Link href="/pricing" className="text-xs font-bold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Update Billing
          </Link>
        </div>
      )}

      {subscriptionStatus === 'cancelled' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 font-semibold p-4 rounded-xl mb-6 flex items-center justify-between">
          <span>⚠️ Your subscription has been cancelled. Reactivate to keep using LawnDesk.</span>
          <Link href="/pricing" className="text-xs font-bold bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
            Reactivate
          </Link>
        </div>
      )}

      <div
        className="flex items-center gap-3 mb-8 fade-up"
        style={{ animation: 'fadeUp 0.4s ease-out both' }}
      >
        <div className="bg-green-700 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">📊</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 leading-none">Dashboard</h2>
          <p className="text-gray-500 text-sm">Welcome back! Here's your business at a glance.</p>
        </div>
      </div>

      {/* Onboarding */}
      {clientCount === 0 && upcomingJobs.length === 0 && dataLoaded && !onboardingDismissed && (
        <div
          className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8"
          style={{ animation: 'fadeUp 0.5s ease-out both', animationDelay: '100ms' }}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xl font-bold text-gray-800">Welcome to LawnDesk! 🌿</h3>
            <button
              onClick={() => { setOnboardingDismissed(true); localStorage.setItem('onboarding_dismissed', '1') }}
              className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
            >
              ✕ Skip
            </button>
          </div>
          <p className="text-gray-500 mb-5">Let's get your business set up. Follow these steps to get started:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', icon: '👥', title: 'Add Your First Client', desc: 'Store their name, phone, and address.', href: '/clients', label: 'Add Client' },
              { step: '2', icon: '📅', title: 'Schedule a Job', desc: 'Set a date, time, and job type.', href: '/jobs', label: 'Schedule Job' },
              { step: '3', icon: '📄', title: 'Create an Invoice', desc: 'Send it and get paid faster.', href: '/invoices', label: 'Create Invoice' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">{item.step}</span>
                  <span className="text-xl">{item.icon}</span>
                  <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                </div>
                <p className="text-gray-400 text-xs mb-3">{item.desc}</p>
                <Link href={item.href}>
                  <button className="w-full bg-green-700 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-800 transition cursor-pointer">
                    {item.label} →
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 sm:p-6 shadow text-center text-white spring-in`}
            style={{
              animation: 'springIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              animationDelay: `${card.delay}ms`,
            }}
          >
            <p className="text-4xl mb-1">{card.emoji}</p>
            <p className="text-white/80 mb-1 text-xs sm:text-sm">{card.label}</p>
            <p className="text-3xl sm:text-4xl font-bold tabular-nums">{card.display}</p>
            {card.trend !== null && (
              <p className={`text-xs mt-0.5 font-semibold ${card.trend >= 0 ? 'text-white/90' : 'text-white/70'}`}>
                {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}% vs last mo
              </p>
            )}
            <Link href={card.href} className="text-xs text-white/70 hover:text-white mt-1 inline-block">
              {card.linkLabel}
            </Link>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Jobs */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md"
          style={{ animation: 'fadeUp 0.45s ease-out both', animationDelay: '320ms' }}
        >
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
              {upcomingJobs.map((job, i) => (
                <div
                  key={job.id}
                  className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0 slide-in-row"
                  style={{
                    animation: 'slideInRow 0.35s ease-out both',
                    animationDelay: `${360 + i * 70}ms`,
                  }}
                >
                  <div>
                    <p className="font-semibold text-gray-800">{job.title}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">📅 {job.date}</span>
                      <span className="text-xs text-gray-500">👤 {job.client_name}</span>
                      {job.time && <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">🕐 {job.time}</span>}
                    </div>
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
          <div
            className="bg-amber-50 rounded-2xl p-6 shadow-md"
            style={{ animation: 'fadeUp 0.45s ease-out both', animationDelay: '360ms' }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link href="/clients">
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  + Add Client
                </button>
              </Link>
              <Link href="/jobs">
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  + Schedule Job
                </button>
              </Link>
              <Link href="/invoices">
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  + Create Invoice
                </button>
              </Link>
            </div>
          </div>

          {/* Overdue Invoices */}
          <div
            className="bg-amber-50 rounded-2xl p-6 shadow-md"
            style={{ animation: 'fadeUp 0.45s ease-out both', animationDelay: '420ms' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Overdue Invoices</h3>
              <Link href="/invoices?filter=Overdue" className="text-sm text-green-600 hover:underline">View all →</Link>
            </div>
            {overdueInvoices.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-gray-400 text-sm">Nothing overdue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueInvoices.map((inv, i) => (
                  <div
                    key={inv.id}
                    className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 slide-in-row"
                    style={{
                      animation: 'slideInRow 0.35s ease-out both',
                      animationDelay: `${440 + i * 60}ms`,
                    }}
                  >
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
