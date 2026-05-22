/**
 * API Key authentication middleware.
 *
 * Reads `x-api-key` header, SHA-256 hashes it, looks up in `api_keys` table,
 * attaches userId/apiKeyId/tierLimits to the request, and returns 401 on invalid key.
 * Increments `last_used_at` on successful auth.
 */

import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { getSupabaseAdmin, isSocialConfigured } from './supabaseAuth'

export interface ApiKeyTierLimits {
  ratePerMinute: number
  ratePerDay: number
  tier: string
}

/** SHA-256 hash a plaintext API key */
export function hashApiKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

/** Generate a new random API key with `pak_` prefix */
export function generateApiKey(): string {
  const random = crypto.randomBytes(32).toString('hex')
  return `pak_${random}`
}

/**
 * Express middleware: verify x-api-key header against api_keys table.
 * Attaches userId, apiKeyId, and tierLimits to req on success.
 */
export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined

  if (!apiKey) {
    res.status(401).json({ error: 'Missing x-api-key header', code: 'MISSING_API_KEY' })
    return
  }

  if (!isSocialConfigured()) {
    res.status(503).json({ error: 'API service unavailable', code: 'SERVICE_UNAVAILABLE' })
    return
  }

  try {
    const keyHash = hashApiKey(apiKey)
    const supabase = getSupabaseAdmin()

    const { data: keyRow, error } = await supabase
      .from('api_keys')
      .select('id, user_id, tier, rate_limit_per_minute, rate_limit_per_day, is_active, revoked_at')
      .eq('key_hash', keyHash)
      .single()

    if (error || !keyRow) {
      res.status(401).json({ error: 'Invalid API key', code: 'INVALID_API_KEY' })
      return
    }

    if (!keyRow.is_active || keyRow.revoked_at) {
      res.status(401).json({ error: 'API key has been revoked', code: 'REVOKED_API_KEY' })
      return
    }

    // Attach auth info to request
    ;(req as any).userId = keyRow.user_id
    ;(req as any).apiKeyId = keyRow.id
    ;(req as any).tierLimits = {
      ratePerMinute: keyRow.rate_limit_per_minute,
      ratePerDay: keyRow.rate_limit_per_day,
      tier: keyRow.tier,
    } as ApiKeyTierLimits

    // Update last_used_at (fire and forget)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRow.id)
      .then(() => {})
      .catch(() => {})

    next()
  } catch (err) {
    console.error('[ApiKeyAuth] Verification failed:', err)
    res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' })
  }
}
