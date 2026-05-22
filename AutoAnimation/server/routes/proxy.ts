/**
 * Backend proxy routes for external API calls.
 *
 * Proxies frontend requests to Gemini, ElevenLabs, Pixabay, and Freesound
 * so that API keys never leave the server.  The frontend sends requests to
 * /api/proxy/<service>/… and this router attaches the secret key before
 * forwarding to the real upstream.
 */

import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import logger from '../lib/logger'
import { requireAuth, getSupabaseAdmin } from '../middleware/supabaseAuth'

// Multer for handling multipart/form-data (voice cloning file uploads)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const router = Router()

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEnv(key: string): string {
  return process.env[key] || ''
}

function missingKey(res: Response, service: string): void {
  res.status(503).json({ error: `${service} API key not configured on server` })
}

// ── Service Availability Status ───────────────────────────────────────────────
// GET /api/proxy/:service/status — check if a service API key is configured

router.get('/:service(gemini|elevenlabs|pixabay|pexels|freesound)/status', requireAuth, (req: Request, res: Response) => {
  const keyMap: Record<string, string[]> = {
    gemini: ['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY'],
    elevenlabs: ['ELEVENLABS_API_KEY', 'VITE_ELEVENLABS_API_KEY'],
    pixabay: ['PIXABAY_API_KEY', 'VITE_PIXABAY_API_KEY'],
    pexels: ['PEXELS_API_KEY', 'VITE_PEXELS_API_KEY'],
    freesound: ['FREESOUND_API_KEY', 'VITE_FREESOUND_API_KEY'],
  }
  const keys = keyMap[req.params.service] || []
  const configured = keys.some((k) => !!process.env[k])
  res.json({ configured })
})

// ── Gemini Proxy ─────────────────────────────────────────────────────────────
// POST /api/proxy/gemini/:model
// Forwards the request body to the Gemini generativelanguage API.
// The :model param allows callers to choose a model (e.g. "gemini-3-flash-preview").

const ALLOWED_MODELS = new Set([
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-image-preview',
])
const ALLOWED_ACTIONS = new Set([
  'generateContent',
])
const SAFE_PARAM_RE = /^[a-zA-Z0-9.\-]+$/

