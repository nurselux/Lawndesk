'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function JoinPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="min-h-dvh bg-green-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
        <Link href="/"><h1 className="text-2xl font-bold text-green-700 mb-1 hover:opacity-70 transition-opacity cursor-pointer">🌿 LawnDesk</h1></Link>
        <p className="text-gray-400 text-sm mb-8">Less paperwork, more yardwork</p>

        <p className="text-4xl mb-4">👷</p>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Account Not Linked Yet</h2>
        <p className="text-gray-500 mb-6">
          Your account is set up, but you haven't been connected to a team.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
          <p className="font-bold text-green-800 text-sm mb-2">Are you a worker?</p>
          <p className="text-green-700 text-sm">Ask your employer to send you the invite link from their Team page. Use that link to connect your account.</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
          <p className="font-bold text-gray-800 text-sm mb-2">Are you a business owner?</p>
          <p className="text-gray-500 text-sm">Start a free 14-day trial to get full access.</p>
          <Link href="/pricing">
            <button className="mt-3 w-full bg-green-700 text-white font-bold py-2.5 rounded-xl hover:bg-green-800 transition cursor-pointer text-sm">
              Start Free Trial →
            </button>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-400 text-sm hover:text-gray-600 transition cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
