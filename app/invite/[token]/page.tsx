'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function InvitePage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()

  const [invite, setInvite] = useState<{ email: string; used: boolean } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase
      .from('invites')
      .select('email, used')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setInvite(data)
        }
        setLoading(false)
      })
  }, [token])

  const handleSignUp = async () => {
    if (!name.trim() || !password) {
      setMessage('Please enter your name and password')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }
    setSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email: invite!.email,
      password,
      options: { data: { name: name.trim() } },
    })

    if (error) {
      setMessage(error.message)
      setSubmitting(false)
      return
    }

    if (data.user) {
      // Insert profile (trigger may not have run yet client-side)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'worker',
        name: name.trim(),
      })

      // Accept the invite to link to admin
      await supabase.rpc('accept_invite', { invite_token: token })

      router.push('/worker')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50">
      <p className="text-green-700 font-bold text-xl">Loading...</p>
    </div>
  )

  if (notFound || invite?.used) return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <p className="text-5xl mb-4">❌</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Invite</h2>
        <p className="text-gray-500">This invite link has already been used or is no longer valid.</p>
        <p className="text-gray-400 text-sm mt-4">Contact your employer for a new invite.</p>
      </div>
    </div>
  )

  return (
    <main className="min-h-dvh bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <Link href="/"><h1 className="text-2xl font-bold text-green-700 text-center mb-1 hover:opacity-70 transition-opacity cursor-pointer">🌿 LawnDesk</h1></Link>
        <p className="text-center text-gray-400 text-sm mb-8">Worker Account Setup</p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700 font-semibold text-sm text-center">
            👋 You've been invited to join a LawnDesk team
          </p>
          <p className="text-gray-500 text-xs text-center mt-1">{invite?.email}</p>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">Create Your Account</h2>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
        />
        <input
          type="password"
          placeholder="Choose a password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
          className="w-full border border-gray-300 rounded-lg p-3 mb-6 text-gray-800"
        />
        <button
          onClick={handleSignUp}
          disabled={submitting}
          className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-60"
        >
          {submitting ? '⏳ Setting up account...' : 'Create Account & Join Team'}
        </button>
        {message && (
          <p className="text-center mt-4 text-sm text-red-500">{message}</p>
        )}
      </div>
    </main>
  )
}
