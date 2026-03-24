'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/portal/callback`,
        shouldCreateUser: true,
      },
    })
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-800 to-emerald-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🌿 LawnDesk</h1>
          <p className="text-green-300 text-sm">Client Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm mb-4">
                We sent a magic link to <strong>{email}</strong>.
                Click it to sign in — no password needed.
              </p>
              <p className="text-gray-400 text-xs">Didn&apos;t get it? Check your spam folder.</p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 text-sm text-green-700 font-semibold hover:underline cursor-pointer"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Sign in</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter the email where you received your quote or invoice.
                We&apos;ll send you a sign-in link.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
                className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button
                onClick={handleLogin}
                disabled={loading || !email.trim()}
                className="w-full bg-gradient-to-r from-green-700 to-emerald-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition cursor-pointer shadow disabled:opacity-50"
              >
                {loading ? 'Sending link…' : 'Send Magic Link →'}
              </button>
              <p className="text-gray-400 text-xs text-center mt-4">
                No password needed. The link expires in 1 hour.
              </p>
            </>
          )}
        </div>

        <p className="text-green-400 text-xs text-center mt-6">
          Powered by LawnDesk · <a href="https://lawndesk.pro" className="hover:text-white transition">lawndesk.pro</a>
        </p>
      </div>
    </div>
  )
}
