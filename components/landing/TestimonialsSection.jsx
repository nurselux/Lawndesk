import Link from 'next/link'

export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I used to spend Sunday nights doing invoices. Now it takes me 5 minutes. LawnDesk paid for itself in the first week.",
      name: "Mike T.",
      business: "T&T Lawn Care · Austin, TX",
      initials: "MT",
      gradient: "from-emerald-500 to-green-600",
    },
    {
      quote: "The recurring jobs feature is a game changer. My whole weekly schedule is set up once and just runs automatically.",
      name: "Sarah K.",
      business: "Green Thumb Services · Nashville, TN",
      initials: "SK",
      gradient: "from-teal-500 to-emerald-600",
    },
    {
      quote: "Finally an app that's actually built for landscapers. It's simple, fast, and works great on my phone between jobs.",
      name: "Dave R.",
      business: "Riverside Landscaping · Denver, CO",
      initials: "DR",
      gradient: "from-green-600 to-emerald-700",
    },
    {
      quote: "My workers love their app. They can clock in, see their route, and add photos — all from the field.",
      name: "Jennifer M.",
      business: "Lawn Pro Solutions · Phoenix, AZ",
      initials: "JM",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      quote: "The booking page clients get is professional and easy to use. I've gotten more bookings than ever before.",
      name: "Carlos R.",
      business: "Elite Grounds · Miami, FL",
      initials: "CR",
      gradient: "from-green-500 to-teal-600",
    },
    {
      quote: "Customer support is incredible. They helped me import all my clients in one call and set up my whole system.",
      name: "Lisa H.",
      business: "Precision Lawns · Seattle, WA",
      initials: "LH",
      gradient: "from-teal-600 to-emerald-700",
    },
  ]

  return (
    <section className="bg-green-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Landscapers{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
              Love LawnDesk
            </span>
          </h2>
          <p className="text-gray-500 text-lg">
            Trusted by lawn care businesses across the country
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-emerald-200 flex flex-col relative overflow-hidden"
            >
              {/* Decorative quote mark */}
              <div className="absolute top-4 right-6 text-7xl font-black text-emerald-100 select-none leading-none pointer-events-none" aria-hidden="true">"</div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4" role="img" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg" aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 flex-1">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                {/* Avatar initials with green gradient */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${testimonial.gradient}`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-gray-900 leading-tight">{testimonial.name}</p>
                  <p className="text-gray-500 text-sm">{testimonial.business}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            href="/login?signup=true"
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white font-bold py-4 px-8 rounded-xl hover:from-emerald-500 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            Join 500+ Happy Businesses
          </Link>
        </div>
      </div>
    </section>
  )
}
