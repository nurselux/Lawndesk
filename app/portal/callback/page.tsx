'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

function PortalCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: type as any })
        .then(({ error }) => {
          if (error) router.replace('/portal?error=1')
          else router.replace('/portal/dashboard')
        })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.replace('/portal/dashboard')
        else router.replace('/portal')
      })
    }
  }, [router, searchParams])

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-800 to-emerald-900 flex items-center justify-center">
      <div className="text-white text-center">
        <p className="text-5xl mb-4">🌿</p>
        <p className="text-2xl font-bold mb-2">Signing you in…</p>
        <p className="text-green-200 text-sm">Just a moment.</p>
      </div>
    </div>
  )
}

export default function PortalCallbackPage() {
  return (
    <Suspense>
      <PortalCallbackHandler />
    </Suspense>
  )
}
