'use client'

import Link from 'next/link'
import { Leaf, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-[#0d3320]/95 backdrop-blur-md shadow-lg border-b border-emerald-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg p-2 shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Leaf className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">LawnDesk</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-emerald-100 hover:text-white font-medium transition-colors duration-200">
              Pricing
            </Link>
            <Link href="/login" className="text-emerald-100 hover:text-white font-medium transition-colors duration-200">
              Sign In
            </Link>
            <Link
              href="/login?signup=true"
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-2.5 px-6 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-emerald-100 hover:text-white p-2 rounded-lg hover:bg-emerald-800/30 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-6 space-y-3 border-t border-emerald-800/30">
            <Link
              href="/pricing"
              className="block text-emerald-100 hover:text-white font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="block text-emerald-100 hover:text-white font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/login?signup=true"
              className="block bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 px-6 rounded-xl text-center shadow-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Free Trial
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
