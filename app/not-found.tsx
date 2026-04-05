'use client'

import Link from 'next/link'
import { Home, BarChart2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-green-700 mb-2">404</h1>
          <p className="text-2xl font-bold text-gray-800">Page Not Found</p>
        </div>

        <div className="mb-8 max-w-md mx-auto">
          <p className="text-gray-600 text-lg mb-4">
            Looks like this lawn hasn't been mapped out yet. Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <button className="bg-green-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-800 transition-colors duration-200 flex items-center gap-2">
              <Home className="w-4 h-4" aria-hidden="true" /> Back to Home
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="border-2 border-green-700 text-green-700 font-bold py-3 px-8 rounded-lg hover:bg-green-50 transition-colors duration-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" aria-hidden="true" /> Go to Dashboard
            </button>
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-gray-500 text-sm">
            If you think this is a mistake,{' '}
            <a href="mailto:support@lawndesk.pro" className="text-green-700 font-semibold hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
