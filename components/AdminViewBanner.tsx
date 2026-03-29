'use client'

import Link from 'next/link'
import { useAuth } from '../lib/useAuth'
import { useProfile } from '../lib/useProfile'

interface Props {
  view: string
}

export default function AdminViewBanner({ view }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)

  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) return null

  return (
    <div className="sticky top-0 z-50 bg-indigo-700 text-white px-4 py-2 flex items-center justify-between text-sm">
      <span className="font-medium">👁 Admin Preview — {view}</span>
      <Link href="/admin" className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold transition-colors">
        ← Admin
      </Link>
    </div>
  )
}
