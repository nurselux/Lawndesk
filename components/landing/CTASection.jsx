import Link from 'next/link'
import { ArrowRight, Leaf, Zap } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0d3320] to-emerald-900 text-white py-24 px-4 sm:px-6 lg:px-8">
      {/* Radial glow effect */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-400/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-green-300/10 via-transparent to-transparent rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Leaf icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-full p-6 shadow-2xl shadow-emerald-500/40 animate-float-icon">
            <Leaf className="w-12 h-12 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Oversized headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
          Ready to Transform{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">
            Your Lawn Business?
          </span>
        </h2>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-emerald-200 mb-10 max-w-3xl mx-auto leading-relaxed">
          Join 500+ businesses saving time, growing revenue, and running smoother operations with LawnDesk.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { icon: Zap, text: 'Start free for 14 days' },
            { icon: Zap, text: 'No credit card required' },
            { icon: Zap, text: 'Setup in 5 minutes' },
          ].map((benefit) => (
            <div
              key={benefit.text}
              className="flex items-center gap-2 bg-emerald-800/40 backdrop-blur-sm rounded-full px-5 py-2.5 border border-emerald-600/30"
            >
              <benefit.icon className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-100 font-medium">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="space-y-4">
          <Link
            href="/login?signup=true"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-400 text-green-900 font-black py-5 px-10 rounded-2xl text-xl sm:text-2xl hover:from-yellow-300 hover:to-amber-300 transition-all duration-300 shadow-2xl hover:shadow-yellow-400/50 hover:-translate-y-1 cursor-pointer"
          >
            Start Your Free Trial Now
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
          <p className="text-emerald-300 text-base">
            No commitment · Cancel anytime · Full access to Pro features
          </p>
        </div>
      </div>
    </section>
  )
}
