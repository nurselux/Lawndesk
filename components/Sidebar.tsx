'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, Leaf, CalendarDays, ClipboardList,
  Receipt, Inbox, HardHat, Settings, LogOut, X, Menu, Clock, UserCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const navItems = [
  { label: 'Dashboard',  Icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Clients',    Icon: Users,            href: '/clients' },
  { label: 'Jobs',       Icon: Leaf,             href: '/jobs' },
  { label: 'Calendar',   Icon: CalendarDays,     href: '/calendar' },
  { label: 'Quotes',     Icon: ClipboardList,    href: '/quotes' },
  { label: 'Invoices',   Icon: Receipt,          href: '/invoices' },
  { label: 'Requests',   Icon: Inbox,            href: '/requests' },
  { label: 'Team',       Icon: HardHat,          href: '/team' },
  { label: 'Settings',   Icon: Settings,         href: '/settings' },
] as const

type NavItem = {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [overdueCount, setOverdueCount] = useState(0)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)

  const fetchCounts = useCallback(async (userId: string) => {
    const [invoiceResult, requestResult] = await Promise.all([
      (supabase as any)
        .from('Invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'overdue'),
      (supabase as any)
        .from('booking_requests')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('status', 'pending'),
    ])
    setOverdueCount(invoiceResult.count ?? 0)
    setPendingRequestsCount(requestResult.count ?? 0)
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      if (session?.user?.email) setUserEmail(session.user.email)
      if (session?.user?.id) {
        fetchCounts(session.user.id)
        const profileResult = await (supabase as any)
          .from('profiles')
          .select('subscription_status, trial_ends_at')
          .eq('id', session.user.id)
          .single()
        if (profileResult.data?.subscription_status === 'trialing' && profileResult.data?.trial_ends_at) {
          const days = Math.ceil((new Date(profileResult.data.trial_ends_at).getTime() - Date.now()) / 86400000)
          setTrialDaysLeft(days > 0 ? days : 0)
        }
      }
    }
    checkUser()
  }, [fetchCounts])

  useEffect(() => {
    const handleRequestsUpdated = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) fetchCounts(session.user.id)
    }
    window.addEventListener('requests-updated', handleRequestsUpdated)
    return () => window.removeEventListener('requests-updated', handleRequestsUpdated)
  }, [fetchCounts])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItemsWithBadges: NavItem[] = navItems.map((item) => ({
    ...item,
    badge:
      item.href === '/invoices' && overdueCount > 0 ? overdueCount
      : item.href === '/requests' && pendingRequestsCount > 0 ? pendingRequestsCount
      : undefined,
  }))

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const TrialBadge = ({ mobile }: { mobile?: boolean }) =>
    trialDaysLeft !== null ? (
      <Link href="/pricing">
        <div className={`mb-3 rounded-lg px-3 py-2 text-xs font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
          mobile ? 'rounded-xl py-2.5 text-sm' : ''
        } ${trialDaysLeft <= 3 ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in trial
        </div>
      </Link>
    ) : null

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 min-h-dvh bg-green-800 text-white fixed left-0 top-0">
        <div className="p-6 border-b border-green-700">
          <Link href={isLoggedIn ? '/dashboard' : '/'}>
            <h1 className="text-2xl font-bold cursor-pointer hover:text-green-200 transition-colors duration-200">
              <span aria-hidden="true">🌿 </span>LawnDesk
            </h1>
          </Link>
          <p className="text-green-300 text-xs mt-1">Less paperwork, more yardwork</p>
        </div>
        <nav className="flex-1 p-4">
          {navItemsWithBadges.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`p-3 rounded-lg mb-2 font-medium transition-colors duration-200 cursor-pointer hover:bg-green-700 flex items-center justify-between ${
                isActive(item.href) ? 'bg-green-600' : ''
              }`}>
                <span className="flex items-center gap-3">
                  <item.Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-green-700">
          <TrialBadge />
          {userEmail && (
            <p className="text-green-300 text-xs mb-3 truncate flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {userEmail}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 transition-colors duration-200 text-white font-bold py-3 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-green-800 text-white flex items-center justify-between px-4 h-14 shadow-lg">
        <Link href="/dashboard">
          <span className="text-lg font-bold">
            <span aria-hidden="true">🌿 </span>LawnDesk
          </span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      {/* ── Mobile Drawer Backdrop ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div className={`md:hidden fixed top-0 left-0 h-dvh w-72 z-50 bg-green-800 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-green-700">
          <div>
            <h1 className="text-xl font-bold"><span aria-hidden="true">🌿 </span>LawnDesk</h1>
            {userEmail && <p className="text-green-300 text-xs mt-0.5 truncate">{userEmail}</p>}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItemsWithBadges.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-base transition-colors duration-200 cursor-pointer ${
                isActive(item.href)
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-green-700 text-green-100'
              }`}>
                <item.Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-green-700" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <TrialBadge mobile />
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 transition-colors duration-200 text-white font-bold py-3.5 rounded-xl cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
