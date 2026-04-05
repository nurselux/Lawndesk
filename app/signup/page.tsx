'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { Leaf } from 'lucide-react'

function SignupContent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setMessage('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    if (!smsConsent) {
      setMessage('Please agree to receive SMS notifications')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else if (!data.user || data.user.identities?.length === 0) {
      // User object null or email already registered
      if (!data.user) {
        setMessage('Something went wrong')
        setLoading(false)
        return
      }
      router.push(`/account-exists?email=${encodeURIComponent(email)}`)
    } else {
      // Save SMS consent to profile
      await supabase
        .from('profiles')
        .update({ sms_consent: true, sms_consent_at: new Date().toISOString() })
        .eq('id', data.user.id)
      router.push(`/signup-success?email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <main className="min-h-dvh bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-xl">
        <Link href="/" className="text-2xl sm:text-3xl font-bold text-green-700 text-center mb-2 hover:opacity-70 transition-opacity cursor-pointer flex items-center justify-center gap-2"><Leaf className="w-6 h-6" aria-hidden="true" /> LawnDesk</Link>
        <h1 className="text-xl font-bold text-gray-800 text-center mb-2">Create Your Free Account</h1>
        <p className="text-gray-500 text-center mb-6">Start your 14-day free trial today</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800"
            />
          </div>

          <label className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 cursor-pointer accent-green-700"
              required
            />
            <span className="text-sm text-gray-700 leading-relaxed flex-1">
              By checking this box, I agree to receive automated SMS text messages from{' '}
              <span className="font-semibold">LawnDesk</span> about my service appointments,
              scheduling reminders, invoices, and job status updates. Message frequency varies.
              Msg &amp; data rates may apply. Reply <span className="font-semibold">STOP</span> to
              cancel, <span className="font-semibold">HELP</span> for help.{' '}
              <Link href="/privacy" className="text-green-600 hover:underline" target="_blank" rel="noopener">Privacy Policy</Link>
              {' '}·{' '}
              <Link href="/terms" className="text-green-600 hover:underline" target="_blank" rel="noopener">Terms</Link>
            </span>
          </label>

          {message && (
            <p className={`text-center text-sm ${message.includes('error') || message.includes('Please') ? 'text-red-500' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors duration-200 cursor-pointer text-lg"
          >
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full border-2 border-green-700 text-green-700 font-semibold py-3 rounded-lg hover:bg-green-50 transition-colors duration-200 cursor-pointer"
          >
            Already have an account? Log In
          </button>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-400 text-sm">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-green-600 font-bold hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-green-600 font-bold hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignupPage() {
  return <SignupContent />
}
