import AuthRedirect from '../components/AuthRedirect'
import Header from '../components/landing/Header'
import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import BilateralEcosystem from '../components/landing/BilateralEcosystem'
import PricingSection from '../components/landing/PricingSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import CTASection from '../components/landing/CTASection'
import Footer from '../components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-dvh bg-white text-gray-800">
      <AuthRedirect />

      {/* All landing sections */}
      <Header />
      <HeroSection />
      <FeaturesSection />
      <BilateralEcosystem />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
