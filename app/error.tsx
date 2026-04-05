'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4"><AlertTriangle className="w-24 h-24 text-red-600" aria-hidden="true" /></div>
          <p className="text-2xl font-bold text-gray-800">Something went wrong</p>
        </div>

        <div className="mb-8 max-w-md mx-auto">
          <p className="text-gray-600 text-lg mb-4">
            We encountered an unexpected error. Our team has been notified.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-200 mb-4 text-left">
              <strong>Error:</strong> {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="bg-green-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-800 transition-colors duration-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try Again
          </button>
          <Link href="/">
            <button className="border-2 border-green-700 text-green-700 font-bold py-3 px-8 rounded-lg hover:bg-green-50 transition-colors duration-200 flex items-center gap-2">
              <Home className="w-4 h-4" aria-hidden="true" /> Back to Home
            </button>
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-gray-500 text-sm">
            Need help?{' '}
            <a href="mailto:support@lawndesk.pro" className="text-green-700 font-semibold hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