router.post('/gemini/:model?', requireAuth, async (req: Request, res: Response) => {
  const apiKey = getEnv('GEMINI_API_KEY') || getEnv('VITE_GEMINI_API_KEY')
  if (!apiKey) return missingKey(res, 'Gemini')

  const model = req.params.model || 'gemini-3.1-flash-lite-preview'
  const action = (req.query.action as string) || 'generateContent'

  if (!SAFE_PARAM_RE.test(model) || !ALLOWED_MODELS.has(model)) {
    res.status(400).json({ error: `Invalid model: ${model}` })
    return
  }
  if (!SAFE_PARAM_RE.test(action) || !ALLOWED_ACTIONS.has(action)) {
    res.status(400).json({ error: `Invalid action: ${action}` })
    return
  }

  const upstream = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}?key=${apiKey}`

  let upstreamStatus: number | null = null
  let upstreamBodyPreview: string | null = null

  try {
    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })

    upstreamStatus = upstreamRes.status
    const contentType = upstreamRes.headers.get('content-type') || 'application/json'

    const buffer = await upstreamRes.arrayBuffer()

    // Log non-2xx upstream responses with the actual error body so we can debug.
    if (!upstreamRes.ok) {
      try {
        upstreamBodyPreview = Buffer.from(buffer).toString('utf-8').slice(0, 500)
      } catch {
        upstreamBodyPreview = '(non-utf8 body)'
      }
      logger.warn(
        { model, action, upstreamStatus, upstreamBodyPreview, requestKeys: Object.keys(req.body || {}) },
        '[proxy/gemini] Upstream returned non-2xx',
      )
    }

    res.status(upstreamRes.status).set('Content-Type', contentType)
    // Forward Retry-After so the client's fetchWithRetry can honor Gemini's suggested delay.
    const retryAfter = upstreamRes.headers.get('Retry-After')
    if (retryAfter) res.set('Retry-After', retryAfter)
    res.send(Buffer.from(buffer))
  } catch (err) {
    logger.error(
      {
        err,
        errMessage: err instanceof Error ? err.message : String(err),
        errStack: err instanceof Error ? err.stack : undefined,
        model,
        action,
        upstreamStatus,
        requestKeys: Object.keys(req.body || {}),
      },
      '[proxy/gemini] Caught error',
    )
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Failed to proxy Gemini request',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
})

// ── ElevenLabs Proxy ─────────────────────────────────────────────────────────
// ALL /api/proxy/elevenlabs/*
// Forwards to https://api.elevenlabs.io/v1/* with the xi-api-key header.

// Voice cloning: multipart file upload — must be before the generic catch-all
router.post('/elevenlabs/voices/add', requireAuth, upload.array('files', 10), async (req: Request, res: Response) => {
  const apiKey = getEnv('ELEVENLABS_API_KEY') || getEnv('VITE_ELEVENLABS_API_KEY')
  if (!apiKey) return missingKey(res, 'ElevenLabs')

  try {
    const { default: FormData } = await import('form-data')
    const form = new FormData()

    const bodyFields = req.body as Record<string, string>
    if (bodyFields) {
      for (const [key, value] of Object.entries(bodyFields)) {
        if (typeof value === 'string') form.append(key, value)
      }
    }

    const files = req.files as Express.Multer.File[] | undefined
    if (files && Array.isArray(files)) {
      for (const file of files) {
        form.append('files', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        })
      }
    }

    const upstreamRes = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        ...form.getHeaders(),
      },
      body: form as unknown as BodyInit,
    })

    const contentType = upstreamRes.headers.get('content-type') || 'application/json'
    res.status(upstreamRes.status).set('Content-Type', contentType)
    const buffer = await upstreamRes.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    logger.error({ err }, '[proxy/elevenlabs/voices/add] Error')
    res.status(502).json({ error: 'Failed to proxy voice cloning request' })
  }
})

// ── User Voices (DB persistence for cloned voices) ───────────────────────────
// GET /api/proxy/elevenlabs/user-voices — list user's cloned voices from DB
router.get('/elevenlabs/user-voices', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('user_voices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.warn({ error }, '[proxy/user-voices] DB error — returning empty list')
      res.json({ voices: [] })
      return
    }

    const voices = (data || []).map((row: any) => ({
      voice_id: row.voice_id,
      name: row.name,
      description: row.description || '',
      createdAt: new Date(row.created_at).getTime(),
    }))

    res.json({ voices })
  } catch (err) {
    logger.error({ err }, '[proxy/user-voices] Error')
    res.status(500).json({ error: 'Failed to fetch user voices' })
  }
})

// POST /api/proxy/elevenlabs/user-voices — persist a cloned voice to DB
router.post('/elevenlabs/user-voices', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { voiceId, name, description } = req.body

    if (!voiceId || !name) {
      res.status(400).json({ error: 'Missing required fields: voiceId, name' })
      return
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('user_voices')
      .upsert({
        user_id: userId,
        voice_id: voiceId,
        name,
        description: description || '',
      }, { onConflict: 'user_id,voice_id' })

    if (error) {
      logger.error({ error }, '[proxy/user-voices] Insert error')
      res.status(500).json({ error: 'Failed to save voice' })
      return
    }

    res.json({ ok: true })
  } catch (err) {
    logger.error({ err }, '[proxy/user-voices] Error')
    res.status(500).json({ error: 'Failed to save voice' })
  }
})

// DELETE /api/proxy/elevenlabs/user-voices/:voiceId — delete from DB + ElevenLabs
router.delete('/elevenlabs/user-voices/:voiceId', requireAuth, async (req: Request, res: Response) => {
  const apiKey = getEnv('ELEVENLABS_API_KEY') || getEnv('VITE_ELEVENLABS_API_KEY')
  const { voiceId } = req.params

  try {
    // Delete from ElevenLabs API (best effort)
    if (apiKey) {
      try {
        await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
          method: 'DELETE',
          headers: { 'xi-api-key': apiKey },
        })
      } catch (err) {
        logger.warn({ err }, '[proxy/user-voices] ElevenLabs delete failed (continuing)')
      }
    }

    // Delete from DB
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('user_voices')
      .delete()
      .eq('user_id', userId)
      .eq('voice_id', voiceId)

    if (error) {
      logger.error({ error }, '[proxy/user-voices] DB delete error')
      res.status(500).json({ error: 'Failed to delete voice from DB' })
      return
    }

    res.json({ ok: true })
  } catch (err) {
    logger.error({ err }, '[proxy/user-voices] Error')
    res.status(500).json({ error: 'Failed to delete voice' })
  }
})

// Whitelist of allowed ElevenLabs API path patterns.
// Only TTS, alignment, music generation, voice listing, and sound effects are permitted.
const ELEVENLABS_ALLOWED_PATHS: RegExp[] = [
  /^text-to-speech\/[\w-]+$/,                     // POST /text-to-speech/:voiceId
  /^text-to-speech\/[\w-]+\/stream$/,              // POST /text-to-speech/:voiceId/stream
  /^text-to-speech\/[\w-]+\/with-timestamps$/,     // POST /text-to-speech/:voiceId/with-timestamps
  /^voices$/,                                      // GET /voices
  /^voices\/[\w-]+$/,                              // GET /voices/:voiceId
  /^text-to-sound-effects$/,                       // POST /text-to-sound-effects
  /^sound-generation$/,                            // POST /sound-generation
  /^music\/generate$/,                             // POST /music/generate (music generation)
  /^music\/plan$/,                                 // POST /music/plan (composition plan)
  /^music$/,                                       // POST /music (generate music)
  /^user$/,                                        // GET /user (validate key)
  /^user\/subscription$/,                          // GET /user/subscription
  /^models$/,                                      // GET /models
]

router.all('/elevenlabs/*', requireAuth, async (req: Request, res: Response) => {
  const apiKey = getEnv('ELEVENLABS_API_KEY') || getEnv('VITE_ELEVENLABS_API_KEY')
  if (!apiKey) return missingKey(res, 'ElevenLabs')

  // Strip the /elevenlabs prefix to get the real path
  const subPath = req.params[0] || ''

  // Validate the path against the whitelist
  const isAllowed = ELEVENLABS_ALLOWED_PATHS.some((pattern) => pattern.test(subPath))
  if (!isAllowed) {
    res.status(403).json({ error: `ElevenLabs endpoint not allowed: ${subPath}` })
    return
  }

  const upstream = `https://api.elevenlabs.io/v1/${subPath}`

  try {
    const headers: Record<string, string> = {
      'xi-api-key': apiKey,
    }

    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string
    }

    const fetchOpts: RequestInit = {
      method: req.method,
      headers,
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOpts.body = JSON.stringify(req.body)
    }

    const upstreamRes = await fetch(upstream, fetchOpts)
    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream'
    res.status(upstreamRes.status).set('Content-Type', contentType)

    const buffer = await upstreamRes.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    logger.error({ err }, '[proxy/elevenlabs] Error')
    res.status(502).json({ error: 'Failed to proxy ElevenLabs request' })
  }
})

