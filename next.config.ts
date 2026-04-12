import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  compress: true,
  async redirects() {
    return [
      { source: '/quotes', destination: '/estimates', permanent: true },
      { source: '/quote/:token', destination: '/estimate/:token', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jxsodtvsebtgipgqtdgl.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/admin',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https: data:",
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
})
