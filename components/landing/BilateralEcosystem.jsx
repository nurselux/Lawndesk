import { Shield, Smartphone, Calendar, FileText, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BilateralEcosystem() {
  const roles = [
    {
      title: 'Admin / Owner',
      subtitle: 'You run the show',
      bgClass: 'bg-white',
      textClass: 'text-gray-900',
      cardBg: 'bg-gradient-to-br from-gray-50 to-white',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      features: [
        { icon: Shield, text: 'Full control over all business operations' },
        { icon: Calendar, text: 'Schedule jobs, send invoices, manage crew' },
        { icon: FileText, text: 'View analytics and track performance' },
      ],
      ctaText: 'Manage Your Business',
      ctaLink: '/login?signup=true',
    },
    {
      title: 'Workers',
      subtitle: 'Your team in the field',
      bgClass: 'bg-gradient-to-br from-[#0d3320] to-emerald-900',
      textClass: 'text-white',
      cardBg: 'bg-emerald-900/30',
      iconBg: 'bg-emerald-600',
      iconColor: 'text-white',
      features: [
        { icon: Smartphone, text: 'Clock in/out from job sites' },
        { icon: CheckCircle, text: 'See assigned jobs and route info' },
        { icon: Calendar, text: 'Add notes and photos before/after' },
      ],
      ctaText: 'Your Worker App',
      ctaLink: '/login?signup=true',
    },
  ]

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Designed for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
              Everyone
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Whether you're running the business or working in the field, LawnDesk has you covered.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {roles.map((role) => (
            <div
              key={role.title}
              className={`${role.bgClass} rounded-3xl shadow-xl overflow-hidden border-2 ${role.bgClass === 'bg-white' ? 'border-gray-100' : 'border-emerald-700/30'}`}
            >
              {/* Content */}
              <div className={`p-8 sm:p-10 ${role.cardBg}`}>
                {/* Role header */}
                <div className="mb-8">
                  <h3 className={`text-2xl sm:text-3xl font-black mb-2 ${role.textClass}`}>
                    {role.title}
                  </h3>
                  <p className={`text-lg font-medium ${role.textClass === 'text-white' ? 'text-emerald-200' : 'text-gray-500'}`}>
                    {role.subtitle}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {role.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-4">
                      <div className={`${role.iconBg} rounded-xl p-3 flex-shrink-0`}>
                        <feature.icon className={`w-6 h-6 ${role.iconColor}`} aria-hidden="true" />
                      </div>
                      <span className={`text-base ${role.textClass === 'text-white' ? 'text-emerald-100' : 'text-gray-700'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={role.ctaLink}
                  className={`group inline-flex items-center gap-2.5 w-full justify-center font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 ${
                    role.bgClass === 'bg-white'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:from-emerald-500 hover:to-green-600'
                      : 'bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {role.ctaText}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
