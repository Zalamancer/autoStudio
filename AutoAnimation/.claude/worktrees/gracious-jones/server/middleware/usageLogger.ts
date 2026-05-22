/**
 * API usage logging middleware.
 *
 * Logs API calls to `api_usage_log` table after each request completes.
 * Records: key_id, endpoint, method, status, latency_ms, credits_used.
 */

import type { Request, Response, NextFunction } from 'express'
import { getSupabaseAdmin, isSocialConfigured } from './supabaseAuth'

/**
 * Express middleware: logs API usage after response is sent.
 * Should be mounted after apiKeyAuth middleware so req.apiKeyId is available.
 */
export function usageLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()

  // Hook into response finish event
  res.on('finish', () => {
    const apiKeyId = (req as any).apiKeyId as string | undefined
    const userId = (req as any).userId as string | undefined

    if (!apiKeyId || !userId || !isSocialConfigured()) return

    const latencyMs = Date.now() - startTime
    const creditsUsed = (req as any).creditsUsed as number | undefined

    // Fire and forget — don't block the response
    const supabase = getSupabaseAdmin()
    supabase
      .from('api_usage_log')
      .insert({
        api_key_id: apiKeyId,
        user_id: userId,
        endpoint: req.path,
        method: req.method,
        status_code: res.statusCode,
        latency_ms: latencyMs,
        credits_used: creditsUsed ?? 0,
      })
      .then(() => {})
      .catch((err) => {
        console.error('[UsageLogger] Failed to log usage:', err)
      })
  })

  next()
}
