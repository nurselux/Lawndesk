'use client'

import { useEffect } from 'react'
import Link from 'next/link'

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
          <h1 className="text-9xl font-bold text-red-600 mb-2">⚠️</h1>
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
            className="bg-green-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-800 transition-colors duration-200"
          >
            🔄 Try Again
          </button>
          <Link href="/">
            <button className="border-2 border-green-700 text-green-700 font-bold py-3 px-8 rounded-lg hover:bg-green-50 transition-colors duration-200">
              🏠 Back to Home
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
