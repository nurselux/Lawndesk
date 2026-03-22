'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in both fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setMessage('✅ Password updated successfully!')
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-xl">
        <h1 className="text-3xl font-bold text-green-700 text-center mb-2">🌿 LawnDesk</h1>
        <p className="text-center text-gray-500 mb-8">Less paperwork, more yardwork</p>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Set New Password</h2>
        {message ? (
          <div className="bg-green-100 text-green-700 font-bold p-4 rounded-lg text-center">
            {message}
            <p className="text-sm mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
            />
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}
            <button
              onClick={handleUpdatePassword}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              {loading ? '⏳ Updating...' : '🔐 Update Password'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}