'use client'

import { CheckCircle, Zap, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function PricingSection() {
  const [aiAddOn, setAiAddOn] = useState(false)

  const plans = [
    {
      name: 'Starter',
      price: 19,
      description: 'Everything you need to run your business',
      badge: null,
      features: [
        { text: 'Unlimited clients', included: true },
        { text: 'Job scheduling', included: true },
        { text: 'Invoicing & payments', included: true },
        { text: 'Quote sending', included: true },
        { text: 'Client portal', included: true },
      ],
      ctaClass: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500',
    },
    {
      name: 'Pro',
      price: 39,
      description: 'For growing crews & serious businesses',
      badge: 'Most Popular',
      features: [
        { text: 'Everything in Starter', included: true },
        { text: 'Unlimited team members', included: true },
        { text: 'Worker app + "On My Way" alerts', included: true },
        { text: 'Online booking page (your URL)', included: true },
        { text: 'Recurring job automation', included: true },
        { text: 'SMS notifications to clients & crew', included: true },
      ],
      ctaClass: 'bg-white text-emerald-700 hover:bg-emerald-50',
      highlight: true,
    },
  ]

  const proPrice = aiAddOn ? 39 + 15 : 39

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Simple, Transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
              Pricing
            </span>
          </h2>
          <p className="text-gray-500 text-lg">
            No hidden fees. No contracts. Cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.highlight
                  ? 'bg-gradient-to-br from-[#0d3320] to-emerald-900'
                  : 'bg-gradient-to-br from-emerald-300 via-emerald-200 to-teal-300'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-extrabold py-2 px-5 rounded-full shadow-lg tracking-wide uppercase border-2 border-yellow-300">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className={`p-8 ${plan.highlight ? 'text-white' : ''}`}>
                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-4xl sm:text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-800'}`}>
                      ${plan.highlight && aiAddOn ? proPrice : plan.price}
                    </div>
                    <span className={`text-lg ${plan.highlight ? 'text-emerald-200' : 'text-gray-400'}`}>
                      /mo
                    </span>
                  </div>
                  <h3 className={`text-2xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-800'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlight ? 'text-emerald-300' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className={`flex items-start gap-3 ${plan.highlight ? 'text-white' : 'text-gray-700'}`}>
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${feature.included ? (plan.highlight ? 'text-emerald-300' : 'text-emerald-600') : (plan.highlight ? 'text-emerald-600/40' : 'text-gray-400')}`} aria-hidden="true" />
                      <span className="text-base leading-relaxed">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/login?signup=true"
                  className={`group inline-flex items-center gap-2.5 w-full justify-center font-bold py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${plan.ctaClass}`}
                >
                  Try Free for 14 Days
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <p className={`text-center text-xs mt-2 ${plan.highlight ? 'text-emerald-400' : 'text-gray-400'}`}>
                  Cancel anytime
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Add-on toggle */}
        <div className="max-w-md mx-auto">
          <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
            <div className="flex items-start gap-4">
              {/* Toggle */}
              <button
                onClick={() => setAiAddOn(!aiAddOn)}
                className={`flex-shrink-0 relative w-14 h-8 rounded-full transition-all duration-300 ${
                  aiAddOn ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gray-700'
                }`}
                aria-label="Toggle AI Receptionist add-on"
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ${
                    aiAddOn ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      aiAddOn ? 'bg-white' : 'bg-gray-900'
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 ${aiAddOn ? 'text-emerald-600' : 'text-gray-500'}`} aria-hidden="true" />
                  </div>
                </div>
              </button>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                  <h3 className="text-white font-bold text-lg">AI Receptionist Add-On</h3>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  AI answers calls, texts inquiries, and qualifies leads 24/7.
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl sm:text-3xl font-extrabold ${aiAddOn ? 'text-emerald-400' : 'text-gray-500'}`}>
                    +$15
                  </span>
                  <span className="text-gray-400">/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
          >
            See full pricing details
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
