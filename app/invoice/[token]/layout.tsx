import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params

  try {
    const { data: invoice } = await supabase
      .from('Invoices')
      .select('invoice_number, client_name, amount, status, description, due_date')
      .eq('share_token', token)
      .single()

    if (!invoice) {
      return {
        title: 'Invoice - LawnDesk',
        description: 'View this invoice on LawnDesk',
      }
    }

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(invoice.amount)

    const invoiceNum = `INV-${String(invoice.invoice_number).padStart(3, '0')}`
    const statusEmoji = invoice.status === '🟢 Paid' ? '✅' : invoice.status === '🔴 Overdue' ? '⚠️' : '📄'

    return {
      title: `${invoiceNum} - Invoice for ${invoice.client_name}`,
      description: `Invoice for ${formattedAmount} due on ${new Date(invoice.due_date).toLocaleDateString()}. ${invoice.description || 'View full invoice details and pay online.'}`,
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: `https://lawndesk.pro/invoice/${token}`,
        title: `${statusEmoji} ${invoiceNum}`,
        description: `Invoice for ${invoice.client_name} - ${formattedAmount}`,
        images: [
          {
            url: '/og-invoice.png',
            width: 1200,
            height: 630,
            alt: `${invoiceNum} - Invoice from LawnDesk`,
            type: 'image/png',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${statusEmoji} ${invoiceNum}`,
        description: `Invoice for ${invoice.client_name} - ${formattedAmount}`,
        images: ['/og-invoice.png'],
      },
    }
  } catch (error) {
    console.error('Error generating invoice metadata:', error)
    return {
      title: 'Invoice - LawnDesk',
      description: 'View this invoice on LawnDesk',
    }
  }
}

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
