'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Leaf, CheckCircle } from 'lucide-react'

const MAX_ATTEMPTS = 20   // 20 × 1.5s = 30 seconds max
const POLL_INTERVAL = 1500

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState(0)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) return

      const { data } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', session.user.id)
        .single()

      const status = (data as any)?.subscription_status
      const isActive = status === 'active' || status === 'trialing'

      if (isActive && !cancelled) {
        router.replace('/dashboard')
        return
      }

      setAttempts(a => {
        const next = a + 1
        if (next >= MAX_ATTEMPTS) {
          setTimedOut(true)
          return next
        }
        setTimeout(poll, POLL_INTERVAL)
        return next
      })
    }

    // Start polling after a short initial delay to give the webhook a head start
    const t = setTimeout(poll, 1000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [router])

  if (timedOut) {
    return (
      <main className="min-h-dvh bg-green-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <Leaf className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Still setting up…</h1>
          <p className="text-gray-500 mb-6">
            Your payment was successful but it's taking a bit longer than usual to activate. Give it a minute then go to your dashboard.
          </p>
          <button
            onClick={() => router.replace('/dashboard')}
            className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-green-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
        <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment successful!</h1>
        <p className="text-gray-500 mb-6">Setting up your account — you'll be redirected in just a moment.</p>
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
