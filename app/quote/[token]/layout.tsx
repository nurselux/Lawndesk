import { Metadata, MetadataRoute } from 'next'
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
    const { data: quote } = await supabase
      .from('Quotes')
      .select('title, client_name, amount, description, status, expires_at')
      .eq('share_token', token)
      .single()

    if (!quote) {
      return {
        title: 'Quote - LawnDesk',
        description: 'View this quote on LawnDesk',
      }
    }

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(quote.amount)

    const statusEmoji = quote.status === 'approved' ? '✅' : quote.status === 'declined' ? '❌' : '📋'

    return {
      title: `${quote.title} - Quote for ${quote.client_name}`,
      description: `Quote for $${formattedAmount} prepared by LawnDesk. ${quote.description || 'View details and approve or decline this quote.'}`,
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: `https://lawndesk.pro/quote/${token}`,
        title: `${statusEmoji} ${quote.title}`,
        description: `Quote for ${quote.client_name} - ${formattedAmount}`,
        images: [
          {
            url: '/og-quote.png',
            width: 1200,
            height: 630,
            alt: `${quote.title} - Quote from LawnDesk`,
            type: 'image/png',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${statusEmoji} ${quote.title}`,
        description: `Quote for ${quote.client_name} - ${formattedAmount}`,
        images: ['/og-quote.png'],
      },
    }
  } catch (error) {
    console.error('Error generating quote metadata:', error)
    return {
      title: 'Quote - LawnDesk',
      description: 'View this quote on LawnDesk',
    }
  }
}

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
