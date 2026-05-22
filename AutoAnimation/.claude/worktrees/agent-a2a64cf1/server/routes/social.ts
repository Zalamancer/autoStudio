/**
 * Social media OAuth + publishing routes.
 *
 * Handles OAuth flows and video publishing for:
 * - Instagram (Meta Graph API)
 * - Facebook (Meta Graph API)
 * - TikTok (TikTok Content Posting API)
 * - X / Twitter (X API v2)
 *
 * All tokens are stored server-side in Supabase `social_accounts` table.
 * Frontend never sees platform tokens — it only passes its own Supabase JWT.
 */

import { Router, type Request, type Response } from 'express'
import crypto from 'node:crypto'
import { requireAuth, getSupabaseAdmin, isSocialConfigured } from '../middleware/supabaseAuth'

const router = Router()

// ── Config ─────────────────────────────────────────────────────────────────
// NOTE: env vars are read via getters (not top-level constants) because
// ES module imports are hoisted and run BEFORE dotenv.config() in index.ts.

const env = {
  get META_APP_ID() { return process.env.META_APP_ID || '' },
  get META_APP_SECRET() { return process.env.META_APP_SECRET || '' },
  get META_REDIRECT_URI() { return process.env.META_REDIRECT_URI || '' },
  get INSTAGRAM_APP_ID() { return process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || '' },
  get INSTAGRAM_APP_SECRET() { return process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || '' },
  get INSTAGRAM_REDIRECT_URI() { return process.env.INSTAGRAM_REDIRECT_URI || '' },
  get TIKTOK_CLIENT_KEY() { return process.env.TIKTOK_CLIENT_KEY || '' },
  get TIKTOK_CLIENT_SECRET() { return process.env.TIKTOK_CLIENT_SECRET || '' },
  get TIKTOK_REDIRECT_URI() { return process.env.TIKTOK_REDIRECT_URI || '' },
  get X_CLIENT_ID() { return process.env.X_CLIENT_ID || '' },
  get X_CLIENT_SECRET() { return process.env.X_CLIENT_SECRET || '' },
  get X_REDIRECT_URI() { return process.env.X_REDIRECT_URI || '' },
  get YOUTUBE_CLIENT_ID() { return process.env.YOUTUBE_CLIENT_ID || '' },
  get YOUTUBE_CLIENT_SECRET() { return process.env.YOUTUBE_CLIENT_SECRET || '' },
  get YOUTUBE_REDIRECT_URI() { return process.env.YOUTUBE_REDIRECT_URI || '' },
}

const GRAPH_API_VERSION = 'v21.0'

// Temporary state storage for OAuth flows (maps state → userId)
// In production, use Redis or DB-backed sessions
const oauthStates = new Map<string, { userId: string; platform: string; codeVerifier?: string }>()

// Clean up stale states every 10 minutes
setInterval(() => {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000
  for (const [key, _val] of oauthStates) {
    // Simple cleanup — in production, store timestamps
    if (oauthStates.size > 100) oauthStates.delete(key)
  }
}, 10 * 60 * 1000)

// ── Helper: generate PKCE verifier + challenge ─────────────────────────────

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

// ── Helper: close OAuth popup with message to opener ───────────────────────

function oauthCallbackHTML(success: boolean, platform: string, error?: string) {
  const message = JSON.stringify({ type: 'social-oauth-callback', platform, success, error })
  return `<!DOCTYPE html><html><body><script>
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify(message)}, '*');
    }
    window.close();
  </script><p>${success ? 'Connected! You can close this window.' : `Error: ${error || 'Unknown'}`}</p></body></html>`
}

// ── Helper: refresh token if expired ───────────────────────────────────────

export async function getValidToken(userId: string, platform: string): Promise<string> {
  const supabase = getSupabaseAdmin()
  const { data: account, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single()

  if (error || !account) throw new Error(`No connected ${platform} account`)

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const isExpired = expiresAt && expiresAt.getTime() < Date.now() + 60_000 // 1 min buffer

  if (!isExpired) return account.access_token

  // Attempt token refresh
  // Instagram Platform API refreshes using the access_token itself (not a separate refresh_token)
  if (!account.refresh_token && platform !== 'instagram' && platform !== 'facebook') {
    throw new Error(`${platform} token expired and no refresh token`)
  }

  let newToken: string
  let newRefresh: string | null = null
  let newExpiry: Date | null = null

  if (platform === 'instagram') {
    // Instagram Platform API: refresh long-lived token (must be at least 24h old, valid for 60 days)
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.access_token}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (data.error) throw new Error(data.error?.message || 'Instagram token refresh failed')
    newToken = data.access_token
    newExpiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
  } else if (platform === 'facebook') {
    // Facebook: exchange for a new long-lived token (~60 days)
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${account.access_token}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (data.error) throw new Error(data.error.message)
    newToken = data.access_token
    newExpiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
  } else if (platform === 'tiktok') {
    const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
    })
    const data = await resp.json()
    if (data.error) throw new Error(data.error_description || data.error)
    newToken = data.access_token
    newRefresh = data.refresh_token || account.refresh_token
    newExpiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
  } else if (platform === 'x') {
    const resp = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
    })
    const data = await resp.json()
    if (data.error) throw new Error(data.error_description || data.error)
    newToken = data.access_token
    newRefresh = data.refresh_token || account.refresh_token
    newExpiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
  } else if (platform === 'youtube') {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        refresh_token: account.refresh_token,
      }),
    })
    const data = await resp.json()
    if (data.error) throw new Error(data.error_description || data.error)
    newToken = data.access_token
    newRefresh = account.refresh_token // Google doesn't rotate refresh tokens
    newExpiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
  } else {
    throw new Error(`Unknown platform: ${platform}`)
  }

  // Update DB
  await supabase
    .from('social_accounts')
    .update({
      access_token: newToken,
      ...(newRefresh && { refresh_token: newRefresh }),
      ...(newExpiry && { token_expires_at: newExpiry.toISOString() }),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('platform', platform)

  return newToken
}

// ════════════════════════════════════════════════════════════════════════════
// ACCOUNTS
// ════════════════════════════════════════════════════════════════════════════

/** GET /accounts — list connected social accounts for the authenticated user */
router.get('/accounts', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('social_accounts')
      .select('platform, username, avatar_url, page_id, page_name, platform_user_id')
      .eq('user_id', userId)

    if (error) throw error

    // Build response: all 4 platforms, marking which are connected
    const platforms = ['facebook', 'instagram', 'tiktok', 'x', 'youtube'] as const
    const accounts = platforms.map((p) => {
      const connected = data?.find((d: any) => d.platform === p)
      return {
        platform: p,
        connected: !!connected,
        username: connected?.username || undefined,
        avatarUrl: connected?.avatar_url || undefined,
        pageId: connected?.page_id || undefined,
        pageName: connected?.page_name || undefined,
      }
    })

    res.json({ accounts })
  } catch (err) {
    console.error('[Social] Failed to fetch accounts:', err)
    res.status(500).json({ error: 'Failed to fetch accounts' })
  }
})

