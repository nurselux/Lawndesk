import { NextResponse } from 'next/server'

export async function GET() {
  // Intentionally throw an error to test Sentry
  throw new Error('Test error from /api/test-error — Sentry should capture this')
}
