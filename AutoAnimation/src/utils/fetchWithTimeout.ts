/**
 * Simple fetch wrapper that aborts after a configurable timeout.
 *
 * Use this for one-shot requests that should NOT be retried.
 * For requests that need retry + timeout, use `fetchWithRetry` instead.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timer)
  }
}
