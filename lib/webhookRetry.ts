/**
 * Retry a function with exponential backoff.
 * Delays: 1s, 2s, 4s, 8s, etc.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<{ success: boolean; result?: T; error?: string; attemptCount: number }> {
  let lastError: string = ''
  let attemptCount = 0

  for (let i = 0; i < maxRetries; i++) {
    attemptCount = i + 1
    try {
      const result = await fn()
      return { success: true, result, attemptCount }
    } catch (err: any) {
      lastError = err.message || String(err)
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s, 8s, 16s...
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return { success: false, error: lastError, attemptCount }
}
