// Instrumentation file for Sentry
// This is automatically called by Next.js with withSentryConfig

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    await import('./sentry.server.config');
  }
}
