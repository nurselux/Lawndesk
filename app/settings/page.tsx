'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    if (user) setUserEmail(user.email || '')
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Settings</h2>

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

      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Subscription</h3>
        <p className="text-gray-500 mb-4">Manage your LawnDesk subscription and billing.</p>
        <div className="flex gap-4">
          <Link href="/pricing">
            <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              View Plans
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h3>
        <p className="text-gray-500 mb-4">Our support team is here to help you get the most out of LawnDesk.</p>
        <a href="mailto:support@lawndesk.com">
          <button className="bg-green-700 text-white font-bold py-3 px-6 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            📧 Contact Support
          </button>
        </a>
      </div>

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