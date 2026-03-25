'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/useAuth'
import { useProfile } from '../lib/useProfile'
import Sidebar from './Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, loading } = useProfile(user?.id)

  useEffect(() => {
    if (!loading && profile?.role === 'worker') {
      router.replace('/worker')
    }
  }, [profile, loading])

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 py-4 pt-16 md:px-6 md:pt-6 bg-gray-100 min-h-dvh w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
