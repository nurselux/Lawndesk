import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold text-green-700">🌿 LawnDesk</Link>
        <Link href="/login" className="text-gray-600 font-semibold hover:text-green-700 transition-colors">Log In</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as your name, email address, and business information when you create a LawnDesk account. We also collect data you enter into the platform, including client records, job schedules, and invoice details.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to operate and improve LawnDesk, process transactions, send you service-related communications, and provide customer support. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Data Storage & Security</h2>
            <p>Your data is stored securely using Supabase (PostgreSQL) with row-level security enabled. All data is encrypted in transit using TLS. We take reasonable measures to protect your information from unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Cookies</h2>
            <p>LawnDesk uses cookies to maintain your authentication session. We do not use tracking or advertising cookies. You can disable cookies in your browser settings, but this may affect your ability to log in.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Third-Party Services</h2>
            <p>We use Stripe for payment processing. Stripe's privacy policy governs any payment information you provide. We do not store credit card details on our servers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:support@lawndesk.com" className="text-green-700 hover:underline">support@lawndesk.com</a>. You can also delete your account from the Settings page.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@lawndesk.com" className="text-green-700 hover:underline">support@lawndesk.com</a>.</p>
          </section>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>© {new Date().getFullYear()} LawnDesk. <Link href="/terms" className="hover:text-white">Terms</Link> · <Link href="/privacy" className="hover:text-white">Privacy</Link></p>
      </footer>
    </main>
  )
}
