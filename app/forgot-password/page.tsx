'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage('✅ Check your email for a password reset link!')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-xl">
        <h1 className="text-3xl font-bold text-green-700 text-center mb-2">🌿 LawnDesk</h1>
        <p className="text-center text-gray-500 mb-8">Less paperwork, more yardwork</p>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Forgot Password?</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Enter your email and we'll send you a reset link</p>
        {message ? (
          <div className="bg-green-100 text-green-700 font-bold p-4 rounded-lg text-center mb-4">
            {message}
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
            />
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}
            <button
              onClick={handleReset}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-lg mb-3 hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
            </button>
          </>
        )}
        <Link href="/login">
          <p className="text-center text-green-600 font-bold hover:underline cursor-pointer mt-4">
            ← Back to Login
          </p>
        </Link>
      </div>
    </main>
  )
}