import type { Metadata } from 'next'
import AdminLayout from '../../components/AdminLayout'

export const metadata: Metadata = { title: 'Calendar | LawnDesk' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
