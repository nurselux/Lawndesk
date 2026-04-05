import Link from 'next/link'
import { ArrowRight, CheckCircle, Leaf, Smartphone, Zap, Shield } from 'lucide-react'

export default function HeroSection() {
  const stats = [
    { value: '500+', label: 'Businesses' },
    { value: '98%', label: 'Satisfaction' },
    { value: '14-day', label: 'Free Trial' },
    { value: '60%', label: 'Cheaper than Jobber' },
  ]

  const proofs = [
    { icon: CheckCircle, text: 'No credit card required' },
    { icon: Shield, text: 'Cancel anytime' },
    { icon: Zap, text: 'Setup in 5 minutes' },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a4d3e] via-[#0d3320] to-[#14532d] text-white">
      {/* Dot grid overlay */}
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />
      {/* Radial glow blobs */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-green-300/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-400/90 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-lg border border-yellow-300">
              <Leaf className="w-7 h-7 text-yellow-900" aria-hidden="true" />
              <span className="text-yellow-900 text-xs sm:text-sm font-black tracking-wide uppercase font-bold">
                Built for Lawn & Landscaping Businesses
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight">
                Run Your Lawn Business{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">
                  Like a Pro
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-emerald-200 font-medium leading-relaxed">
                Less paperwork, more yardwork.
              </p>
              <p className="text-emerald-100 text-base sm:text-lg leading-relaxed max-w-xl">
                Schedule jobs, send quotes, collect payments, and manage your whole crew — all from your phone.
              </p>
            </div>

            {/* CTA + Proofs */}
            <div className="space-y-6">
              <Link
                href="/login?signup=true"
                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-green-900 font-black py-4 px-8 rounded-2xl text-lg sm:text-xl hover:from-yellow-300 hover:to-amber-300 transition-all duration-300 shadow-2xl hover:shadow-yellow-400/40 hover:-translate-y-1 cursor-pointer"
              >
                Try Free for 14 Days
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>

              {/* Proof chips */}
              <div className="flex flex-wrap gap-3">
                {proofs.map((proof) => (
                  <div
                    key={proof.text}
                    className="flex items-center gap-2 bg-emerald-900/40 backdrop-blur-sm border border-emerald-600/30 rounded-full px-4 py-2"
                  >
                    <proof.icon className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-200 text-sm font-medium">{proof.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white font-medium transition-colors duration-200"
              >
                See pricing plans
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right content - Hero image with gradient bleed */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="relative">
              {/* Gradient bleed from left */}
              <div className="absolute -left-16 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0d3320] to-transparent opacity-60" />

              <div className="relative z-10 animate-fade-in-right">
                <img
                  src="/hero-mockup.svg"
                  alt="LawnDesk dashboard on laptop and phone"
                  className="w-full drop-shadow-2xl rounded-2xl"
                  style={{
                    maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                  }}
                />
              </div>
            </div>

            {/* Floating badge — below image, not overlapping */}
            <div className="self-end mr-4 bg-white rounded-2xl shadow-2xl p-4 max-w-xs animate-float">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                <span className="text-gray-900 font-bold text-sm">Mobile First</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Works perfectly on any smartphone or tablet between jobs
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-16 pt-12 border-t border-emerald-700/30">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`text-center px-4 py-2 ${i < stats.length - 1 ? 'sm:border-r border-emerald-700/30' : ''}`}>
              <div className="text-3xl sm:text-5xl font-black text-white mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
