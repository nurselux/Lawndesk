'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle, ArrowRight, Zap, Leaf,
  Users, Calendar, FileText, RefreshCw, Smartphone,
  MessageSquare, LayoutDashboard, Shield, Star,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STARTER_PRICE_ID = 'price_1TDXflC4da9Jmue97LkfChat'
const PRO_PRICE_ID = 'price_1TDXsmC4da9Jmue93UnMFCbZ'

const STARTER_FEATURES = [
  { icon: Users,          text: 'Unlimited clients' },
  { icon: Calendar,       text: 'Unlimited job scheduling' },
  { icon: FileText,       text: 'Invoicing & online payments' },
  { icon: FileText,       text: 'Quote sending & client approvals' },
  { icon: MessageSquare,  text: 'SMS invoice & job completion texts' },
  { icon: LayoutDashboard,text: 'Client portal' },
  { icon: LayoutDashboard,text: 'Dashboard & reports' },
  { icon: Shield,         text: "Today's route optimization" },
  { icon: Smartphone,     text: 'Mobile-friendly — works on any phone' },
  { icon: MessageSquare,  text: 'Email support' },
]

const PRO_FEATURES = [
  { icon: CheckCircle,    text: 'Everything in Starter' },
  { icon: Users,          text: 'Unlimited team members & worker app' },
  { icon: Calendar,       text: 'Online booking page (your custom URL)' },
  { icon: RefreshCw,      text: 'Recurring job automation' },
  { icon: Star,           text: 'Automated Google review requests' },
  { icon: Zap,            text: 'AI Receptionist — answers calls 24/7' },
]

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every new account gets a 14-day free trial with full access to all Pro features. No credit card required.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. No contracts, no cancellation fees. Cancel your subscription at any time from your account settings.',
  },
  {
    q: 'How do recurring jobs work?',
    a: 'When scheduling a job, choose weekly, biweekly, or monthly. LawnDesk automatically creates all upcoming jobs for the next 3 months.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards through Stripe. Your payment information is encrypted and secure.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes! Upgrade or downgrade at any time from your account settings. Changes take effect immediately.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'No credit card required to start your 14-day free trial. Full Pro access from day one.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. Industry-standard encryption and security practices. Your data is stored securely in Supabase PostgreSQL databases.',
  },
  {
    q: 'What is the AI Receptionist?',
    a: 'The AI Receptionist is included with the Pro plan. It answers calls and texts 24/7, qualifies leads, and sends clients a booking link — so you never miss a job even while you\'re in the field.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 cursor-pointer group"
        aria-expanded={open}
      >
        <span className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
          {q}
        </span>
        {open
          ? <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-emerald-600 transition-colors duration-200" aria-hidden="true" />
        }
      </button>
      {open && (
        <p className="pb-5 text-gray-600 leading-relaxed text-base">{a}</p>
      )}
    </div>
  )
}

const REASON_BANNERS: Record<string, { title: string; body: string; color: string }> = {
  expired:        { title: 'Your subscription has expired.', body: 'Reactivate your plan below to get back to your dashboard and all your data.', color: 'bg-red-50 border-red-300 text-red-800' },
  cancelled:      { title: 'Your subscription was cancelled.', body: 'Choose a plan below to reactivate your account. All your data is still here.', color: 'bg-red-50 border-red-300 text-red-800' },
  past_due:       { title: 'Your last payment failed.', body: 'Subscribe again below to restore access. Your data is safe.', color: 'bg-amber-50 border-amber-300 text-amber-800' },
  trial_ended:    { title: 'Your free trial has ended.', body: 'You had full Pro access during your trial. Pick a plan below to keep going.', color: 'bg-blue-50 border-blue-300 text-blue-800' },
  no_subscription:{ title: 'Choose a plan to get started.', body: 'Select a plan below to unlock your dashboard.', color: 'bg-green-50 border-green-300 text-green-800' },
}

function PricingContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const banner = reason ? REASON_BANNERS[reason] ?? null : null
  const isReturning = !!reason  // returning user — no trial messaging

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push(`/login?signup=true&redirect=/pricing`)
        setLoading(null)
        return
      }
      const email = session.user.email || ''
      const userId = session.user.id || ''
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email, userId }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-dvh bg-gray-50">
      {/* Subscription-wall banner */}
      {banner && (
        <div className={`border-b-2 ${banner.color} px-4 py-4`}>
          <div className="max-w-3xl mx-auto flex items-start gap-3">
            <div className="text-2xl">🔒</div>
            <div>
              <p className="font-bold text-base">{banner.title}</p>
              <p className="text-sm mt-0.5 opacity-80">{banner.body}</p>
            </div>
          </div>
        </div>
      )}
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0d3320]/95 backdrop-blur-md shadow-lg border-b border-emerald-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
              <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg p-2 shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Leaf className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-white text-xl font-bold tracking-tight">LawnDesk</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/pricing" className="text-emerald-100 hover:text-white font-medium transition-colors duration-200">
                Pricing
              </Link>
              <Link href="/login" className="text-emerald-100 hover:text-white font-medium transition-colors duration-200">
                Sign In
              </Link>
              {isReturning ? (
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-2.5 px-6 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 cursor-pointer"
                >
                  Sign In
                </Link>
              ) : (
                <Link
                  href="/login?signup=true"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-2.5 px-6 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 cursor-pointer"
                >
                  Start Free Trial
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a4d3e] via-[#0d3320] to-[#14532d] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {!isReturning && (
            <div className="inline-flex items-center gap-2 bg-yellow-400/90 backdrop-blur-sm rounded-full px-5 py-2 mb-8 shadow-lg border border-yellow-300">
              <Leaf className="w-4 h-4 text-yellow-900" aria-hidden="true" />
              <span className="text-yellow-900 text-xs font-black tracking-wide uppercase">
                14-Day Free Trial · No Credit Card Required
              </span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Simple, Transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">
              Pricing
            </span>
          </h1>
          <p className="text-emerald-200 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            No hidden fees. No contracts. Cancel anytime. Join 500+ lawn care businesses already on LawnDesk.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

          {/* Starter */}
          <div className="relative rounded-3xl overflow-hidden bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="p-8 flex flex-col h-full">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-4">
                  <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide">Starter</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-6xl font-black text-gray-900">$19</span>
                  <span className="text-gray-400 text-lg mb-2">/mo</span>
                </div>
                <p className="text-gray-500 text-base">Everything you need to run your business</p>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {STARTER_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{f.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(STARTER_PRICE_ID)}
                disabled={!!loading}
                className="w-full bg-gray-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading === STARTER_PRICE_ID ? (
                  <span className="animate-pulse">Loading…</span>
                ) : isReturning ? (
                  <>Subscribe — $19/mo<ArrowRight className="w-5 h-5" aria-hidden="true" /></>
                ) : (
                  <>Try Free for 14 Days<ArrowRight className="w-5 h-5" aria-hidden="true" /></>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Cancel anytime</p>
            </div>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0d3320] to-emerald-900 border-2 border-emerald-600/50 shadow-2xl shadow-emerald-900/30 hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col mt-4">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-extrabold py-2 px-5 rounded-full shadow-lg tracking-wide uppercase border-2 border-yellow-300">
                Most Popular
              </span>
            </div>

            <div className="p-8 pt-10 flex flex-col h-full">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-700/50 rounded-full px-4 py-1.5 mb-4">
                  <span className="text-emerald-300 text-xs font-bold uppercase tracking-wide">Pro</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-6xl font-black text-white">
                    $39
                  </span>
                  <span className="text-emerald-300 text-lg mb-2">/mo</span>
                </div>
                <p className="text-emerald-300 text-base">For growing crews &amp; serious businesses</p>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-white">
                    <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{f.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(PRO_PRICE_ID)}
                disabled={!!loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 text-green-900 font-black py-4 px-6 rounded-xl hover:from-yellow-300 hover:to-amber-300 transition-all duration-200 shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading === PRO_PRICE_ID ? (
                  <span className="animate-pulse">Loading…</span>
                ) : isReturning ? (
                  <>Subscribe — $39/mo<ArrowRight className="w-5 h-5" aria-hidden="true" /></>
                ) : (
                  <>Try Free for 14 Days<ArrowRight className="w-5 h-5" aria-hidden="true" /></>
                )}
              </button>
              <p className="text-center text-xs text-emerald-400 mt-2">Cancel anytime</p>
            </div>
          </div>
        </div>

        {/* Social proof strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {[
            { value: '500+', label: 'Businesses' },
            { value: '98%', label: 'Satisfaction' },
            { value: '$1,320', label: 'Saved vs Jobber/yr' },
            { value: '14-day', label: 'Free Trial' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
              <div className="text-3xl font-black text-emerald-700 mb-1">{s.value}</div>
              <div className="text-gray-500 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Jobber Comparison */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-yellow-400 rounded-full px-5 py-2 mb-5 shadow-lg">
              <span className="text-yellow-900 text-sm font-black uppercase tracking-wide">💰 Save up to $1,320/year vs Jobber</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              Why Landscapers Are{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                Switching from Jobber
              </span>
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">Same features. A fraction of the price. Plus an AI Receptionist Jobber doesn't offer at any tier.</p>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-3xl shadow-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="bg-gray-50 text-left px-6 py-5 font-bold text-gray-600 text-base w-2/5">Feature</th>
                  <th className="bg-gradient-to-b from-[#0d3320] to-emerald-900 px-4 py-5 text-center relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">Best Value</div>
                    <div className="text-white font-black text-base">LawnDesk Pro</div>
                    <div className="text-emerald-300 font-bold text-xl mt-1">$39<span className="text-sm font-normal">/mo</span></div>
                  </th>
                  <th className="bg-gray-50 px-4 py-5 text-center border-l border-gray-200">
                    <div className="text-gray-500 font-bold text-base">Jobber Core</div>
                    <div className="text-gray-400 font-bold text-xl mt-1">$49<span className="text-sm font-normal">/mo</span></div>
                  </th>
                  <th className="bg-gray-50 px-4 py-5 text-center border-l border-gray-200">
                    <div className="text-gray-500 font-bold text-base">Jobber Connect</div>
                    <div className="text-gray-400 font-bold text-xl mt-1">$149<span className="text-sm font-normal">/mo</span></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Clients, Jobs & Scheduling',     ld: true,  jCore: true,  jConnect: true  },
                  { feature: 'Invoicing & Online Payments',    ld: true,  jCore: true,  jConnect: true  },
                  { feature: 'Quote Sending & Approvals',      ld: true,  jCore: true,  jConnect: true  },
                  { feature: "Today's Route Optimization",     ld: true,  jCore: true,  jConnect: true  },
                  { feature: 'SMS Notifications to Clients',   ld: true,  jCore: false, jConnect: true  },
                  { feature: 'Team Management & Worker App',   ld: true,  jCore: false, jConnect: true  },
                  { feature: 'Online Booking Page',            ld: true,  jCore: false, jConnect: true  },
                  { feature: 'Recurring Job Automation',       ld: true,  jCore: false, jConnect: true  },
                  { feature: 'Automated Google Review Texts',  ld: true,  jCore: false, jConnect: false },
                  { feature: 'AI Receptionist (24/7)',         ld: true,  jCore: false, jConnect: false },
                ].map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-4 font-medium text-gray-700">{row.feature}</td>
                    <td className="px-4 py-4 text-center bg-emerald-50/40 border-l-2 border-r-2 border-emerald-200">
                      {row.ld
                        ? <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-500 rounded-full text-white font-black text-base">✓</span>
                        : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 rounded-full text-gray-400 font-black text-base">✕</span>}
                    </td>
                    <td className="px-4 py-4 text-center border-l border-gray-100">
                      {row.jCore
                        ? <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-300 rounded-full text-gray-600 font-black text-base">✓</span>
                        : <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 rounded-full text-red-400 font-black text-base">✕</span>}
                    </td>
                    <td className="px-4 py-4 text-center border-l border-gray-100">
                      {row.jConnect
                        ? <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-300 rounded-full text-gray-600 font-black text-base">✓</span>
                        : <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 rounded-full text-red-400 font-black text-base">✕</span>}
                    </td>
                  </tr>
                ))}
                {/* Price row */}
                <tr className="border-t-2 border-gray-200">
                  <td className="px-6 py-5 font-black text-gray-900 text-base">Monthly Cost</td>
                  <td className="px-4 py-5 text-center bg-emerald-50/40 border-l-2 border-r-2 border-emerald-200">
                    <span className="text-2xl font-black text-emerald-700">$39</span>
                  </td>
                  <td className="px-4 py-5 text-center border-l border-gray-100">
                    <span className="text-2xl font-black text-gray-400 line-through">$49</span>
                  </td>
                  <td className="px-4 py-5 text-center border-l border-gray-100">
                    <span className="text-2xl font-black text-gray-400 line-through">$149</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Savings callout */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-6 text-white text-center shadow-lg">
              <div className="text-4xl font-black mb-1">$120</div>
              <div className="text-emerald-200 text-sm font-semibold">Saved per year vs Jobber Core</div>
            </div>
            <div className="bg-gradient-to-br from-[#0d3320] to-emerald-900 rounded-2xl p-6 text-white text-center shadow-xl ring-2 ring-yellow-400">
              <div className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-1">Best Comparison</div>
              <div className="text-4xl font-black mb-1">$1,320</div>
              <div className="text-emerald-300 text-sm font-semibold">Saved per year vs Jobber Connect</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-6 text-white text-center shadow-lg">
              <div className="text-4xl font-black mb-1">Priceless</div>
              <div className="text-emerald-200 text-sm font-semibold">AI Receptionist — not on Jobber at any price</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto" id="faq">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              Frequently Asked{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                Questions
              </span>
            </h2>
            <p className="text-gray-500 text-base">Everything you need to know before you start.</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-2">
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 bg-gradient-to-br from-[#0d3320] to-emerald-900 rounded-3xl p-10 sm:p-14 text-center shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Ready to Grow Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">
                Lawn Business?
              </span>
            </h2>
            <p className="text-emerald-200 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Start your 14-day free trial. Full Pro access. No credit card required.
            </p>
            <Link
              href="/login?signup=true"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-400 text-green-900 font-black py-4 px-10 rounded-2xl text-lg hover:from-yellow-300 hover:to-amber-300 transition-all duration-300 shadow-2xl hover:shadow-yellow-400/40 hover:-translate-y-1 cursor-pointer"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
            </Link>
            <p className="text-emerald-400 text-sm mt-4">No commitment · Cancel anytime · Full Pro access</p>
          </div>
        </div>

      </div>
    </main>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  )
}
