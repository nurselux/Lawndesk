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
    const { data: invite } = await supabase
      .from('invites')
      .select('email, used')
      .eq('token', token)
      .single()

    if (!invite) {
      return {
        title: 'Join LawnDesk - Worker Invite',
        description: 'You have been invited to join a team on LawnDesk',
      }
    }

    if (invite.used) {
      return {
        title: 'Invite Already Used - LawnDesk',
        description: 'This invite has already been redeemed.',
      }
    }

    return {
      title: `Join LawnDesk - Worker Invite for ${invite.email}`,
      description: 'You have been invited to join a team on LawnDesk. Accept this invite to set up your worker account and start managing jobs.',
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: `https://lawndesk.pro/invite/${token}`,
        title: '🌿 Join LawnDesk',
        description: 'You have been invited to join a team. Accept to create your worker account.',
        images: [
          {
            url: '/og-invite.png',
            width: 1200,
            height: 630,
            alt: 'Join LawnDesk - Worker Invite',
            type: 'image/png',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: '🌿 Join LawnDesk',
        description: 'You have been invited to join a team. Accept to create your worker account.',
        images: ['/og-invite.png'],
      },
    }
  } catch (error) {
    console.error('Error generating invite metadata:', error)
    return {
      title: 'Join LawnDesk - Worker Invite',
      description: 'You have been invited to join a team on LawnDesk',
    }
  }
}

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
