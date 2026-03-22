'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true')
  const [message, setMessage] = useState(
    searchParams.get('error') === 'confirmation_failed'
      ? 'Confirmation link expired or invalid. Please sign up again.'
      : ''
  )
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter your email and password')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('Please enter your email and password')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMessage(error.message)
    } else {
      setSignUpSuccess(true)
    }
    setLoading(false)
  }

  if (signUpSuccess) {
    return (
      <main className="min-h-screen bg-green-700 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden text-center">
          <div className="bg-green-700 px-6 py-10">
            <div className="text-7xl mb-4">📬</div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email!</h1>
            <p className="text-green-200 text-lg">Your account is almost ready.</p>
          </div>
          <div className="px-8 py-8">
            <p className="text-gray-700 text-lg mb-2">We sent a confirmation link to:</p>
            <p className="text-green-700 font-bold text-xl mb-6 break-all">{email}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left space-y-2">
              <p className="text-gray-700 font-semibold text-sm">Next steps:</p>
              <p className="text-gray-600 text-sm">1. Open your email inbox</p>
              <p className="text-gray-600 text-sm">2. Click the confirmation link</p>
              <p className="text-gray-600 text-sm">3. Come back and log in — you're all set! 🌿</p>
            </div>
            <p className="text-gray-400 text-xs mb-6">Don't see it? Check your spam or junk folder.</p>
            <button
              onClick={() => { setIsSignUp(false); setSignUpSuccess(false); setMessage('') }}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              Go to Log In
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (isSignUp) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
          <div className="bg-green-700 px-6 sm:px-10 py-8 text-center">
            <Link href="/"><h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 hover:opacity-80 transition-opacity cursor-pointer">🌿 LawnDesk</h1></Link>
            <p className="text-green-200 text-sm">Less paperwork, more yardwork</p>
          </div>
          <div className="px-6 sm:px-10 pt-6 pb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Start Your Free Trial</h2>
              <span className="inline-block bg-green-100 text-green-700 text-xs font-bold py-1 px-3 rounded-full">
                14 days free · No credit card required
              </span>
            </div>
            <ul className="space-y-2 mb-6">
              {['Manage unlimited clients & jobs', 'Create and track invoices instantly', 'Recurring job scheduling on autopilot'].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-gray-600 text-sm">
                  <span className="text-green-600 font-bold">✓</span> {benefit}
                </li>
              ))}
            </ul>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-3 text-gray-800"
            />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-5 text-gray-800"
            />
            <button
              onClick={handleSignUp}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-lg mb-3 hover:scale-105 transition-all duration-200 cursor-pointer text-lg"
            >
              {loading ? '⏳ Creating account...' : 'Create Free Account'}
            </button>
            <button
              onClick={() => { setIsSignUp(false); setMessage('') }}
              className="w-full border-2 border-gray-200 text-gray-500 font-semibold py-3 rounded-lg hover:border-green-700 hover:text-green-700 transition-all duration-200 cursor-pointer"
            >
              Already have an account? Log In
            </button>
            {message && (
              <p className={`text-center mt-4 text-sm ${message.includes('error') || message.includes('Invalid') ? 'text-red-500' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-xl">
        <Link href="/"><h1 className="text-2xl sm:text-3xl font-bold text-green-700 text-center mb-2 hover:opacity-70 transition-opacity cursor-pointer">🌿 LawnDesk</h1></Link>
        <p className="text-center text-gray-500 mb-8">Less paperwork, more yardwork</p>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Welcome back</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-6 text-gray-800"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-green-700 text-white font-bold py-3 rounded-lg mb-3 hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          {loading ? '⏳ Logging in...' : 'Log In'}
        </button>
        <button
          onClick={() => { setIsSignUp(true); setMessage('') }}
          className="w-full border-2 border-green-700 text-green-700 font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          New to LawnDesk? Sign Up Free
        </button>
        {message && (
          <p className={`text-center mt-4 ${message.includes('error') || message.includes('Invalid') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        <Link href="/forgot-password">
          <p className="text-center text-green-600 text-sm mt-4 hover:underline cursor-pointer">
            🔑 Forgot your password?
          </p>
        </Link>
        <p className="text-center mt-4 text-gray-400 text-sm">
          <Link href="/pricing" className="text-green-600 font-bold hover:underline">
            View pricing plans →
          </Link>
        </p>
      </div>
    </main>
  )
}