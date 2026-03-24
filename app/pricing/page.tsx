'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('stripe_customer_id, subscription_status')
          .eq('id', session.user.id)
          .single()
        const active = !!data?.stripe_customer_id &&
          ['trialing', 'active', 'past_due'].includes(data?.subscription_status ?? '')
        setIsSubscribed(active)
      }
    }
    checkUser()
  }, [])

  const plans = [
    {
      name: 'Starter',
      price: '$19',
      period: '/mo',
      description: 'Perfect for solo landscapers',
      features: [
        'Up to 10 clients',
        'Job scheduling',
        'Basic invoicing',
        'Dashboard & reporting',
        'Email support',
      ],
      priceId: 'price_1TDXflC4da9Jmue97LkfChat',
      color: 'border-gray-200',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$39',
      period: '/mo',
      description: 'For serious landscaping businesses',
      features: [
        'Unlimited clients',
        'Job scheduling',
        'Advanced invoicing',
        'Payment processing',
        'Multiple team members',
        'Priority support',
      ],
      priceId: 'price_1TDXsmC4da9Jmue93UnMFCbZ',
      color: 'border-green-500',
      popular: true,
    },
  ]

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
    }
    setLoading(null)
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white">
      <nav className="bg-green-700 text-white p-4 flex justify-between items-center">
        <Link href={isLoggedIn ? '/dashboard' : '/'}>
          <h1 className="text-2xl font-bold cursor-pointer hover:text-green-200 transition-all duration-200">🌿 LawnDesk</h1>
        </Link>
        <button
          onClick={() => router.push('/login')}
          className="text-sm bg-white text-green-700 font-bold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          Login
        </button>
      </nav>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-lg mb-2">No hidden fees. No contracts. Cancel anytime.</p>
          <span className="bg-green-100 text-green-700 font-bold py-2 px-6 rounded-full text-sm">
            🎉 14 Day Free Trial — No Credit Card Required
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          {/* Starter */}
          <div className="relative rounded-2xl p-px bg-gradient-to-br from-green-300 via-emerald-200 to-teal-300 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-white rounded-2xl p-8 text-left h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-100 text-emerald-700 text-2xl w-12 h-12 rounded-xl flex items-center justify-center">🌱</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 leading-none">{plans[0].name}</h3>
                  <p className="text-gray-400 text-sm">{plans[0].description}</p>
                </div>
              </div>
              <div className="flex items-end mb-1">
                <span className="text-5xl font-bold text-green-700">{plans[0].price}</span>
                <span className="text-gray-500 ml-1">{plans[0].period}</span>
              </div>
              <p className="text-green-600 text-sm font-bold mb-6">14 days free then {plans[0].price}/mo</p>
              <ul className="mb-8 flex-1">
                {plans[0].features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 mb-3 text-gray-600">
                    <span className="text-green-600 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {isSubscribed ? (
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl cursor-pointer"
                >
                  Manage Subscription →
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plans[0].priceId)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-md"
                >
                  {loading === plans[0].priceId ? 'Loading...' : 'Start Free Trial'}
                </button>
              )}
              <p className="text-center text-gray-400 text-xs mt-3">Cancel anytime</p>
            </div>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl p-px bg-gradient-to-br from-green-500 via-green-600 to-teal-500 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-8 text-left h-full flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-extrabold py-1 px-4 rounded-full shadow-md tracking-wide uppercase">Most Popular</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">🌿</div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-none">{plans[1].name}</h3>
                  <p className="text-green-300 text-sm">{plans[1].description}</p>
                </div>
              </div>
              <div className="flex items-end mb-1">
                <span className="text-5xl font-bold text-white">{plans[1].price}</span>
                <span className="text-green-300 ml-1">{plans[1].period}</span>
              </div>
              <p className="text-green-300 text-sm font-bold mb-6">14 days free then {plans[1].price}/mo</p>
              <ul className="mb-8 flex-1">
                {plans[1].features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 mb-3 text-green-100">
                    <span className="text-green-300 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {isSubscribed ? (
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full bg-white/20 text-white font-bold py-3 rounded-xl cursor-pointer"
                >
                  Manage Subscription →
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plans[1].priceId)}
                  className="w-full bg-white text-green-800 font-bold py-3 rounded-xl hover:bg-green-50 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-md"
                >
                  {loading === plans[1].priceId ? 'Loading...' : 'Start Free Trial'}
                </button>
              )}
              <p className="text-center text-green-400 text-xs mt-3">Cancel anytime</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
