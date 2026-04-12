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
        title: 'Estimate - LawnDesk',
        description: 'View this estimate on LawnDesk',
      }
    }

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(quote.amount)

    const statusEmoji = quote.status === 'approved' ? '✅' : quote.status === 'declined' ? '❌' : '📋'

    return {
      title: `${quote.title} - Estimate for ${quote.client_name}`,
      description: `Estimate for $${formattedAmount} prepared by LawnDesk. ${quote.description || 'View details and approve or decline this estimate.'}`,
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: `https://lawndesk.pro/estimate/${token}`,
        title: `${statusEmoji} ${quote.title}`,
        description: `Estimate for ${quote.client_name} - ${formattedAmount}`,
        images: [
          {
            url: '/og-quote.png',
            width: 1200,
            height: 630,
            alt: `${quote.title} - Estimate from LawnDesk`,
            type: 'image/png',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${statusEmoji} ${quote.title}`,
        description: `Estimate for ${quote.client_name} - ${formattedAmount}`,
        images: ['/og-quote.png'],
      },
    }
  } catch (error) {
    console.error('Error generating estimate metadata:', error)
    return {
      title: 'Estimate - LawnDesk',
      description: 'View this estimate on LawnDesk',
    }
  }
}

export default function EstimateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