// ── ElevenLabs Conversational AI — signed URL ────────────────────────────────
// POST /api/proxy/elevenlabs-convai/signed-url
// Returns a signed WebSocket URL so the frontend can connect without exposing
// the API key.

router.post('/elevenlabs-convai/signed-url', requireAuth, async (req: Request, res: Response) => {
  const apiKey = getEnv('ELEVENLABS_API_KEY') || getEnv('VITE_ELEVENLABS_API_KEY')
  if (!apiKey) return missingKey(res, 'ElevenLabs')

  const { agent_id } = req.body || {}
  if (!agent_id) {
    res.status(400).json({ error: 'agent_id is required' })
    return
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id }),
    })

    if (!response.ok) {
      const errText = await response.text()
      logger.warn({ status: response.status, body: errText }, '[proxy/convai] Signed URL request failed')
      res.status(response.status).json({ error: `ElevenLabs error: ${response.statusText}` })
      return
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    logger.error({ err }, '[proxy/convai] Error getting signed URL')
    res.status(502).json({ error: 'Failed to get signed WebSocket URL' })
  }
})

// ── Pixabay Proxy ────────────────────────────────────────────────────────────
// GET /api/proxy/pixabay/images  — search images
// GET /api/proxy/pixabay/videos  — search videos

router.get('/pixabay/:type(images|videos)', requireAuth, async (req: Request, res: Response) => {
  const apiKey = getEnv('PIXABAY_API_KEY') || getEnv('VITE_PIXABAY_API_KEY')
  if (!apiKey) return missingKey(res, 'Pixabay')

  const isVideo = req.params.type === 'videos'
  const baseUrl = isVideo ? 'https://pixabay.com/api/videos/' : 'https://pixabay.com/api/'

  const url = new URL(baseUrl)
  url.searchParams.set('key', apiKey)

  // Forward all query params except 'key' (we inject ours)
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'key' && typeof v === 'string') {
      url.searchParams.set(k, v)
    }
  }

  try {
    const upstreamRes = await fetch(url.toString())
    res.status(upstreamRes.status).set('Content-Type', 'application/json')

    const data = await upstreamRes.json()
    res.json(data)
  } catch (err) {
    logger.error({ err }, '[proxy/pixabay] Error')
    res.status(502).json({ error: 'Failed to proxy Pixabay request' })
  }
})

