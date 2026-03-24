'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [userEmail, setUserEmail] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)

  useEffect(() => {
    if (user) setUserEmail(user.email || '')
  }, [user])

  const handleChangePassword = async () => {
    setPwError('')
    setPwMessage('')
    if (!pwCurrent || !pwNew || !pwConfirm) { setPwError('All fields are required.'); return }
    if (pwNew.length < 6) { setPwError('New password must be at least 6 characters.'); return }
    if (pwNew !== pwConfirm) { setPwError('New passwords do not match.'); return }

    setPwSaving(true)
    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: pwCurrent })
    if (signInError) { setPwError('Current password is incorrect.'); setPwSaving(false); return }

    const { error } = await supabase.auth.updateUser({ password: pwNew })
    if (error) {
      setPwError(error.message)
    } else {
      setPwMessage('Password updated successfully!')
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
    }
    setPwSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

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
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={pwCurrent}
            onChange={e => setPwCurrent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
          />
          <input
            type="password"
            placeholder="New password (min. 6 characters)"
            value={pwNew}
            onChange={e => setPwNew(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={pwConfirm}
            onChange={e => setPwConfirm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm"
          />
          {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
          {pwMessage && <p className="text-green-600 text-sm font-semibold">{pwMessage}</p>}
          <button
            onClick={handleChangePassword}
            disabled={pwSaving}
            className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {pwSaving ? '⏳ Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Subscription</h3>
        <p className="text-gray-500 mb-4">Manage your LawnDesk subscription and billing.</p>
        <Link href="/pricing">
          <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            View Plans
          </button>
        </Link>
      </div>

      {/* Need Help */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h3>
        <p className="text-gray-500 mb-4">Our support team is here to help you get the most out of LawnDesk.</p>
        <a href="mailto:support@lawndesk.pro">
          <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            📧 Contact Support
          </button>
        </a>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-6 shadow border-2 border-red-100">
        <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-gray-500 mb-4">Once you cancel your subscription you will lose access to all LawnDesk features.</p>
        {!cancelConfirm ? (
          <button
            onClick={() => setCancelConfirm(true)}
            className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            Cancel Subscription
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-red-700 font-semibold text-sm">Are you sure? To cancel, email us and we'll process it within 24 hours.</p>
            <div className="flex gap-3">
              <a href={`mailto:support@lawndesk.pro?subject=Cancel Subscription&body=Please cancel my LawnDesk subscription for ${userEmail}.`}>
                <button className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg cursor-pointer text-sm">
                  📧 Email to Cancel
                </button>
              </a>
              <button
                onClick={() => setCancelConfirm(false)}
                className="border-2 border-gray-300 text-gray-600 font-bold py-2 px-5 rounded-lg cursor-pointer text-sm"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
