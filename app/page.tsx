import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-800">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-700">🌿 LawnDesk</Link>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-gray-600 font-semibold hover:text-green-700 transition-colors">Log In</Link>
            <Link href="/login">
              <button className="bg-green-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800 transition-colors cursor-pointer">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Run Your Lawn Business Like a Pro
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-green-100 mb-4">
            Less paperwork, more yardwork.
          </p>
          <p className="text-green-200 text-lg mb-10 max-w-xl mx-auto">
            LawnDesk handles your clients, jobs, and invoices so you can focus on what you do best — making yards look great.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/login">
              <button className="bg-white text-green-700 font-bold py-4 px-10 rounded-lg text-lg hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer">
                Get Started Free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="border-2 border-white text-white font-bold py-4 px-10 rounded-lg text-lg hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer">
                See Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">Everything You Need to Run Your Business</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">Built specifically for landscaping professionals.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: 'Client Management', desc: 'Store client info, notes, and contact details all in one place.' },
              { icon: '📅', title: 'Job Scheduling', desc: 'Schedule one-time or recurring jobs and track their status.' },
              { icon: '📄', title: 'Invoicing', desc: 'Create and send invoices in seconds and track who owes you.' },
              { icon: '🔄', title: 'Recurring Jobs', desc: 'Set weekly, biweekly, or monthly jobs and let LawnDesk handle the rest.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-lg mb-12">No hidden fees. Cancel anytime.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="border-2 border-gray-200 rounded-xl p-8 text-left">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Starter</h3>
              <p className="text-4xl font-bold text-green-700 mb-1">$19<span className="text-lg text-gray-400 font-normal">/mo</span></p>
              <p className="text-gray-400 mb-6">Perfect for solo operators</p>
              <ul className="space-y-3 mb-8">
                {['Up to 25 clients', 'Unlimited jobs', 'Basic invoicing'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-600 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <button className="w-full border-2 border-green-700 text-green-700 font-bold py-3 rounded-lg hover:bg-green-50 transition-colors cursor-pointer">
                  Get Started
                </button>
              </Link>
            </div>
            <div className="border-2 border-green-700 rounded-xl p-8 text-left relative">
              <span className="absolute top-4 right-4 bg-green-700 text-white text-xs font-bold py-1 px-3 rounded-full">Most Popular</span>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Pro</h3>
              <p className="text-4xl font-bold text-green-700 mb-1">$39<span className="text-lg text-gray-400 font-normal">/mo</span></p>
              <p className="text-gray-400 mb-6">For growing landscaping crews</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited clients', 'Recurring job automation', 'Advanced invoicing & reports'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-600 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <button className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors cursor-pointer">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
          <Link href="/pricing" className="text-green-700 font-semibold hover:underline text-lg">
            See full pricing details →
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-green-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">Landscapers Love LawnDesk</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              {
                quote: "I used to spend Sunday nights doing invoices. Now it takes me 5 minutes. LawnDesk paid for itself in the first week.",
                name: "Mike T.",
                business: "T&T Lawn Care, Austin TX",
              },
              {
                quote: "The recurring jobs feature is a game changer. My whole weekly schedule is set up once and just runs automatically.",
                name: "Sarah K.",
                business: "Green Thumb Services, Nashville TN",
              },
              {
                quote: "Finally an app that's actually built for landscapers. It's simple, fast, and works great on my phone between jobs.",
                name: "Dave R.",
                business: "Riverside Landscaping, Denver CO",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 italic mb-4">"{t.quote}"</p>
                <p className="font-bold text-gray-800">{t.name}</p>
                <p className="text-gray-400 text-sm">{t.business}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is there a free trial?',
                a: 'Yes! Every new account gets a 14-day free trial with full access to all Pro features. No credit card required.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. There are no contracts or cancellation fees. You can cancel your subscription at any time from your account settings.',
              },
              {
                q: 'Does LawnDesk work on my phone?',
                a: 'Yes — LawnDesk is fully mobile responsive. Access your clients, jobs, and invoices from any smartphone or tablet on the go.',
              },
              {
                q: 'How does invoicing work?',
                a: 'Create an invoice in seconds by selecting a client and entering an amount. Track paid, unpaid, and overdue invoices from your dashboard.',
              },
              {
                q: 'How do recurring jobs work?',
                a: 'When scheduling a job, choose weekly, biweekly, or monthly. LawnDesk will automatically create all upcoming jobs for the next 3 months.',
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-gray-100 pb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.q}</h3>
                <p className="text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xl font-bold text-white">🌿 LawnDesk</div>
          <div className="flex gap-6 flex-wrap justify-center text-sm">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} LawnDesk. All rights reserved.</p>
        </div>
      </footer>

    </main>
  )
}