// ── Pexels Proxy ─────────────────────────────────────────────────────────────
// GET /api/proxy/pexels/photos  — search photos
// GET /api/proxy/pexels/videos  — search videos
// Pexels uses an Authorization header (not a query string key).

router.get('/pexels/:type(photos|videos)', requireAuth, async (req: Request, res: Response) => {
  const apiKey = getEnv('PEXELS_API_KEY') || getEnv('VITE_PEXELS_API_KEY')
  if (!apiKey) return missingKey(res, 'Pexels')

  const isVideo = req.params.type === 'videos'
  const baseUrl = isVideo
    ? 'https://api.pexels.com/videos/search'
    : 'https://api.pexels.com/v1/search'

  const url = new URL(baseUrl)

  for (const [k, v] of Object.entries(req.query)) {
    if (typeof v === 'string') url.searchParams.set(k, v)
  }

  try {
    const upstreamRes = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
    })
    res.status(upstreamRes.status).set('Content-Type', 'application/json')
    const data = await upstreamRes.json()
    res.json(data)
  } catch (err) {
    logger.error({ err }, '[proxy/pexels] Error')
    res.status(502).json({ error: 'Failed to proxy Pexels request' })
  }
})

// ── Freesound Proxy ──────────────────────────────────────────────────────────
// GET /api/proxy/freesound/search

router.get('/freesound/search', requireAuth, async (req: Request, res: Response) => {
  const apiKey = getEnv('FREESOUND_API_KEY') || getEnv('VITE_FREESOUND_API_KEY')
  if (!apiKey) return missingKey(res, 'Freesound')

  const url = new URL('https://freesound.org/apiv2/search/text/')
  url.searchParams.set('token', apiKey)

  // Forward all query params except 'token'
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== 'token' && typeof v === 'string') {
      url.searchParams.set(k, v)
    }
  }

  try {
    const upstreamRes = await fetch(url.toString())
    res.status(upstreamRes.status).set('Content-Type', 'application/json')

    const data = await upstreamRes.json()
    res.json(data)
  } catch (err) {
    logger.error({ err }, '[proxy/freesound] Error')
    res.status(502).json({ error: 'Failed to proxy Freesound request' })
  }
})

export default router
