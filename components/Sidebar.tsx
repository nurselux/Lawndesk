'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      if (session?.user?.email) setUserEmail(session.user.email)
    }
    checkUser()
  }, [])

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { label: 'Clients', icon: '👥', href: '/clients' },
    { label: 'Jobs', icon: '📅', href: '/jobs' },
    { label: 'Invoices', icon: '📄', href: '/invoices' },
    { label: 'Settings', icon: '⚙️', href: '/settings' },
  ]

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 min-h-dvh bg-green-800 text-white fixed left-0 top-0">
        <div className="p-6 border-b border-green-700">
          <Link href={isLoggedIn ? '/dashboard' : '/'}>
            <h1 className="text-2xl font-bold cursor-pointer hover:text-green-200 transition-all duration-200">🌿 LawnDesk</h1>
          </Link>
          <p className="text-green-300 text-xs mt-1">Less paperwork, more yardwork</p>
        </div>
        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`p-3 rounded-lg mb-2 font-medium transition-all duration-200 cursor-pointer hover:bg-green-700 ${
                isActive(item.href) ? 'bg-green-600' : ''
              }`}>
                {item.icon} {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-green-700">
          {userEmail && <p className="text-green-300 text-xs mb-3 truncate">👤 {userEmail}</p>}
          <button
            onClick={handleLogout}
            className="w-full bg-green-700 hover:bg-red-600 transition-all duration-200 text-white font-bold py-3 rounded-lg cursor-pointer"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-green-800 text-white flex items-center justify-between px-4 h-14 shadow-lg">
        <Link href="/dashboard">
          <span className="text-lg font-bold">🌿 LawnDesk</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-green-700 transition cursor-pointer"
          aria-label="Open menu"
        >
          <span className="block w-5 h-0.5 bg-white rounded" />
          <span className="block w-5 h-0.5 bg-white rounded" />
          <span className="block w-5 h-0.5 bg-white rounded" />
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
      <div className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 bg-green-800 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-green-700">
          <div>
            <h1 className="text-xl font-bold">🌿 LawnDesk</h1>
            {userEmail && <p className="text-green-300 text-xs mt-0.5 truncate">{userEmail}</p>}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-green-700 transition cursor-pointer text-xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer ${
                isActive(item.href)
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-green-700 text-green-100'
              }`}>
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="p-4 border-t border-green-700" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-red-600 transition-all duration-200 text-white font-bold py-3.5 rounded-xl cursor-pointer"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

    </>
  )
}
