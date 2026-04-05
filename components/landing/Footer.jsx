import Link from 'next/link'
import { Leaf, Twitter, X, Mail } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Pricing', href: '/pricing' },
        { label: 'Features', href: '#features' },
        { label: 'Testimonials', href: '#testimonials' },
        { label: 'FAQ', href: '/pricing#faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Documentation', href: '#' },
        { label: 'Status', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'GDPR', href: '#' },
      ],
    },
  ]

  const socialLinks = [
    { icon: X, label: 'X', href: '#' },
    { icon: Mail, label: 'Email', href: 'mailto:hello@lawndesk.com' },
  ]

  return (
    <footer className="bg-gray-950 text-gray-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Logo column */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg p-2 shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Leaf className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-white text-xl font-bold tracking-tight">LawnDesk</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              The all-in-one business management platform for lawn care professionals.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-4">
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white hover:text-emerald-300 transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
              Connect
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className={`group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                    social.href.startsWith('mailto')
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-gray-800 hover:bg-emerald-600'
                  }`}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" aria-hidden="true" />
                </Link>
              ))}
            </div>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
              Follow us for tips, updates, and lawn care business advice.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} LawnDesk. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/pricing" className="text-gray-500 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-gray-500 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
