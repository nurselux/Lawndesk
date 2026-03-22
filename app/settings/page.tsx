'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email || '')
    }
    getUser()
  }, [])

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPwError('Please fill in both fields.')
      setTimeout(() => setPwError(''), 3000)
      return
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.')
      setTimeout(() => setPwError(''), 3000)
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      setTimeout(() => setPwError(''), 3000)
      return
    }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) {
      setNewPassword('')
      setConfirmPassword('')
      setPwSuccess('Password updated successfully!')
      setTimeout(() => setPwSuccess(''), 4000)
    } else {
      setPwError(error.message)
      setTimeout(() => setPwError(''), 4000)
    }
    setPwSaving(false)
  }

  const handleManageBilling = async () => {
    setLoading(true)
    router.push('/pricing')
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Settings</h2>

      {/* Account */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Account</h3>
        <div className="flex items-center gap-4">
          <div className="bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800">{userEmail}</p>
            <p className="text-gray-500 text-sm">LawnDesk Account</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Change Password</h3>
        {pwSuccess && (
          <div className="bg-green-100 text-green-700 font-bold p-3 rounded-lg mb-4">✅ {pwSuccess}</div>
        )}
        {pwError && (
          <div className="bg-red-100 text-red-700 font-bold p-3 rounded-lg mb-4">❌ {pwError}</div>
        )}
        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-gray-800"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-gray-800"
          />
          <button
            onClick={handleChangePassword}
            className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer w-fit"
          >
            {pwSaving ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Subscription</h3>
        <p className="text-gray-500 mb-4">Manage your LawnDesk subscription and billing.</p>
        <div className="flex gap-4">
          <Link href="/pricing">
            <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              View Plans
            </button>
          </Link>
          <button
            onClick={handleManageBilling}
            className="border-2 border-green-700 text-green-700 font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Loading...' : 'Manage Billing'}
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h3>
        <p className="text-gray-500 mb-4">Our support team is here to help you get the most out of LawnDesk.</p>
        <a href="mailto:support@lawndesk.com">
          <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            📧 Contact Support
          </button>
        </a>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-6 shadow border-2 border-red-100">
        <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-gray-500 mb-4">Once you cancel your subscription you will lose access to all LawnDesk features.</p>
        <button className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          Cancel Subscription
        </button>
      </div>
    </div>
  )
}
