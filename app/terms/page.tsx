import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-white">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold text-green-700">🌿 LawnDesk</Link>
        <Link href="/login" className="text-gray-600 font-semibold hover:text-green-700 transition-colors">Log In</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>By creating a LawnDesk account or using our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use LawnDesk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Use of the Service</h2>
            <p>LawnDesk is a business management platform for landscaping professionals. You agree to use the service only for lawful purposes and in accordance with these terms. You are responsible for all activity that occurs under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Subscriptions & Billing</h2>
            <p>LawnDesk offers paid subscription plans billed monthly. All subscriptions include a 14-day free trial. After the trial, your chosen plan will be billed automatically. You may cancel at any time; cancellation takes effect at the end of the current billing period.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Refunds</h2>
            <p>We do not offer refunds for partial subscription periods. If you believe you were charged in error, please contact us at <a href="mailto:support@lawndesk.com" className="text-green-700 hover:underline">support@lawndesk.com</a> within 30 days of the charge.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Data Ownership</h2>
            <p>You retain full ownership of all data you enter into LawnDesk, including client records, jobs, and invoices. We do not claim any rights over your business data. Upon account deletion, your data will be permanently removed within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Service Availability</h2>
            <p>We strive to maintain high availability but do not guarantee uninterrupted access to LawnDesk. We are not liable for any losses resulting from service outages or interruptions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or otherwise misuse the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. SMS Messaging</h2>
            <p>By providing your phone number and opting into SMS notifications, you agree to receive service-related text messages from LawnDesk. Message and data rates may apply based on your carrier plan.</p>
            <p className="mb-2">You can opt-out of SMS messages at any time by:</p>
            <ul className="list-disc list-inside ml-5 space-y-2">
              <li>Replying <strong>STOP</strong> to any SMS message from LawnDesk</li>
              <li>Disabling SMS notifications in your account settings</li>
              <li>Contacting us at <a href="mailto:support@lawndesk.com" className="text-green-700 hover:underline">support@lawndesk.com</a></li>
            </ul>
            <p className="text-gray-500 text-sm">For help with SMS issues, text <strong>HELP</strong> to our messaging service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">9. Contact</h2>
            <p>Questions about these terms? Reach us at <a href="mailto:support@lawndesk.com" className="text-green-700 hover:underline">support@lawndesk.com</a>.</p>
          </section>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>© {new Date().getFullYear()} LawnDesk. <Link href="/terms" className="hover:text-white">Terms</Link> · <Link href="/privacy" className="hover:text-white">Privacy</Link></p>
      </footer>
    </main>
  )
}
