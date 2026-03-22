'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
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
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-700 text-center mb-2">🌿 LawnDesk</h1>
        <p className="text-center text-gray-500 mb-8">Less paperwork, more yardwork</p>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
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
        {isSignUp ? (
          <button
            onClick={handleSignUp}
            className="w-full bg-green-700 text-white font-bold py-3 rounded-lg mb-3 hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            {loading ? '⏳ Creating account...' : 'Create Account'}
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full bg-green-700 text-white font-bold py-3 rounded-lg mb-3 hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            {loading ? '⏳ Logging in...' : 'Log In'}
          </button>
        )}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setMessage('')
          }}
          className="w-full border-2 border-green-700 text-green-700 font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          {isSignUp ? 'Already have an account? Log In' : 'New to LawnDesk? Sign Up'}
        </button>
        {message && (
          <p className={`text-center mt-4 ${message.includes('error') || message.includes('Invalid') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        {!isSignUp && (
          <Link href="/forgot-password">
            <p className="text-center text-green-600 text-sm mt-4 hover:underline cursor-pointer">
              🔑 Forgot your password?
            </p>
          </Link>
        )}
        <p className="text-center mt-4 text-gray-400 text-sm">
          <Link href="/pricing" className="text-green-600 font-bold hover:underline">
            View pricing plans →
          </Link>
        </p>
      </div>
    </main>
  )
}