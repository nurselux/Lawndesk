import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Jobs | LawnDesk' }

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
