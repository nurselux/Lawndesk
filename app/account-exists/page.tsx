'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AccountExistsContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'

  return (
    <main className="min-h-screen bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-center">
        {/* Top banner */}
        <div className="bg-amber-500 px-6 py-12">
          <div className="text-8xl mb-5">👋</div>
          <h1 className="text-4xl font-bold text-white mb-3">You're Already In!</h1>
          <p className="text-amber-100 text-xl">This email already has a LawnDesk account.</p>
        </div>

        {/* Body */}
        <div className="px-8 py-10">
          <p className="text-gray-500 text-base mb-2">An account already exists for:</p>
          <p className="text-green-700 font-bold text-2xl mb-8 break-all">{email}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left space-y-3">
            <p className="text-gray-800 font-bold text-sm mb-1">What would you like to do?</p>
            <div className="flex items-start gap-3">
              <span className="text-amber-500 font-bold text-lg shrink-0">→</span>
              <p className="text-gray-600 text-sm">Log in with your existing password below</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-amber-500 font-bold text-lg shrink-0">→</span>
              <p className="text-gray-600 text-sm">Use "Forgot Password" if you can't remember it</p>
            </div>
          </div>

          <Link href={`/login?email=${encodeURIComponent(email)}`}>
            <button className="w-full bg-green-700 text-white font-bold py-4 rounded-lg hover:bg-green-800 transition-all duration-200 cursor-pointer text-lg mb-3">
              Log In to My Account
            </button>
          </Link>
          <Link href="/forgot-password">
            <button className="w-full border-2 border-gray-200 text-gray-500 font-semibold py-3 rounded-lg hover:border-green-700 hover:text-green-700 transition-all duration-200 cursor-pointer">
              🔑 Forgot My Password
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function AccountExistsPage() {
  return (
    <Suspense>
      <AccountExistsContent />
    </Suspense>
  )
}
