'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

async function getRedirect(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('stripe_customer_id, role')
    .eq('id', userId)
    .single()
  if (data?.role === 'worker') return '/worker'
  if (!data?.stripe_customer_id) return '/pricing'
  return '/dashboard'
}

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: type as any })
        .then(async ({ data, error }) => {
          if (error) { router.replace('/login?error=confirmation_failed'); return }
          const dest = data.session ? await getRedirect(data.session.user.id) : '/pricing'
          router.replace(dest)
        })
    } else {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          router.replace(await getRedirect(session.user.id))
          return
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe()
            getRedirect(session.user.id).then(dest => router.replace(dest))
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
