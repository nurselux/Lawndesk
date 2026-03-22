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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: '📊 Dashboard', href: '/dashboard' },
    { label: '👥 Clients', href: '/clients' },
    { label: '📅 Jobs', href: '/jobs' },
    { label: '📄 Invoices', href: '/invoices' },
    { label: '⚙️ Settings', href: '/settings' },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-green-800 text-white fixed left-0 top-0">
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
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'bg-green-600' : ''
              }`}>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-green-700">
          {userEmail && (
            <p className="text-green-300 text-xs mb-3 truncate">👤 {userEmail}</p>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-green-700 hover:bg-red-600 transition-all duration-200 text-white font-bold py-3 rounded-lg cursor-pointer"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-green-800 text-white flex justify-around px-1 pt-2 z-50" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const [icon, ...words] = item.label.split(' ')
          const label = words.join(' ')
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center px-2 py-2 rounded-lg transition-all duration-200 min-w-[44px] ${isActive ? 'bg-green-600' : ''}`}>
                <p className="text-xl leading-none">{icon}</p>
                <p className="text-xs mt-1 font-medium">{label}</p>
              </div>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center px-2 py-2 rounded-lg transition-all duration-200 min-w-[44px] hover:bg-red-600 cursor-pointer"
        >
          <p className="text-xl leading-none">🚪</p>
          <p className="text-xs mt-1 font-medium">Logout</p>
        </button>
      </nav>
    </>
  )
}