/** DELETE /accounts/:platform — disconnect a social account */
router.delete('/accounts/:platform', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { platform } = req.params
    const supabase = getSupabaseAdmin()

    // Fetch the stored token before deleting, so we can revoke on the platform side
    const { data: account } = await supabase
      .from('social_accounts')
      .select('access_token')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single()

    // Revoke token on TikTok's side so the consent screen re-appears on next auth
    if (platform === 'tiktok' && account?.access_token && env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET) {
      try {
        const revokeResp = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: env.TIKTOK_CLIENT_KEY,
            client_secret: env.TIKTOK_CLIENT_SECRET,
            token: account.access_token,
          }),
        })
        console.log('[Social] TikTok revoke response:', revokeResp.status)
      } catch (revokeErr) {
        console.warn('[Social] TikTok token revoke failed (continuing disconnect):', revokeErr)
      }
    }

    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('[Social] Failed to disconnect:', err)
    res.status(500).json({ error: 'Failed to disconnect account' })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// OAUTH — INITIATION
// ════════════════════════════════════════════════════════════════════════════

/** GET /auth/:platform — return the OAuth authorization URL for the frontend to open */
router.get('/auth/:platform', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { platform } = req.params
  const state = crypto.randomBytes(16).toString('hex')

  try {
    let authUrl: string

    if (platform === 'instagram') {
      // Instagram Platform API (direct login — no Facebook Page needed)
      if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
        res.status(503).json({ error: 'Instagram App not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET.' })
        return
      }
      const scopes = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments'
      const redirectUri = env.INSTAGRAM_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/instagram`
      authUrl = `https://www.instagram.com/oauth/authorize?client_id=${env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`
      oauthStates.set(state, { userId, platform })
    } else if (platform === 'facebook') {
      if (!env.META_APP_ID || !env.META_APP_SECRET) {
        res.status(503).json({ error: 'Meta App not configured. Set META_APP_ID and META_APP_SECRET.' })
        return
      }
      const scopes = 'pages_show_list,pages_manage_posts,pages_read_engagement,business_management'
      const redirectUri = env.META_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/meta`
      authUrl = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code`
      oauthStates.set(state, { userId, platform })
    } else if (platform === 'tiktok') {
      if (!env.TIKTOK_CLIENT_KEY) {
        res.status(503).json({ error: 'TikTok app not configured. Set TIKTOK_CLIENT_KEY.' })
        return
      }
      // TikTok Web Login Kit does NOT use PKCE (only desktop does)
      const scopes = 'user.info.basic,user.info.profile,user.info.stats,video.publish,video.upload,video.list'
      const redirectUri = env.TIKTOK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/tiktok`
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${env.TIKTOK_CLIENT_KEY}&response_type=code&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
      oauthStates.set(state, { userId, platform })
    } else if (platform === 'x') {
      if (!env.X_CLIENT_ID) {
        res.status(503).json({ error: 'X app not configured. Set X_CLIENT_ID.' })
        return
      }
      const { verifier, challenge } = generatePKCE()
      const scopes = 'tweet.read tweet.write users.read media.write offline.access'
      const redirectUri = env.X_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/x`
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`
      oauthStates.set(state, { userId, platform, codeVerifier: verifier })
    } else if (platform === 'youtube') {
      if (!env.YOUTUBE_CLIENT_ID) {
        res.status(503).json({ error: 'YouTube app not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET.' })
        return
      }
      const { verifier, challenge } = generatePKCE()
      const scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
      const redirectUri = env.YOUTUBE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/youtube`
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${env.YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256&access_type=offline&prompt=consent`
      oauthStates.set(state, { userId, platform, codeVerifier: verifier })
    } else {
      res.status(400).json({ error: `Unknown platform: ${platform}` })
      return
    }

    res.json({ authUrl })
  } catch (err) {
    console.error(`[Social] Failed to generate auth URL for ${platform}:`, err)
    res.status(500).json({ error: 'Failed to initiate OAuth' })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// OAUTH — CALLBACKS
// ════════════════════════════════════════════════════════════════════════════

/** GET /callback/instagram — Instagram Platform API (direct login) callback */
router.get('/callback/instagram', async (req: Request, res: Response) => {
  const { code, state, error: oauthError, error_description } = req.query as Record<string, string>

  if (oauthError) {
    res.send(oauthCallbackHTML(false, 'instagram', error_description || oauthError))
    return
  }

  const stateData = oauthStates.get(state)
  if (!stateData) {
    res.send(oauthCallbackHTML(false, 'instagram', 'Invalid OAuth state. Please try again.'))
    return
  }
  oauthStates.delete(state)

  try {
    const redirectUri = env.INSTAGRAM_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/instagram`

    // Exchange code for short-lived token via Instagram API
    const tokenResp = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.INSTAGRAM_APP_ID,
        client_secret: env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = await tokenResp.json()
    if (tokenData.error_type || tokenData.error_message) {
      throw new Error(tokenData.error_message || tokenData.error_type)
    }

    const shortLivedToken = tokenData.access_token
    const igUserId = tokenData.user_id

    // Exchange for long-lived token (~60 days)
    const longResp = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${env.INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`
    )
    const longData = await longResp.json()
    const accessToken = longData.access_token || shortLivedToken
    const expiresIn = longData.expires_in // seconds

    // Fetch Instagram user info
    const meResp = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,profile_picture_url,account_type&access_token=${accessToken}`
    )
    const meData = await meResp.json()

    const supabase = getSupabaseAdmin()

    // Use meData.user_id (the IG business user ID needed for publishing),
    // NOT tokenData.user_id (which is the app-scoped ID)
    const publishUserId = meData.user_id || String(igUserId)
    console.log(`[Social] Instagram connected: username=${meData.username}, publishUserId=${publishUserId}, appScopedId=${igUserId}`)

    await supabase.from('social_accounts').upsert({
      user_id: stateData.userId,
      platform: 'instagram',
      access_token: accessToken,
      token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      platform_user_id: publishUserId,
      username: meData.username || 'Instagram User',
      avatar_url: meData.profile_picture_url || null,
      scopes: 'instagram_business_basic,instagram_business_content_publish',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    res.send(oauthCallbackHTML(true, 'instagram'))
  } catch (err: any) {
    console.error('[Social] Instagram OAuth callback error:', err)
    res.send(oauthCallbackHTML(false, 'instagram', err.message))
  }
})

/** GET /callback/meta — Facebook OAuth callback */
router.get('/callback/meta', async (req: Request, res: Response) => {
  const { code, state, error: oauthError, error_description } = req.query as Record<string, string>

  if (oauthError) {
    res.send(oauthCallbackHTML(false, 'facebook', error_description || oauthError))
    return
  }

  const stateData = oauthStates.get(state)
  if (!stateData) {
    res.send(oauthCallbackHTML(false, 'facebook', 'Invalid OAuth state. Please try again.'))
    return
  }
  oauthStates.delete(state)

  try {
    const redirectUri = env.META_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/meta`

    // Exchange code for short-lived token
    const tokenResp = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    )
    const tokenData = await tokenResp.json()
    if (tokenData.error) throw new Error(tokenData.error.message)

    // Exchange for long-lived token (~60 days)
    const longResp = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    )
    const longData = await longResp.json()
    if (longData.error) throw new Error(longData.error.message)

    const accessToken = longData.access_token
    const expiresIn = longData.expires_in // seconds

    // Fetch user info
    const meResp = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me?fields=id,name,picture&access_token=${accessToken}`
    )
    const meData = await meResp.json()

    // Fetch pages (needed for Facebook posting)
    const pagesResp = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    )
    const pagesData = await pagesResp.json()
    const pages = pagesData.data || []
    const firstPage = pages[0]

    const supabase = getSupabaseAdmin()

    await supabase.from('social_accounts').upsert({
      user_id: stateData.userId,
      platform: 'facebook',
      access_token: firstPage?.access_token || accessToken,
      token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      platform_user_id: meData.id,
      username: meData.name,
      avatar_url: meData.picture?.data?.url,
      page_id: firstPage?.id,
      page_name: firstPage?.name,
      scopes: 'pages_manage_posts,pages_read_engagement',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    res.send(oauthCallbackHTML(true, 'facebook'))
  } catch (err: any) {
    console.error('[Social] Facebook OAuth callback error:', err)
    res.send(oauthCallbackHTML(false, 'facebook', err.message))
  }
})

/** GET /callback/tiktok — TikTok OAuth callback */
router.get('/callback/tiktok', async (req: Request, res: Response) => {
  const { code, state, error: oauthError, error_description } = req.query as Record<string, string>

  if (oauthError) {
    res.send(oauthCallbackHTML(false, 'tiktok', error_description || oauthError))
    return
  }

  const stateData = oauthStates.get(state)
  if (!stateData) {
    res.send(oauthCallbackHTML(false, 'tiktok', 'Invalid OAuth state'))
    return
  }
  oauthStates.delete(state)

  try {
    const redirectUri = env.TIKTOK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/tiktok`

    // Exchange code for token (web flow — no PKCE verifier)
    const tokenResp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    const tokenData = await tokenResp.json()
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error)

    // Fetch user info (all fields for profile + stats scopes)
    const userResp = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,avatar_url_100,bio_description,profile_deep_link,is_verified,follower_count,following_count,video_count,likes_count',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    )
    const userData = await userResp.json()
    const user = userData.data?.user || {}

    const supabase = getSupabaseAdmin()
    await supabase.from('social_accounts').upsert({
      user_id: stateData.userId,
      platform: 'tiktok',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      platform_user_id: tokenData.open_id || user.open_id,
      username: user.display_name || 'TikTok User',
      avatar_url: user.avatar_url_100 || user.avatar_url,
      scopes: tokenData.scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    res.send(oauthCallbackHTML(true, 'tiktok'))
  } catch (err: any) {
    console.error('[Social] TikTok OAuth callback error:', err)
    res.send(oauthCallbackHTML(false, 'tiktok', err.message))
  }
})

/** GET /callback/x — X (Twitter) OAuth callback */
router.get('/callback/x', async (req: Request, res: Response) => {
  const { code, state, error: oauthError } = req.query as Record<string, string>

  if (oauthError) {
    res.send(oauthCallbackHTML(false, 'x', oauthError))
    return
  }

  const stateData = oauthStates.get(state)
  if (!stateData || !stateData.codeVerifier) {
    res.send(oauthCallbackHTML(false, 'x', 'Invalid OAuth state'))
    return
  }
  oauthStates.delete(state)

  try {
    const redirectUri = env.X_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/x`

    // Exchange code for token (with PKCE verifier)
    const tokenResp = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: stateData.codeVerifier,
      }),
    })
    const tokenData = await tokenResp.json()
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error)

    // Fetch user info
    const userResp = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const userData = await userResp.json()
    const user = userData.data || {}

    const supabase = getSupabaseAdmin()
    await supabase.from('social_accounts').upsert({
      user_id: stateData.userId,
      platform: 'x',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      platform_user_id: user.id,
      username: user.username || user.name || 'X User',
      avatar_url: user.profile_image_url,
      scopes: tokenData.scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    res.send(oauthCallbackHTML(true, 'x'))
  } catch (err: any) {
    console.error('[Social] X OAuth callback error:', err)
    res.send(oauthCallbackHTML(false, 'x', err.message))
  }
})

