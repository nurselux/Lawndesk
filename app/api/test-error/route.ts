import { NextResponse } from 'next/server'

export async function GET() {
  throw new Error('Test error from /api/test-error — Sentry should capture this')
}
