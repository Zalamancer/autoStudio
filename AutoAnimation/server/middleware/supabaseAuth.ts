import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'

// NOTE: env vars are read lazily (inside functions) because ES module imports
// are hoisted and execute BEFORE dotenv.config() in index.ts.

let _supabase: ReturnType<typeof createClient> | null = null

/** Server-side Supabase client using service role key (bypasses RLS for admin ops) */
export function getSupabaseAdmin() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
    const key = process.env.SUPABASE_SERVICE_KEY || ''
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required for social features')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

/** Check if Supabase is configured for social features */
export function isSocialConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_KEY || ''
  return Boolean(url && key)
}

/** Express middleware: verify Supabase JWT and attach userId to request */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Attach user ID to request for downstream handlers
    ;(req as any).userId = data.user.id
    ;(req as any).userEmail = data.user.email
    next()
  } catch (err) {
    console.error('[Auth] Token verification failed:', err)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

/** Middleware: require enterprise subscription */
export async function requireEnterprise(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single()
    if (data?.plan !== 'enterprise') {
      res.status(403).json({ error: 'Enterprise subscription required' })
      return
    }
    next()
  } catch (err) {
    console.error('[Auth] Enterprise check failed:', err)
    res.status(500).json({ error: 'Failed to verify subscription' })
  }
}

/** Middleware: require opted-in creator profile */
export async function requireOptedIn(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('creator_profiles')
      .select('opted_in')
      .eq('user_id', userId)
      .single()
    if (!data?.opted_in) {
      res.status(403).json({ error: 'Creator profile opt-in required' })
      return
    }
    next()
  } catch (err) {
    console.error('[Auth] Opted-in check failed:', err)
    res.status(500).json({ error: 'Failed to verify creator profile' })
  }
}
