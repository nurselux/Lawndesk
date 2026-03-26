import Link from 'next/link'
import AuthRedirect from '../components/AuthRedirect'

export default function Home() {
  return (
    <main className="min-h-dvh bg-white text-gray-800">
      <AuthRedirect />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-green-700 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-white text-xl font-bold hover:text-green-200 transition-colors">🌿 LawnDesk</Link>
          <Link href="/login" className="border-2 border-white border-opacity-70 text-white font-bold py-2 px-5 rounded-lg hover:bg-white hover:text-green-700 transition-all duration-200 text-sm">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white pt-16 pb-0 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-yellow-400 rounded-full px-5 py-2 mb-7 shadow-lg">
            <span className="text-xl">🌿</span>
            <span className="text-green-900 text-xs sm:text-sm font-black tracking-wide uppercase">Built for Lawn & Landscaping Businesses</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
            Run Your Lawn Business<br className="hidden sm:block" /> Like a Pro
          </h1>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-5">
            Less paperwork, more yardwork.
          </p>
          <p className="text-green-200 text-base sm:text-lg mb-10 max-w-xl mx-auto">
            Schedule jobs, send quotes, collect payments, and manage your whole crew — all from your phone.
          </p>
          <div className="flex flex-col items-center gap-4 mb-14">
            <Link href="/login?signup=true" className="w-full max-w-sm">
              <button className="w-full bg-yellow-400 text-green-900 font-black py-4 px-8 rounded-2xl text-xl hover:scale-105 hover:bg-yellow-300 transition-all duration-200 cursor-pointer shadow-xl">
                Try Free for 14 Days 🌿
              </button>
            </Link>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
              <span className="flex items-center gap-1.5 text-green-200 text-sm font-medium">
                ✅ No credit card to start
              </span>
              <span className="flex items-center gap-1.5 text-green-200 text-sm font-medium">
                ✅ Cancel anytime
              </span>
              <span className="flex items-center gap-1.5 text-green-200 text-sm font-medium">
                ✅ Set up in minutes
              </span>
            </div>
            <Link href="/pricing" className="text-green-400 text-sm font-medium hover:text-white transition-colors">
              See pricing plans →
            </Link>
          </div>
        </div>

        {/* App mockup */}
        <div className="max-w-4xl mx-auto mt-2 px-2 sm:px-0">
          <img src="/hero-mockup.svg" alt="LawnDesk dashboard on laptop and phone" className="w-full drop-shadow-2xl" />
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-100 py-20 px-6">
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
              <div key={f.title} className="bg-amber-50 rounded-xl p-6 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4 bg-white w-14 h-14 rounded-xl flex items-center justify-center border border-amber-200">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-lg mb-2">No hidden fees. No contracts. Cancel anytime.</p>
          <p className="text-yellow-700 font-bold mb-10">⚡ Up to 70% cheaper than Jobber — same features, fraction of the price.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

            {/* Starter */}
            <div className="relative rounded-2xl p-px bg-gradient-to-br from-green-300 via-emerald-200 to-teal-300 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-white rounded-2xl p-8 text-left h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-100 text-emerald-700 text-2xl w-12 h-12 rounded-xl flex items-center justify-center">🌱</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 leading-none">Starter</h3>
                    <p className="text-gray-400 text-sm">Everything you need to run your business</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-gray-800">$19</span>
                  <span className="text-gray-400 font-normal text-lg">/mo</span>
                  <p className="text-emerald-600 text-sm font-semibold mt-1">Same as Jobber Core — 60% cheaper</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    { icon: '👥', text: 'Unlimited clients' },
                    { icon: '📅', text: 'Unlimited job scheduling' },
                    { icon: '📄', text: 'Invoicing & online payments' },
                    { icon: '🤝', text: 'Quote sending & approvals' },
                    { icon: '🌐', text: 'Client portal' },
                  ].map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-gray-600">
                      <span className="bg-emerald-50 text-emerald-600 w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0">✓</span>
                      <span>{f.icon} {f.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login?signup=true">
                  <button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-md">
                    Try Free for 14 Days
                  </button>
                </Link>
                <p className="text-center text-gray-400 text-xs mt-2">Cancel anytime</p>
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
                    <h3 className="text-xl font-bold text-white leading-none">Pro</h3>
                    <p className="text-green-300 text-sm">For growing crews & serious businesses</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-white">$39</span>
                  <span className="text-green-300 font-normal text-lg">/mo</span>
                  <p className="text-yellow-300 text-sm font-semibold mt-1">Jobber charges $129 for this — we charge $39</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    { icon: '✅', text: 'Everything in Starter' },
                    { icon: '👷', text: 'Unlimited team members' },
                    { icon: '📲', text: 'Worker app + On My Way alerts' },
                    { icon: '📬', text: 'Online booking page (your URL)' },
                    { icon: '🔄', text: 'Recurring job automation' },
                    { icon: '💬', text: 'SMS notifications to clients & crew' },
                  ].map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-green-100">
                      <span className="bg-green-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0">✓</span>
                      <span>{f.icon} {f.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login?signup=true">
                  <button className="w-full bg-white text-green-700 font-bold py-3 rounded-xl hover:bg-green-50 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-md">
                    Try Free for 14 Days
                  </button>
                </Link>
                <p className="text-center text-green-400 text-xs mt-2">Cancel anytime</p>
              </div>
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
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-3">Landscapers Love LawnDesk</h2>
          <p className="text-center text-gray-400 mb-12">Trusted by lawn care businesses across the country</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I used to spend Sunday nights doing invoices. Now it takes me 5 minutes. LawnDesk paid for itself in the first week.",
                name: "Mike T.",
                business: "T&T Lawn Care · Austin, TX",
                initials: "MT",
                color: "bg-green-600",
              },
              {
                quote: "The recurring jobs feature is a game changer. My whole weekly schedule is set up once and just runs automatically.",
                name: "Sarah K.",
                business: "Green Thumb Services · Nashville, TN",
                initials: "SK",
                color: "bg-emerald-500",
              },
              {
                quote: "Finally an app that's actually built for landscapers. It's simple, fast, and works great on my phone between jobs.",
                name: "Dave R.",
                business: "Riverside Landscaping · Denver, CO",
                initials: "DR",
                color: "bg-teal-600",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-md flex flex-col gap-4">
                {/* Header: avatar + name */}
                <div className="flex items-center gap-3">
                  <div className={`${t.color} text-white font-bold text-sm w-10 h-10 rounded-full flex items-center justify-center shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 leading-tight">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.business}</p>
                  </div>
                </div>
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                {/* Quote */}
                <p className="text-gray-600 text-sm leading-relaxed flex-1">"{t.quote}"</p>
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
                a: 'Yes! Every new account gets a 14-day free trial with full access to all Pro features. Cancel anytime.',
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
