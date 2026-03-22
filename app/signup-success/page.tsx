'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignupSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'

  return (
    <main className="min-h-dvh bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-center">
        {/* Top banner */}
        <div className="bg-green-700 px-6 py-12">
          <div className="text-8xl mb-5">📬</div>
          <h1 className="text-4xl font-bold text-white mb-3">Check Your Email!</h1>
          <p className="text-green-200 text-xl">Your account is almost ready.</p>
        </div>

        {/* Body */}
        <div className="px-8 py-10">
          <p className="text-gray-500 text-base mb-2">We sent a confirmation link to:</p>
          <p className="text-green-700 font-bold text-2xl mb-8 break-all">{email}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left space-y-3">
            <p className="text-gray-800 font-bold text-sm mb-1">What to do next:</p>
            <div className="flex items-start gap-3">
              <span className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <p className="text-gray-600 text-sm">Open your email inbox (including spam/junk)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <p className="text-gray-600 text-sm">Click the <strong>Confirm your email</strong> link in the message from LawnDesk</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <p className="text-gray-600 text-sm">You'll be automatically logged into your new account 🌿</p>
            </div>
          </div>

          <p className="text-gray-400 text-xs mb-8">
            Didn't get the email? It can take up to 2 minutes. Check your spam or junk folder if you don't see it.
          </p>

          <Link href="/login">
            <button className="w-full border-2 border-green-700 text-green-700 font-bold py-3 rounded-lg hover:bg-green-700 hover:text-white transition-all duration-200 cursor-pointer">
              Back to Log In
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense>
      <SignupSuccessContent />
    </Suspense>
  )
}
