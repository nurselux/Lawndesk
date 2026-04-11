'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { usePlan } from '../lib/usePlan'

interface ProGateProps {
  /** Feature name shown in the lock banner */
  featureName: string
  /** One-line description of the feature */
  description: string
  /** If true, renders a full-page lock wall instead of an inline banner */
  page?: boolean
  /** Content to render when user has Pro access */
  children: React.ReactNode
}

/**
 * Wraps Pro-only content. Shows an upgrade prompt to Starter users,
 * renders children normally for Pro users and trial users.
 */
export default function ProGate({ featureName, description, page, children }: ProGateProps) {
  const { isPro, checking } = usePlan()

  if (checking) return null
  if (isPro) return <>{children}</>

  if (page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-green-700" />
          </div>
          <span className="inline-block bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
            Pro Feature
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{featureName}</h2>
          <p className="text-gray-500 mb-8">{description}</p>
          <Link href="/upgrade">
            <button className="w-full bg-green-700 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-800 transition-colors cursor-pointer">
              Upgrade to Pro →
            </button>
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            $39/mo · Cancel anytime
          </p>
        </div>
      </div>
    )
  }

  // Inline lock banner
  return (
    <div className="rounded-xl border-2 border-dashed border-green-200 bg-green-50 p-5 flex items-start gap-4">
      <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Lock className="w-4 h-4 text-green-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Pro Feature</span>
        </div>
        <p className="font-semibold text-gray-800 text-sm">{featureName}</p>
        <p className="text-gray-500 text-sm mt-0.5">{description}</p>
        <Link href="/upgrade">
          <button className="mt-3 bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-green-800 transition-colors cursor-pointer">
            Upgrade to Pro →
          </button>
        </Link>
      </div>
    </div>
  )
}
