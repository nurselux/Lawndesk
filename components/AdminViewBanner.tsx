'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface Props {
  view: string
}

export default function AdminViewBanner({ view }: Props) {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null)
    })
  }, [])

  if (email !== 'admin.lawndesk@gmail.com') return null

  return (
    <div className="sticky top-0 z-50 bg-indigo-700 text-white px-4 py-2 flex items-center justify-between text-sm">
      <span className="font-medium">👁 Admin Preview — {view}</span>
      <Link href="/admin" className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold transition-colors">
        ← Admin
      </Link>
    </div>
  )
}
