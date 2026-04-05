import { Users, Calendar, FileText, RefreshCw, Smartphone, MessageSquare, LayoutDashboard, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function FeaturesSection() {
  const features = [
    {
      title: 'Client Management',
      description: 'Store client info, gate codes, and contact details all in one place. Quick access from any job.',
      icon: Users,
      color: 'blue',
      bgTint: 'from-blue-50 to-indigo-50',
      iconGradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Job Scheduling',
      description: 'Schedule one-time or recurring jobs and track their status in real-time. Your whole crew stays synced.',
      icon: Calendar,
      color: 'orange',
      bgTint: 'from-orange-50 to-amber-50',
      iconGradient: 'from-orange-500 to-amber-600',
    },
    {
      title: 'Invoicing & Payments',
      description: 'Create and send invoices in seconds. Track who owes you and get paid online automatically.',
      icon: FileText,
      color: 'green',
      bgTint: 'from-emerald-50 to-green-50',
      iconGradient: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Recurring Jobs',
      description: 'Set weekly, biweekly, or monthly jobs. LawnDesk generates all instances automatically.',
      icon: RefreshCw,
      color: 'purple',
      bgTint: 'from-purple-50 to-fuchsia-50',
      iconGradient: 'from-purple-500 to-fuchsia-600',
    },
    {
      title: 'Worker App',
      description: 'Your crew gets their own app to clock in, add notes, and request help from the field.',
      icon: Smartphone,
      color: 'blue',
      bgTint: 'from-blue-50 to-indigo-50',
      iconGradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Client Portal',
      description: 'Share a custom booking page. Clients request services, approve quotes, and pay online.',
      icon: LayoutDashboard,
      color: 'orange',
      bgTint: 'from-orange-50 to-amber-50',
      iconGradient: 'from-orange-500 to-amber-600',
    },
  ]

  const getCardColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-indigo-600',
      orange: 'from-orange-500 to-amber-600',
      green: 'from-emerald-500 to-green-600',
      purple: 'from-purple-500 to-fuchsia-600',
    }
    return colors[color] || colors.green
  }

  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
              Run Your Business
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Built specifically for landscaping professionals. No fluff, just tools that work.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-emerald-200"
            >
              {/* Icon badge */}
              <div className={`bg-gradient-to-br ${feature.bgTint} rounded-xl p-3 mb-4 w-fit`}>
                <div className={`bg-gradient-to-br ${feature.iconGradient} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}

          {/* Dark green CTA card as 6th slot */}
          <div className="group bg-gradient-to-br from-emerald-700 to-green-800 rounded-2xl p-8 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-emerald-400">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Start?</h3>
                <p className="text-emerald-200 leading-relaxed">
                  Join 500+ lawn care businesses already saving time with LawnDesk.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: CheckCircle, text: '14-day free trial, full access' },
                  { icon: CheckCircle, text: 'No credit card required' },
                  { icon: CheckCircle, text: 'Cancel anytime, no contracts' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-emerald-100">
                    <item.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/login?signup=true"
                className="group inline-flex items-center gap-2.5 w-full justify-center bg-white text-emerald-700 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
