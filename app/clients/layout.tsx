import type { Metadata } from 'next'
import Sidebar from '../../components/Sidebar'

export const metadata: Metadata = { title: 'Clients | LawnDesk' }

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 pt-14 md:pt-6 bg-gray-100 min-h-dvh">
        {children}
      </main>
    </div>
  )
}