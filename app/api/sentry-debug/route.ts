export async function GET() {
  return Response.json({
    SENTRY_DSN: process.env.SENTRY_DSN ? '***SET***' : 'NOT_SET',
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ? '***SET***' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
  });
}
