export async function GET() {
  // Intentionally throw an error to test Sentry
  throw new Error('This is a test error from the /api/test-error endpoint');
}
