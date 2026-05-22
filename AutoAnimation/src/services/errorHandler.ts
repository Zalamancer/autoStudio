/**
 * Centralized error handling for ProAnimate services.
 *
 * Provides consistent error reporting through the toast system,
 * structured error types, and a global unhandled rejection handler.
 */
import { toast } from '@/stores/useToastStore'
import { logger } from '@/utils/logger'

/** Structured error context for service operations */
interface ErrorContext {
  /** Service/module name (e.g., "meshyAPI", "elevenlabs") */
  service: string
  /** Operation that failed (e.g., "generateVoice", "loadModel") */
  operation: string
  /** Whether to show a toast notification (default: true) */
  showToast?: boolean
  /** Toast duration in ms (default: 6000 for errors) */
  toastDuration?: number
}

/**
 * Report an error with context. Shows a toast and logs to console.error.
 * Returns the error for re-throwing if needed.
 */
export function reportError(error: unknown, context: ErrorContext): Error {
  const message = error instanceof Error ? error.message : String(error)
  const fullMessage = `[${context.service}] ${context.operation}: ${message}`

  logger.error(fullMessage, error)

  if (context.showToast !== false) {
    toast.error(
      `${context.operation} failed: ${message}`,
      context.toastDuration ?? 6000
    )
  }

  return error instanceof Error ? error : new Error(fullMessage)
}

/**
 * Wrap an async operation with error handling.
 * On success, returns the result. On failure, reports the error and returns the fallback.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: ErrorContext,
  fallback: T
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    reportError(error, context)
    return fallback
  }
}

/**
 * Install global unhandled rejection handler.
 * Call once at app startup (e.g., in main.tsx).
 */
export function installGlobalErrorHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    const message = error instanceof Error ? error.message : String(error)

    // Don't toast for common non-critical errors
    if (message.includes('ResizeObserver') || message.includes('AbortError')) {
      return
    }

    logger.error('[Unhandled Rejection]', error)
    toast.error(`Unexpected error: ${message}`, 8000)
  })
}
