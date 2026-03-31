import Link from 'next/link'

export const metadata = {
  title: 'SMS Consent & Opt-Out | LawnDesk',
  description: 'Learn how LawnDesk sends SMS notifications and how to opt out at any time.',
}

export default function SmsConsentPage() {
  return (
    <main className="min-h-dvh bg-white">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold text-green-700">🌿 LawnDesk</Link>
        <Link href="/login" className="text-gray-600 font-semibold hover:text-green-700 transition-colors">Log In</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">SMS Consent & Opt-Out</h1>
        <p className="text-gray-400 mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Who sends these messages?</h2>
            <p>LawnDesk is a business management platform used by lawn care and landscaping companies. When a lawn care business adds you as a client in LawnDesk, you may receive SMS notifications on their behalf regarding your service — such as upcoming job reminders, invoice notifications, and booking confirmations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">What types of messages will I receive?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upcoming job reminders (e.g. "Your lawn service is scheduled for tomorrow at 9am")</li>
              <li>Invoice notifications (e.g. "Your invoice is ready to view and pay")</li>
              <li>Booking confirmations and status updates</li>
              <li>Messages are transactional only — no marketing or promotional messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">How did I get opted in?</h2>
            <p>Your phone number was provided to the lawn care business you work with, and they added it to their LawnDesk account to send you service-related updates. Message frequency varies based on your service schedule.</p>
          </section>

          <section className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3">How to opt out</h2>
            <p className="mb-3">You can opt out at any time by replying <strong>STOP</strong> to any message you receive. You will receive one final confirmation message and then no further messages will be sent to your number.</p>
            <p className="text-sm text-gray-500">To opt back in, reply <strong>START</strong> at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Message & data rates</h2>
            <p>Message and data rates may apply depending on your mobile carrier and plan. LawnDesk does not charge for SMS messages.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Need help?</h2>
            <p>If you have questions about the messages you received or need further assistance, contact us at <a href="mailto:support@lawndesk.pro" className="text-green-700 font-semibold underline">support@lawndesk.pro</a>.</p>
          </section>

          <section>
            <p className="text-sm text-gray-400">
              See also: <Link href="/privacy" className="text-green-700 underline">Privacy Policy</Link> · <Link href="/terms" className="text-green-700 underline">Terms of Service</Link>
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
