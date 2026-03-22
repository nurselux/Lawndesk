'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (token_hash && type) {
      // PKCE flow: token passed as query params
      supabase.auth.verifyOtp({ token_hash, type: type as any })
        .then(({ error }) => {
          if (error) router.replace('/login?error=confirmation_failed')
          else router.replace('/dashboard')
        })
    } else {
      // Implicit flow: session tokens are in the URL hash (#access_token=...)
      // createBrowserClient processes the hash automatically — just wait for it
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/dashboard')
          return
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe()
            router.replace('/dashboard')
          }
        })
      })
    }
  }, [router, searchParams])

  return (
    <main className="min-h-dvh bg-green-700 flex items-center justify-center">
      <div className="text-white text-center">
        <p className="text-5xl mb-4">🌿</p>
        <p className="text-2xl font-bold mb-2">Confirming your account...</p>
        <p className="text-green-200">You'll be redirected in just a moment.</p>
      </div>
    </main>
  )
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
