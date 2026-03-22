'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.')
      return
    }
    setDeleteLoading(true)
    const { error } = await supabase.rpc('delete_user')
    if (error) {
      setDeleteError(`Failed to delete account: ${error.message}`)
      setDeleteLoading(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="p-6 pb-24 md:pb-6 bg-gray-50 min-h-screen max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-gray-600 to-gray-800 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">⚙️</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 leading-none">Settings</h2>
          <p className="text-gray-500 text-sm">Manage your account and preferences</p>
        </div>
      </div>

      {/* Account */}
      <div className="bg-amber-50 rounded-2xl p-6 shadow-md mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">👤</span>
          <h3 className="text-lg font-bold text-gray-800">Account</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl w-14 h-14 flex items-center justify-center text-2xl font-bold shadow-md">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800">{userEmail}</p>
            <p className="text-gray-500 text-sm">🌿 LawnDesk Account</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-amber-50 rounded-2xl p-6 shadow-md mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔑</span>
          <h3 className="text-lg font-bold text-gray-800">Change Password</h3>
        </div>
        {pwSuccess && <div className="bg-green-100 text-green-700 font-bold p-3 rounded-xl mb-4">✅ {pwSuccess}</div>}
        {pwError && <div className="bg-red-100 text-red-700 font-bold p-3 rounded-xl mb-4">❌ {pwError}</div>}
        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-gray-300 rounded-xl p-3 text-gray-800"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-300 rounded-xl p-3 text-gray-800"
          />
          <button
            onClick={handleChangePassword}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer w-fit shadow"
          >
            {pwSaving ? '⏳ Saving...' : '🔑 Update Password'}
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-amber-50 rounded-2xl p-6 shadow-md mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💳</span>
          <h3 className="text-lg font-bold text-gray-800">Subscription</h3>
        </div>
        <p className="text-gray-500 mb-4">Manage your LawnDesk subscription and billing.</p>
        <div className="flex gap-4 flex-wrap">
          <Link href="/pricing">
            <button className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow">
              🌿 View Plans
            </button>
          </Link>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="border-2 border-red-300 text-red-500 font-bold py-3 px-6 rounded-xl hover:bg-red-50 hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            🚫 Cancel Subscription
          </button>
        </div>
        {showCancelConfirm && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-gray-800 font-bold mb-1">Cancel your subscription?</p>
            <p className="text-gray-500 text-sm mb-3">
              To cancel, email us at{' '}
              <a href="mailto:support@lawndesk.com?subject=Cancel%20Subscription" className="text-red-600 font-bold hover:underline">
                support@lawndesk.com
              </a>{' '}
              and we'll take care of it within 24 hours. You won't be charged again.
            </p>
            <div className="flex gap-3">
              <a href="mailto:support@lawndesk.com?subject=Cancel%20Subscription&body=Hi%2C%20I%20would%20like%20to%20cancel%20my%20LawnDesk%20subscription.%20My%20email%20is%3A">
                <button className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-red-700 transition cursor-pointer">
                  📧 Email Support
                </button>
              </a>
              <button onClick={() => setShowCancelConfirm(false)} className="border border-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer">
                Never mind
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="bg-amber-50 rounded-2xl p-6 shadow-md mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💬</span>
          <h3 className="text-lg font-bold text-gray-800">Need Help?</h3>
        </div>
        <p className="text-gray-500 mb-4">Our support team is here to help you get the most out of LawnDesk.</p>
        <a href="mailto:support@lawndesk.com">
          <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow">
            📧 Contact Support
          </button>
        </a>
      </div>

      {/* Danger Zone */}
      <div className="bg-amber-50 rounded-2xl p-6 shadow-md border-2 border-red-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⚠️</span>
          <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
        </div>
        <p className="text-gray-500 mb-4">Permanently delete your account and all your data. This cannot be undone.</p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 hover:scale-105 transition-all duration-200 cursor-pointer shadow"
          >
            🗑️ Delete My Account
          </button>
        ) : (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4">
            <p className="text-red-700 font-bold mb-1">This will permanently delete:</p>
            <ul className="text-red-600 text-sm mb-3 space-y-1">
              <li>• All your clients</li>
              <li>• All your jobs</li>
              <li>• All your invoices</li>
              <li>• Your account</li>
            </ul>
            <p className="text-gray-700 text-sm mb-3">Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError('') }}
              placeholder="Type DELETE"
              className="border border-red-300 rounded-lg p-2 text-gray-800 w-full mb-3"
            />
            {deleteError && <p className="text-red-600 text-sm mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? '⏳ Deleting...' : '🗑️ Yes, Delete Everything'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError('') }}
                className="border border-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
