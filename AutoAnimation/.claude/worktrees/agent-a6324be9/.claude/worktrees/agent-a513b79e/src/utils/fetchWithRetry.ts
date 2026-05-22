/**
 * Shared fetch utility with automatic retry, timeout, and exponential backoff.
 *
 * - Retries on network errors, 5xx server errors, and 429 rate-limit responses.
 * - Respects the `Retry-After` header on 429 responses when present.
 * - Does NOT retry 4xx client errors (except 429).
 * - Applies an AbortController timeout per attempt.
 */

export interface FetchRetryConfig {
  /** Maximum number of retry attempts (default: 2, so up to 3 total attempts). */
  maxRetries?: number
  /** Per-attempt timeout in milliseconds (default: 30 000). */
  timeoutMs?: number
  /** Base retry delay in milliseconds; doubled on each subsequent attempt (default: 1 000). */
  retryDelayMs?: number
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: FetchRetryConfig = {},
): Promise<Response> {
  const { maxRetries = 2, timeoutMs = 30_000, retryDelayMs = 1_000 } = config

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    // Merge any existing signal from the caller (if provided) with our timeout signal.
    // If the caller passed their own signal we combine them; otherwise we just use ours.
    const mergedSignal =
      options.signal
        ? anySignal([options.signal, controller.signal])
        : controller.signal

    try {
      const response = await fetch(url, {
        ...options,
        signal: mergedSignal,
      })
      clearTimeout(timeout)

      // Don't retry client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response
      }

      // Retry on 429 (rate limit)
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = response.headers.get('Retry-After')
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1_000
          : retryDelayMs * Math.pow(2, attempt)
        await sleep(delay)
        continue
      }

      // Retry on server errors (5xx)
      if (response.status >= 500 && attempt < maxRetries) {
        await sleep(retryDelayMs * Math.pow(2, attempt))
        continue
      }

      return response
    } catch (err) {
      clearTimeout(timeout)
      if (attempt === maxRetries) throw err
      await sleep(retryDelayMs * Math.pow(2, attempt))
    }
  }

  // Should be unreachable, but TypeScript needs this.
  throw new Error('fetchWithRetry: exhausted retries')
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Combine multiple AbortSignals so that aborting *any* of them aborts the
 * composite signal.  Uses the native `AbortSignal.any` when available
 * (Chrome 116+, Node 20+), otherwise falls back to manual wiring.
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  // Use native API if available
  if ('any' in AbortSignal && typeof (AbortSignal as any).any === 'function') {
    return (AbortSignal as any).any(signals)
  }

  // Polyfill for older browsers
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    })
  }
  return controller.signal
}
