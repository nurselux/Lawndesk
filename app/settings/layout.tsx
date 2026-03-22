import type { Metadata } from 'next'
import Sidebar from '../../components/Sidebar'

export const metadata: Metadata = { title: 'Settings | LawnDesk' }

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 pt-14 md:pt-6 bg-gray-100 min-h-screen">
        {children}
      </main>
    </div>
  )
}