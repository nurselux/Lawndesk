import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-white">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold text-green-700">🌿 LawnDesk</Link>
        <Link href="/login" className="text-gray-600 font-semibold hover:text-green-700 transition-colors">Log In</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-10">Last updated: April 2026</p>

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
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. SMS Communications</h2>
            <p className="mb-3">
              <strong>Program name: LawnDesk SMS Notifications.</strong> If you opt-in to receive
              SMS notifications, your phone number is used solely for service-related communications:
            </p>
            <ul className="list-disc list-inside ml-5 space-y-2 mb-3">
              <li>Service appointment reminders and scheduling notifications</li>
              <li>Job status updates (e.g., crew on the way, service complete)</li>
              <li>Invoice and payment links</li>
              <li>Quote approvals and booking confirmations</li>
            </ul>
            <p className="text-gray-700 font-medium mb-2">Your phone number is never sold, shared with third parties, or used for marketing purposes unrelated to your service.</p>
            <p className="text-gray-500 text-sm mb-4">To opt out, reply <strong>STOP</strong> to any message. For help, reply <strong>HELP</strong>. Msg &amp; data rates may apply.</p>
            <p><strong>Operator Client Data.</strong> LawnDesk subscribers (&quot;Operators&quot;) may store contact information for their own end clients within the platform, including phone numbers used to deliver service-related SMS on the Operator&apos;s behalf. LawnDesk processes this end client data solely as a technology platform acting on the Operator&apos;s instructions and does not use end client contact data for any independent purpose. Operators are responsible for ensuring their end clients have provided proper consent to receive automated messages, and for complying with all applicable messaging regulations including the TCPA.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Data Storage &amp; Security</h2>
            <p>Your data is stored securely using Supabase (PostgreSQL) with row-level security enabled. All data is encrypted in transit using TLS. We take reasonable measures to protect your information from unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Cookies</h2>
            <p>LawnDesk uses cookies to maintain your authentication session. We do not use tracking or advertising cookies. You can disable cookies in your browser settings, but this may affect your ability to log in.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Third-Party Services &amp; Data Sharing</h2>
            <p className="mb-3">We do not sell or share mobile or personal data with third parties, affiliates, or partners for marketing or promotional purposes. We only share data with third parties when it is strictly necessary to deliver our service and only under binding agreements that ensure confidentiality. Under no circumstances will mobile data be shared or sold for advertising or promotional use.</p>
            <p className="mb-3">We use the following third-party services to operate LawnDesk:</p>
            <ul className="list-disc list-inside ml-5 space-y-2">
              <li><strong>Stripe</strong> — payment processing. Stripe&apos;s privacy policy governs any payment information you provide. We do not store credit card details on our servers.</li>
              <li><strong>Twilio</strong> — SMS delivery. Phone numbers used for SMS communications may be transmitted to Twilio solely for the purpose of message delivery. Twilio&apos;s privacy policy governs that data in transit. Twilio does not receive data for marketing or any secondary use.</li>
              <li><strong>Supabase</strong> — database and authentication infrastructure.</li>
              <li><strong>Vercel</strong> — application hosting and delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:support@lawndesk.com" className="text-green-700 hover:underline">support@lawndesk.com</a>. You can also delete your account from the Settings page.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. Contact Us</h2>
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
