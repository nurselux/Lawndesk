import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-green-700 flex flex-col items-center justify-center text-white text-center p-5">
      <h1 className="text-5xl font-bold mb-4">🌿 LawnDesk</h1>
      <p className="text-2xl mb-4">Less paperwork, more yardwork</p>
      <p className="text-green-200 text-lg mb-10 max-w-md">
        The simplest business management tool for landscaping professionals.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/login">
          <button className="bg-white text-green-700 font-bold py-4 px-10 rounded-lg text-lg hover:scale-110 hover:shadow-2xl transition-all duration-300 cursor-pointer">
            Get Started
          </button>
        </Link>
        <Link href="/pricing">
          <button className="border-2 border-white text-white font-bold py-4 px-10 rounded-lg text-lg hover:scale-110 hover:shadow-2xl transition-all duration-300 cursor-pointer">
            See Pricing
          </button>
        </Link>
      </div>
    </main>
  )
}