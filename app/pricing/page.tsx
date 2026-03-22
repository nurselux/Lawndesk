'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
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
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: '' }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error(error)
    }
    setLoading(null)
  }

  return (
    <main className="min-h-screen bg-gray-100">
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-lg mb-2">No hidden fees. No contracts. Cancel anytime.</p>
          <span className="bg-green-100 text-green-700 font-bold py-2 px-6 rounded-full text-sm">
            🎉 14 Day Free Trial — No Credit Card Required
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-8 shadow border-2 ${plan.color} relative`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-600 text-white text-sm font-bold py-1 px-4 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
              <p className="text-gray-500 mb-4">{plan.description}</p>
              <div className="flex items-end mb-2">
                <span className="text-5xl font-bold text-green-700">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </div>
              <p className="text-green-600 text-sm font-bold mb-6">14 days free then {plan.price}/mo</p>
              <ul className="mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 mb-3 text-gray-600">
                    <span className="text-green-600 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.priceId)}
                className={`w-full font-bold py-3 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer ${
                  plan.popular
                    ? 'bg-green-700 text-white'
                    : 'border-2 border-green-700 text-green-700'
                }`}
              >
                {loading === plan.priceId ? 'Loading...' : 'Start Free Trial'}
              </button>
              <p className="text-center text-gray-400 text-xs mt-3">No credit card required</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}