/** GET /callback/youtube — YouTube (Google OAuth 2.0) callback */
router.get('/callback/youtube', async (req: Request, res: Response) => {
  const { code, state, error: oauthError } = req.query as Record<string, string>

  if (oauthError) {
    res.send(oauthCallbackHTML(false, 'youtube', oauthError))
    return
  }

  const stateData = oauthStates.get(state)
  if (!stateData || !stateData.codeVerifier) {
    res.send(oauthCallbackHTML(false, 'youtube', 'Invalid OAuth state'))
    return
  }
  oauthStates.delete(state)

  try {
    const redirectUri = env.YOUTUBE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/social/callback/youtube`

    // Exchange code for token (with PKCE verifier)
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: stateData.codeVerifier,
      }),
    })
    const tokenData = await tokenResp.json()
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error)

    // Fetch channel info
    const channelResp = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    )
    const channelData = await channelResp.json()
    if (channelData.error && channelData.error.code !== 404) {
      throw new Error(channelData.error.message || 'Failed to fetch channel info')
    }

    const channel = channelData.items?.[0]
    if (!channel) {
      // User has no YouTube channel — tell them to create one first
      res.send(oauthCallbackHTML(false, 'youtube', 'No YouTube channel found. Please create a YouTube channel first at youtube.com, then try connecting again.'))
      return
    }
    const channelId = channel.id || ''
    const channelTitle = channel.snippet?.title || 'YouTube User'
    const channelThumbnail = channel.snippet?.thumbnails?.default?.url || null

    const supabase = getSupabaseAdmin()
    await supabase.from('social_accounts').upsert({
      user_id: stateData.userId,
      platform: 'youtube',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      platform_user_id: channelId,
      username: channelTitle,
      avatar_url: channelThumbnail,
      scopes: tokenData.scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    res.send(oauthCallbackHTML(true, 'youtube'))
  } catch (err: any) {
    console.error('[Social] YouTube OAuth callback error:', err)
    res.send(oauthCallbackHTML(false, 'youtube', err.message))
  }
})

// ════════════════════════════════════════════════════════════════════════════
// PUBLISHING
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /publish/instagram
 * Body (JSON): { videoUrl, caption, hashtags, postType, coverImageTimestamp }
 * The videoUrl must be a publicly accessible URL (e.g. Supabase Storage public URL).
 */
router.post('/publish/instagram', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const { videoUrl, caption, hashtags, postType, coverImageTimestamp } = req.body
    if (!videoUrl) {
      res.status(400).json({ error: 'videoUrl is required (publicly accessible URL)' })
      return
    }

    const token = await getValidToken(userId, 'instagram')

    // Get IG user ID from stored account
    const supabase = getSupabaseAdmin()
    const { data: account } = await supabase
      .from('social_accounts')
      .select('platform_user_id')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .single()

    if (!account?.platform_user_id) throw new Error('Instagram account not properly linked')

    const igUserId = account.platform_user_id
    const fullCaption = hashtags ? `${caption}\n\n${hashtags}` : caption

    // Step 1: Create media container (using Instagram Graph API)
    // Use form-encoded params via URL query string (most reliable for Instagram API)
    const containerUrl = new URL(`https://graph.instagram.com/v21.0/${igUserId}/media`)
    containerUrl.searchParams.set('video_url', videoUrl)
    containerUrl.searchParams.set('caption', fullCaption || '')
    containerUrl.searchParams.set('media_type', 'REELS')
    containerUrl.searchParams.set('share_to_feed', 'true')
    containerUrl.searchParams.set('access_token', token)

    console.log(`[Social] Instagram publish: creating container for user ${igUserId}`)
    console.log(`[Social] Instagram publish: videoUrl=${videoUrl}`)
    console.log(`[Social] Instagram publish: token starts with ${token.substring(0, 20)}...`)

    const containerResp = await fetch(containerUrl.toString(), { method: 'POST' })
    const containerData = await containerResp.json()
    console.log(`[Social] Instagram container response:`, JSON.stringify(containerData))
    if (containerData.error) throw new Error(containerData.error.message || JSON.stringify(containerData.error))

    const containerId = containerData.id
    console.log(`[Social] Instagram container created: ${containerId}`)

    // Step 2: Poll container status until ready
    let status = 'IN_PROGRESS'
    let attempts = 0
    while (status === 'IN_PROGRESS' && attempts < 60) {
      await new Promise((r) => setTimeout(r, 5000))
      const statusResp = await fetch(
        `https://graph.instagram.com/${GRAPH_API_VERSION}/${containerId}?fields=status_code,status&access_token=${token}`
      )
      const statusData = await statusResp.json()
      status = statusData.status_code || 'ERROR'
      attempts++
      console.log(`[Social] Instagram container status: ${status} (attempt ${attempts})`)

      if (status === 'ERROR') {
        throw new Error(`Instagram media processing failed: ${statusData.status || 'Unknown error'}`)
      }
    }

    if (status !== 'FINISHED') {
      throw new Error('Instagram media processing timed out')
    }

    // Step 3: Publish the container
    const publishUrl = `https://graph.instagram.com/v21.0/${igUserId}/media_publish?creation_id=${containerId}&access_token=${token}`
    const publishResp = await fetch(publishUrl, { method: 'POST' })
    const publishData = await publishResp.json()
    if (publishData.error) throw new Error(publishData.error.message || JSON.stringify(publishData.error))

    // Get permalink
    const mediaResp = await fetch(
      `https://graph.instagram.com/v21.0/${publishData.id}?fields=permalink&access_token=${token}`
    )
    const mediaData = await mediaResp.json()

    res.json({
      success: true,
      postId: publishData.id,
      postUrl: mediaData.permalink || `https://www.instagram.com/p/${publishData.id}/`,
    })
  } catch (err: any) {
    console.error('[Social] Instagram publish error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /publish/facebook
 * Body (JSON): { videoUrl, description, privacy, scheduledTime }
 */
router.post('/publish/facebook', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const { videoUrl, description, privacy, scheduledTime } = req.body
    if (!videoUrl) {
      res.status(400).json({ error: 'videoUrl is required' })
      return
    }

    const token = await getValidToken(userId, 'facebook')

    const supabase = getSupabaseAdmin()
    const { data: account } = await supabase
      .from('social_accounts')
      .select('page_id')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single()

    if (!account?.page_id) throw new Error('No Facebook page linked')

    const params: Record<string, string> = {
      file_url: videoUrl,
      description: description || '',
      access_token: token,
    }

    // Privacy mapping
    if (privacy === 'friends') params.privacy = JSON.stringify({ value: 'ALL_FRIENDS' })
    else if (privacy === 'only_me') params.privacy = JSON.stringify({ value: 'SELF' })

    // Scheduled post
    if (scheduledTime) {
      params.scheduled_publish_time = String(Math.floor(new Date(scheduledTime).getTime() / 1000))
      params.published = 'false'
    }

    const resp = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.page_id}/videos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }
    )
    const data = await resp.json()
    if (data.error) throw new Error(data.error.message)

    res.json({
      success: true,
      postId: data.id,
      postUrl: `https://www.facebook.com/${data.id}`,
    })
  } catch (err: any) {
    console.error('[Social] Facebook publish error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /tiktok/profile — Fetch live TikTok profile + stats
 * Demonstrates user.info.basic + user.info.profile + user.info.stats scopes
 */
router.get('/tiktok/profile', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const token = await getValidToken(userId, 'tiktok')

    // Try full fields first, fall back to basic fields if some scopes aren't granted
    let user: any = {}

    const fullFields = 'open_id,display_name,avatar_url,avatar_url_100,bio_description,profile_deep_link,is_verified,follower_count,following_count,video_count,likes_count'
    const basicFields = 'open_id,display_name,avatar_url'

    for (const fields of [fullFields, basicFields]) {
      const userResp = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const userData = await userResp.json()
      console.log('[Social] TikTok profile response:', JSON.stringify(userData).slice(0, 500))

      if (userData.data?.user) {
        user = userData.data.user
        break
      }
      if (userData.error) {
        // If full fields fail, try basic
        if (fields === basicFields) {
          throw new Error(userData.error.message || JSON.stringify(userData.error))
        }
        console.warn('[Social] TikTok full profile fields failed, trying basic:', userData.error)
        continue
      }
    }

    res.json({
      openId: user.open_id,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      avatarUrl100: user.avatar_url_100,
      bioDescription: user.bio_description,
      profileDeepLink: user.profile_deep_link,
      isVerified: user.is_verified,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      videoCount: user.video_count,
      likesCount: user.likes_count,
    })
  } catch (err: any) {
    console.error('[Social] TikTok profile fetch error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /tiktok/videos — Fetch user's published TikTok videos
 * Demonstrates video.list scope
 * Query params: cursor (optional pagination cursor)
 */
router.get('/tiktok/videos', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const token = await getValidToken(userId, 'tiktok')
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined

    const body: any = { max_count: 20 }
    if (cursor) body.cursor = cursor

    const listResp = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,video_description,duration,create_time,share_url,view_count,like_count,comment_count,share_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )
    const listData = await listResp.json()
    console.log('[Social] TikTok videos response:', JSON.stringify(listData).slice(0, 500))
    if (listData.error?.code && listData.error.code !== 'ok') {
      throw new Error(listData.error.message || JSON.stringify(listData.error))
    }

    const videos = (listData.data?.videos || []).map((v: any) => ({
      id: v.id,
      title: v.title || '',
      coverImageUrl: v.cover_image_url || '',
      videoDescription: v.video_description || '',
      duration: v.duration || 0,
      createTime: v.create_time || 0,
      shareUrl: v.share_url || '',
      viewCount: v.view_count,
      likeCount: v.like_count,
      commentCount: v.comment_count,
      shareCount: v.share_count,
    }))

    res.json({
      videos,
      cursor: listData.data?.cursor || 0,
      hasMore: listData.data?.has_more || false,
    })
  } catch (err: any) {
    console.error('[Social] TikTok videos fetch error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /publish/tiktok
 * Body (JSON): { videoUrl, description, hashtags, privacy, allowComments, allowDuets, allowStitches, postMode }
 * postMode: 'direct' (default) uses video.publish scope, 'draft' uses video.upload scope (inbox)
 *
 * Uses FILE_UPLOAD (chunked) instead of PULL_FROM_URL to avoid domain verification.
 * Server downloads the video from videoUrl, then uploads it directly to TikTok.
 */
router.post('/publish/tiktok', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const { videoUrl, description, hashtags, privacy, allowComments, allowDuets, allowStitches, postMode = 'direct', brandContentToggle = false, brandOrganicToggle = false } = req.body
    if (!videoUrl) {
      res.status(400).json({ error: 'videoUrl is required' })
      return
    }

    const token = await getValidToken(userId, 'tiktok')

    const fullDescription = hashtags ? `${description} ${hashtags}` : description

    // Step 1: Query creator info to get allowed privacy levels (required by TikTok guidelines)
    console.log('[Social] TikTok: querying creator info...')
    const creatorResp = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    })
    const creatorData = await creatorResp.json()
    console.log('[Social] TikTok creator info:', JSON.stringify(creatorData).slice(0, 500))

    // Use the privacy level from creator info options, defaulting to SELF_ONLY for sandbox
    const allowedPrivacy = creatorData.data?.privacy_level_options || ['SELF_ONLY']
    const creatorCommentDisabled = creatorData.data?.comment_disabled ?? false
    const creatorDuetDisabled = creatorData.data?.duet_disabled ?? false
    const creatorStitchDisabled = creatorData.data?.stitch_disabled ?? false

    // Pick the best privacy level: use SELF_ONLY if available, otherwise first allowed option
    const resolvedPrivacy = allowedPrivacy.includes('SELF_ONLY') ? 'SELF_ONLY' : allowedPrivacy[0]
    console.log('[Social] TikTok: resolved privacy:', resolvedPrivacy, 'allowed:', allowedPrivacy)

    // Step 2: Download the video to get its size
    console.log('[Social] TikTok: downloading video from', videoUrl)
    const videoResp = await fetch(videoUrl)
    if (!videoResp.ok) throw new Error(`Failed to download video: ${videoResp.status}`)
    const videoBuffer = Buffer.from(await videoResp.arrayBuffer())
    const videoSize = videoBuffer.length
    console.log('[Social] TikTok: video size', videoSize, 'bytes')

    // Choose endpoint based on post mode
    const publishEndpoint = postMode === 'draft'
      ? 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/'
      : 'https://open.tiktokapis.com/v2/post/publish/video/init/'

    // Step 3: Initialize upload with FILE_UPLOAD source
    const initResp = await fetch(publishEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: fullDescription || '',
          privacy_level: resolvedPrivacy,
          disable_comment: creatorCommentDisabled || !allowComments,
          disable_duet: creatorDuetDisabled || !allowDuets,
          disable_stitch: creatorStitchDisabled || !allowStitches,
          brand_content_toggle: brandContentToggle,
          brand_organic_toggle: brandOrganicToggle,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize, // Single chunk for simplicity (max 64MB)
          total_chunk_count: 1,
        },
      }),
    })
    const initData = await initResp.json()
    console.log('[Social] TikTok init response:', JSON.stringify(initData).slice(0, 500))
    if (initData.error?.code && initData.error.code !== 'ok') {
      throw new Error(initData.error.message || 'TikTok upload init failed')
    }

    const publishId = initData.data?.publish_id
    const uploadUrl = initData.data?.upload_url
    if (!uploadUrl) throw new Error('TikTok did not return an upload URL')

    // Step 3: Upload the video chunk
    console.log('[Social] TikTok: uploading video chunk to', uploadUrl.slice(0, 80))
    const uploadResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoSize.toString(),
        'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      body: videoBuffer,
    })

    if (!uploadResp.ok) {
      const uploadErr = await uploadResp.text()
      console.error('[Social] TikTok upload error:', uploadResp.status, uploadErr)
      throw new Error(`TikTok video upload failed: ${uploadResp.status}`)
    }
    console.log('[Social] TikTok: upload complete, polling status...')

    // Step 4: Poll publish status
    // Terminal states: PUBLISH_COMPLETE (direct), SEND_TO_USER_INBOX (draft), FAILED
    let status = 'PROCESSING_UPLOAD'
    let attempts = 0
    const successStatuses = new Set(['PUBLISH_COMPLETE', 'SEND_TO_USER_INBOX'])
    const processingStatuses = new Set(['PROCESSING_UPLOAD', 'PROCESSING_DOWNLOAD', 'SENDING_TO_USER_INBOX'])

    while (processingStatuses.has(status) && attempts < 60) {
      await new Promise((r) => setTimeout(r, 5000))
      const statusResp = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publish_id: publishId }),
      })
      const statusData = await statusResp.json()
      status = statusData.data?.status || 'FAILED'
      attempts++
      console.log('[Social] TikTok publish status:', status, `(attempt ${attempts})`)

      if (status === 'FAILED') {
        throw new Error(`TikTok publishing failed: ${statusData.data?.fail_reason || 'Unknown'}`)
      }
      if (successStatuses.has(status)) break
    }

    res.json({
      success: true,
      postId: publishId,
      postUrl: '',
      postMode,
    })
  } catch (err: any) {
    console.error('[Social] TikTok publish error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /publish/x
 * Body (JSON): { videoUrl, tweetText, mediaAltText, threadContinuation }
 *
 * X requires chunked media upload, then tweet creation.
 * The videoUrl must be fetchable from the server.
 */
router.post('/publish/x', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const { videoUrl, tweetText, mediaAltText } = req.body
    if (!videoUrl || !tweetText) {
      res.status(400).json({ error: 'videoUrl and tweetText are required' })
      return
    }

    const token = await getValidToken(userId, 'x')

    // Step 1: Download video from URL to get size and buffer
    const videoResp = await fetch(videoUrl)
    if (!videoResp.ok) throw new Error('Failed to fetch video from URL')
    const videoBuffer = Buffer.from(await videoResp.arrayBuffer())
    const totalBytes = videoBuffer.length
    const mimeType = videoResp.headers.get('content-type') || 'video/mp4'

    // X API v2 chunked media upload
    // Paths: /initialize, /{id}/append, /{id}/finalize, /{id}
    const BASE = 'https://api.x.com/2/media/upload'

    // Step 2: INITIALIZE (JSON)
    console.log('[Social] X: starting chunked upload, size:', totalBytes)
    const initResp = await fetch(`${BASE}/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_type: mimeType,
        total_bytes: totalBytes,
        media_category: 'amplify_video',
      }),
    })
    const initText = await initResp.text()
    console.log('[Social] X INIT response:', initResp.status, initText.slice(0, 500))
    if (!initResp.ok) throw new Error(`X media INIT failed (${initResp.status}): ${initText.slice(0, 200)}`)
    const initData = JSON.parse(initText)
    const mediaId = initData.data?.id || initData.media_id_string
    if (!mediaId) throw new Error('X media INIT: no media_id returned')
    console.log('[Social] X: media_id =', mediaId)

    // Step 3: APPEND chunks (1MB max for v2)
    const chunkSize = 1 * 1024 * 1024
    for (let i = 0; i * chunkSize < totalBytes; i++) {
      const chunk = videoBuffer.subarray(i * chunkSize, (i + 1) * chunkSize)
      const appendForm = new FormData()
      appendForm.append('segment_index', String(i))
      appendForm.append('media', new Blob([chunk], { type: 'application/octet-stream' }), 'chunk')

      const appendResp = await fetch(`${BASE}/${mediaId}/append`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: appendForm,
      })
      console.log('[Social] X APPEND chunk', i, 'status:', appendResp.status)
      if (!appendResp.ok) {
        const appendErr = await appendResp.text()
        throw new Error(`X media APPEND failed (${appendResp.status}): ${appendErr.slice(0, 200)}`)
      }
    }

    // Step 4: FINALIZE (JSON)
    const finalResp = await fetch(`${BASE}/${mediaId}/finalize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const finalText = await finalResp.text()
    console.log('[Social] X FINALIZE response:', finalResp.status, finalText.slice(0, 500))
    if (!finalResp.ok) throw new Error(`X media FINALIZE failed (${finalResp.status}): ${finalText.slice(0, 200)}`)
    const finalData = JSON.parse(finalText)

    // Step 5: Wait for processing if needed
    const processingInfo = finalData.data?.processing_info || finalData.processing_info
    if (processingInfo) {
      let processingState = processingInfo.state
      let checkAfter = processingInfo.check_after_secs || 5
      while (processingState === 'pending' || processingState === 'in_progress') {
        console.log('[Social] X: media processing state:', processingState, '- waiting', checkAfter, 's')
        await new Promise((r) => setTimeout(r, checkAfter * 1000))

        const checkResp = await fetch(
          `${BASE}?media_id=${mediaId}&command=STATUS`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const checkText = await checkResp.text()
        if (!checkResp.ok) throw new Error(`X media STATUS failed (${checkResp.status}): ${checkText.slice(0, 200)}`)
        const checkData = JSON.parse(checkText)
        const checkInfo = checkData.data?.processing_info || checkData.processing_info
        processingState = checkInfo?.state || 'succeeded'
        checkAfter = checkInfo?.check_after_secs || 5

        if (processingState === 'failed') {
          throw new Error(`X media processing failed: ${checkInfo?.error?.message || 'Unknown'}`)
        }
      }
      console.log('[Social] X: media processing complete')
    }

    // Step 6: Set alt text if provided
    if (mediaAltText) {
      await fetch(BASE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_id: mediaId,
          alt_text: { text: mediaAltText },
        }),
      })
    }

    // Step 7: Create tweet
    console.log('[Social] X: creating tweet with media_id:', mediaId)
    const tweetResp = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: tweetText,
        media: { media_ids: [mediaId] },
      }),
    })
    const tweetText2 = await tweetResp.text()
    console.log('[Social] X tweet response:', tweetResp.status, tweetText2.slice(0, 500))
    if (!tweetResp.ok) throw new Error(`X tweet creation failed (${tweetResp.status}): ${tweetText2.slice(0, 200)}`)
    const tweetData = JSON.parse(tweetText2)
    if (tweetData.errors) throw new Error(tweetData.errors[0]?.message || 'Tweet creation failed')

    const tweetId = tweetData.data?.id

    // Get the username for the URL
    const supabase = getSupabaseAdmin()
    const { data: account } = await supabase
      .from('social_accounts')
      .select('username')
      .eq('user_id', userId)
      .eq('platform', 'x')
      .single()

    res.json({
      success: true,
      postId: tweetId,
      postUrl: account?.username ? `https://x.com/${account.username}/status/${tweetId}` : '',
    })
  } catch (err: any) {
    console.error('[Social] X publish error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /publish/youtube
 * Body (JSON): { videoUrl, title, description, tags, privacy, madeForKids, uploadType }
 * uploadType: 'short' (YouTube Short) or 'long' (regular video)
 *
 * Uses YouTube Data API v3 resumable upload flow.
 * The videoUrl must be fetchable from the server.
 */
router.post('/publish/youtube', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const { videoUrl, title, description, tags, privacy, madeForKids, uploadType } = req.body
    if (!videoUrl || !title) {
      res.status(400).json({ error: 'videoUrl and title are required' })
      return
    }

    const isShort = uploadType === 'short'
    const token = await getValidToken(userId, 'youtube')

    // Step 1: Download video from URL to get buffer
    const videoResp = await fetch(videoUrl)
    if (!videoResp.ok) throw new Error('Failed to fetch video from URL')
    const videoBuffer = Buffer.from(await videoResp.arrayBuffer())
    const totalBytes = videoBuffer.length
    const mimeType = videoResp.headers.get('content-type') || 'video/mp4'

    // Build video title (prepend #Shorts for short-form uploads)
    const videoTitle = isShort && !title.includes('#Shorts')
      ? `${title} #Shorts`
      : title

    // Parse tags string into array
    const tagArray = tags
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : []

    // Step 2: Initiate resumable upload
    const initResp = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': String(totalBytes),
          'X-Upload-Content-Type': mimeType,
        },
        body: JSON.stringify({
          snippet: {
            title: videoTitle,
            description: description || '',
            tags: tagArray,
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: privacy || 'public',
            selfDeclaredMadeForKids: !!madeForKids,
          },
        }),
      }
    )

    if (!initResp.ok) {
      const errData = await initResp.json().catch(() => ({}))
      throw new Error(errData.error?.message || `YouTube upload init failed (${initResp.status})`)
    }

    const uploadUrl = initResp.headers.get('location')
    if (!uploadUrl) throw new Error('YouTube did not return a resumable upload URL')

    // Step 3: Upload the video bytes
    const uploadResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(totalBytes),
      },
      body: videoBuffer,
    })

    const uploadData = await uploadResp.json()
    if (!uploadResp.ok || !uploadData.id) {
      throw new Error(uploadData.error?.message || 'YouTube video upload failed')
    }

    const videoId = uploadData.id
    console.log(`[Social] YouTube video uploaded: ${videoId} (${isShort ? 'Short' : 'Long'})`)

    res.json({
      success: true,
      postId: videoId,
      postUrl: isShort
        ? `https://youtube.com/shorts/${videoId}`
        : `https://youtube.com/watch?v=${videoId}`,
    })
  } catch (err: any) {
    console.error('[Social] YouTube publish error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ════════════════════════════════════════════════════════════════════════════
// ANALYTICS / METRICS
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /metrics/:platform/:postId — Fetch real metrics for a published post
 */
router.get('/metrics/:platform/:postId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { platform, postId } = req.params

  try {
    const token = await getValidToken(userId, platform)
    const now = new Date().toISOString()

    if (platform === 'instagram') {
      // Instagram Graph API — fetch media insights
      // Basic media fields
      const mediaResp = await fetch(
        `https://graph.instagram.com/${GRAPH_API_VERSION}/${postId}?fields=like_count,comments_count,timestamp,permalink,media_type&access_token=${token}`
      )
      const mediaData = await mediaResp.json()
      if (mediaData.error) throw new Error(mediaData.error.message)

      // Insights (for reels/video: reach, plays, saved, shares, total_interactions)
      const insightsResp = await fetch(
        `https://graph.instagram.com/${GRAPH_API_VERSION}/${postId}/insights?metric=reach,saved,shares,total_interactions,plays,ig_reels_avg_watch_time,ig_reels_video_view_total_time&access_token=${token}`
      )
      const insightsData = await insightsResp.json()

      // Parse insights into a map
      const insights: Record<string, number> = {}
      if (insightsData.data) {
        for (const metric of insightsData.data) {
          insights[metric.name] = metric.values?.[0]?.value ?? 0
        }
      }

      // Get profile activity insights if available
      let profileVisits = 0
      let followsFromPost = 0
      try {
        const profileResp = await fetch(
          `https://graph.instagram.com/${GRAPH_API_VERSION}/${postId}/insights?metric=profile_visits,follows&access_token=${token}`
        )
        const profileData = await profileResp.json()
        if (profileData.data) {
          for (const metric of profileData.data) {
            if (metric.name === 'profile_visits') profileVisits = metric.values?.[0]?.value ?? 0
            if (metric.name === 'follows') followsFromPost = metric.values?.[0]?.value ?? 0
          }
        }
      } catch {
        // Some metrics may not be available for all media types
      }

      const views = insights.plays || insights.impressions || 0
      const likes = mediaData.like_count || 0
      const comments = mediaData.comments_count || 0
      const shares = insights.shares || 0
      const saves = insights.saved || 0
      const reach = insights.reach || 0
      const totalInteractions = insights.total_interactions || (likes + comments + shares + saves)
      const engagementRate = reach > 0 ? (totalInteractions / reach) * 100 : 0

      // Average watch time: ig_reels_avg_watch_time is in milliseconds
      const avgWatchTimeMs = insights.ig_reels_avg_watch_time || 0
      const avgWatchTimeSec = avgWatchTimeMs / 1000

      res.json({
        views,
        likes,
        comments,
        shares,
        saves,
        engagementRate: Math.round(engagementRate * 10) / 10,
        avgWatchTimeSec: Math.round(avgWatchTimeSec * 10) / 10,
        lastFetchedAt: now,
        // Instagram-specific
        reach,
        impressions: insights.plays || views,
        profileVisits,
        followsFromPost,
        storyReplies: 0,
      })
    } else if (platform === 'facebook') {
      // Facebook Graph API — fetch video insights
      const videoResp = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${postId}?fields=description,created_time,permalink_url&access_token=${token}`
      )
      const videoData = await videoResp.json()
      if (videoData.error) throw new Error(videoData.error.message)

      // Video insights
      const insightsResp = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${postId}/video_insights?metric=total_video_views,total_video_impressions,total_video_avg_time_watched,total_video_view_total_time&access_token=${token}`
      )
      const insightsData = await insightsResp.json()

      const insights: Record<string, number> = {}
      if (insightsData.data) {
        for (const metric of insightsData.data) {
          insights[metric.name] = metric.values?.[0]?.value ?? 0
        }
      }

      // Reactions/likes/comments
      const reactionsResp = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${postId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${token}`
      )
      const reactionsData = await reactionsResp.json()

      const views = insights.total_video_views || 0
      const likes = reactionsData.reactions?.summary?.total_count || 0
      const commentsCount = reactionsData.comments?.summary?.total_count || 0
      const sharesCount = reactionsData.shares?.count || 0
      const impressions = insights.total_video_impressions || views
      const avgWatchTimeSec = (insights.total_video_avg_time_watched || 0) / 1000
      const engagementRate = impressions > 0 ? ((likes + commentsCount + sharesCount) / impressions) * 100 : 0

      res.json({
        views,
        likes,
        comments: commentsCount,
        shares: sharesCount,
        saves: 0,
        engagementRate: Math.round(engagementRate * 10) / 10,
        avgWatchTimeSec: Math.round(avgWatchTimeSec * 10) / 10,
        lastFetchedAt: now,
        // Facebook-specific
        reach: impressions,
        impressions,
        clicks: 0,
        ctaClicks: 0,
        demographicsAge: {},
        demographicsGender: {},
      })
    } else if (platform === 'tiktok') {
      // TikTok API — video query
      const queryResp = await fetch('https://open.tiktokapis.com/v2/video/query/?fields=like_count,comment_count,share_count,view_count,title', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: { video_ids: [postId] },
        }),
      })
      const queryData = await queryResp.json()
      const video = queryData.data?.videos?.[0] || {}

      const views = video.view_count || 0
      const likes = video.like_count || 0
      const commentsCount = video.comment_count || 0
      const shares = video.share_count || 0
      const engagementRate = views > 0 ? ((likes + commentsCount + shares) / views) * 100 : 0

      res.json({
        views,
        likes,
        comments: commentsCount,
        shares,
        saves: 0,
        engagementRate: Math.round(engagementRate * 10) / 10,
        avgWatchTimeSec: 0,
        lastFetchedAt: now,
        // TikTok-specific
        fullVideoViewsPercent: 0,
        trafficSources: {},
        audienceTerritories: {},
      })
    } else if (platform === 'x') {
      // X API v2 — tweet metrics
      const tweetResp = await fetch(
        `https://api.x.com/2/tweets/${postId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const tweetData = await tweetResp.json()
      if (tweetData.errors) throw new Error(tweetData.errors[0]?.message || 'Failed to fetch tweet')

      const pub = tweetData.data?.public_metrics || {}
      const nonPub = tweetData.data?.non_public_metrics || {}
      const organic = tweetData.data?.organic_metrics || {}

      const views = pub.impression_count || 0
      const likes = pub.like_count || 0
      const commentsCount = pub.reply_count || 0
      const retweets = pub.retweet_count || 0
      const quoteTweets = pub.quote_count || 0
      const bookmarks = pub.bookmark_count || 0
      const urlClicks = nonPub.url_link_clicks || 0
      const profileClicks = nonPub.user_profile_clicks || 0
      const engagementRate = views > 0 ? ((likes + commentsCount + retweets) / views) * 100 : 0

      res.json({
        views,
        likes,
        comments: commentsCount,
        shares: retweets,
        saves: bookmarks,
        engagementRate: Math.round(engagementRate * 10) / 10,
        avgWatchTimeSec: 0,
        lastFetchedAt: now,
        // X-specific
        impressions: views,
        retweets,
        quoteTweets,
        bookmarks,
        urlClicks,
        profileClicks,
        followerGrowth: 0,
      })
    } else {
      res.status(400).json({ error: `Unknown platform: ${platform}` })
      return
    }
  } catch (err: any) {
    console.error(`[Social] Metrics fetch error (${platform}):`, err)
    res.status(500).json({ error: err.message })
  }
})

// ── Scheduling endpoints ─────────────────────────────────────────────────

/** Schedule a post for future publishing */
router.post('/schedule', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { platform, videoUrl, recordingId, options, scheduledAt } = req.body

    if (!platform || !videoUrl || !scheduledAt) {
      res.status(400).json({ error: 'Missing required fields: platform, videoUrl, scheduledAt' })
      return
    }

    const supabase = getSupabaseAdmin()
    const id = `sp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        id,
        user_id: userId,
        platform,
        video_url: videoUrl,
        recording_id: recordingId || '',
        options: options || {},
        scheduled_at: scheduledAt,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({
      id: data.id,
      platform: data.platform,
      scheduledAt: data.scheduled_at,
      status: data.status,
      options: data.options,
      videoUrl: data.video_url,
      recordingId: data.recording_id,
      createdAt: data.created_at,
    })
  } catch (err: any) {
    console.error('[Social] Schedule error:', err)
    res.status(500).json({ error: err.message })
  }
})

/** List scheduled posts for the current user */
router.get('/scheduled', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    const posts = (data || []).map((row: any) => ({
      id: row.id,
      platform: row.platform,
      scheduledAt: row.scheduled_at,
      status: row.status,
      options: row.options,
      videoUrl: row.video_url,
      recordingId: row.recording_id,
      createdAt: row.created_at,
      result: row.result,
    }))

    res.json({ posts })
  } catch (err: any) {
    console.error('[Social] Fetch scheduled error:', err)
    res.status(500).json({ error: err.message })
  }
})

/** Cancel a pending scheduled post */
router.delete('/scheduled/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error('[Social] Cancel scheduled error:', err)
    res.status(500).json({ error: err.message })
  }
})

/** Get publish status of an async job */
router.get('/publish-status/:jobId', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', req.params.jobId)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    res.json({
      jobId: data.id,
      platform: data.platform,
      status: data.status,
      postUrl: data.result?.postUrl,
      error: data.result?.error,
      startedAt: data.created_at,
    })
  } catch (err: any) {
    console.error('[Social] Status check error:', err)
    res.status(500).json({ error: err.message })
  }
})

/** Generate AI metadata for publishing */
router.post('/generate-metadata', requireAuth, async (req: Request, res: Response) => {
  try {
    const { contentSummary, platform, tone } = req.body

    if (!contentSummary) {
      res.status(400).json({ error: 'Missing contentSummary' })
      return
    }

    // Use Gemini API for metadata generation (server-side)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    if (!geminiKey) {
      res.status(501).json({ error: 'Gemini API key not configured on server' })
      return
    }

    const platformName = platform || 'social media'
    const toneStr = tone ? ` The tone should be ${tone}.` : ''

    const prompt = `You are a social media expert. Generate optimized metadata for posting a short video to ${platformName}.${toneStr}

Content summary: "${contentSummary}"

Respond with ONLY valid JSON:
{
  "title": "short catchy title (max 100 chars)",
  "description": "engaging description",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "suggestedPostingTime": "best time in 24h format"
}`

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      },
    )

    if (!geminiResp.ok) {
      res.status(500).json({ error: 'Gemini API error' })
      return
    }

    const geminiData = await geminiResp.json()
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      res.status(500).json({ error: 'Failed to parse Gemini response' })
      return
    }

    const parsed = JSON.parse(jsonMatch[0])
    res.json({
      title: parsed.title || '',
      description: parsed.description || '',
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      suggestedPostingTime: parsed.suggestedPostingTime,
    })
  } catch (err: any) {
    console.error('[Social] Metadata generation error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
