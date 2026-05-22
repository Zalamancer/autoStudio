/**
 * AI Proxy — Routes ALL external API calls through the server-side proxy.
 *
 * Instead of embedding API keys in the frontend bundle via import.meta.env,
 * every call goes through /api/proxy/* where the server attaches the secret key.
 *
 * Proxy endpoints (defined in server/routes/proxy.ts):
 *   POST /api/proxy/gemini/:model              — Gemini generateContent
 *   ALL  /api/proxy/elevenlabs/*                — ElevenLabs API passthrough
 *   GET  /api/proxy/pixabay/:type(images|videos) — Pixabay search
 *   GET  /api/proxy/freesound/search            — Freesound search
 */

import { fetchWithRetry, type FetchRetryConfig } from '@/utils/fetchWithRetry'
import { fetchWithTimeout } from '@/utils/fetchWithTimeout'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Auth Helper ──────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Gemini Proxy ─────────────────────────────────────────────────────────────

const GEMINI_FETCH_CONFIG: FetchRetryConfig = { maxRetries: 1, timeoutMs: 60_000, retryDelayMs: 1_000 }

/**
 * Call Gemini generateContent through the server proxy.
 *
 * @param model  Gemini model name (e.g. 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview')
 * @param body   Request body — same shape as the Gemini REST API
 * @param config Optional fetch retry config
 * @returns      Raw Response object from the proxy
 */
export async function callGeminiProxy(
  model: string,
  body: Record<string, unknown>,
  config: FetchRetryConfig = GEMINI_FETCH_CONFIG,
): Promise<Response> {
  return fetchWithRetry(
    `/api/proxy/gemini/${model}?action=generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    },
    config,
  )
}

/**
 * Convenience: call Gemini and return the text content from the first candidate.
 */
export async function callGeminiText(
  model: string,
  prompt: string,
  generationConfig: Record<string, unknown> = {},
  config?: FetchRetryConfig,
): Promise<string> {
  const response = await callGeminiProxy(
    model,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096, ...generationConfig },
    },
    config,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Convenience: call Gemini with inline image data (vision).
 */
export async function callGeminiVision(
  model: string,
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  generationConfig: Record<string, unknown> = {},
  config?: FetchRetryConfig,
): Promise<string> {
  const response = await callGeminiProxy(
    model,
    {
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, ...generationConfig },
    },
    config,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini Vision API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── ElevenLabs Proxy ─────────────────────────────────────────────────────────

const ELEVENLABS_FETCH_CONFIG: FetchRetryConfig = { maxRetries: 1, timeoutMs: 60_000, retryDelayMs: 1_000 }

/**
 * Call any ElevenLabs endpoint through the server proxy.
 *
 * @param endpoint  Path after /v1/ (e.g. 'text-to-speech/voiceId/with-timestamps')
 * @param options   Fetch options (method, body, headers)
 * @param config    Optional fetch retry config
 * @returns         Raw Response object from the proxy
 */
export async function callElevenLabsProxy(
  endpoint: string,
  options: RequestInit = {},
  config: FetchRetryConfig = ELEVENLABS_FETCH_CONFIG,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...authHeaders(),
  }

  // Preserve content-type if provided
  if (options.headers) {
    const incoming = options.headers as Record<string, string>
    if (incoming['Content-Type']) headers['Content-Type'] = incoming['Content-Type']
  }

  return fetchWithRetry(
    `/api/proxy/elevenlabs/${endpoint}`,
    {
      ...options,
      headers,
    },
    config,
  )
}

// ── Pixabay Proxy ────────────────────────────────────────────────────────────

const PIXABAY_FETCH_CONFIG: FetchRetryConfig = { maxRetries: 2, timeoutMs: 15_000, retryDelayMs: 1_000 }

/**
 * Search Pixabay images or videos through the server proxy.
 *
 * @param type    'images' or 'videos'
 * @param params  Query parameters (same as Pixabay API, minus 'key')
 * @returns       Pixabay API response
 */
export async function callPixabayProxy(
  type: 'images' | 'videos',
  params: Record<string, string>,
  config: FetchRetryConfig = PIXABAY_FETCH_CONFIG,
): Promise<Response> {
  const qs = new URLSearchParams(params).toString()
  return fetchWithRetry(
    `/api/proxy/pixabay/${type}?${qs}`,
    {
      headers: authHeaders(),
    },
    config,
  )
}

// ── Pexels Proxy ─────────────────────────────────────────────────────────────

const PEXELS_FETCH_CONFIG: FetchRetryConfig = { maxRetries: 2, timeoutMs: 15_000, retryDelayMs: 1_000 }

/**
 * Search Pexels photos or videos through the server proxy.
 *
 * @param type    'photos' or 'videos'
 * @param params  Query parameters (per_page, page, query, orientation, size)
 */
export async function callPexelsProxy(
  type: 'photos' | 'videos',
  params: Record<string, string>,
  config: FetchRetryConfig = PEXELS_FETCH_CONFIG,
): Promise<Response> {
  const qs = new URLSearchParams(params).toString()
  return fetchWithRetry(
    `/api/proxy/pexels/${type}?${qs}`,
    {
      headers: authHeaders(),
    },
    config,
  )
}

// ── Freesound Proxy ──────────────────────────────────────────────────────────

/**
 * Search Freesound through the server proxy.
 *
 * @param params  Query parameters (same as Freesound API, minus 'token')
 * @returns       Freesound API response
 */
export async function callFreesoundProxy(
  params: Record<string, string>,
  config: FetchRetryConfig = PIXABAY_FETCH_CONFIG,
): Promise<Response> {
  const qs = new URLSearchParams(params).toString()
  return fetchWithRetry(
    `/api/proxy/freesound/search?${qs}`,
    {
      headers: authHeaders(),
    },
    config,
  )
}

// ── Service Availability Checks ──────────────────────────────────────────────

/**
 * Check whether a proxy service is available by hitting the server.
 * Falls back to assuming available if the server check fails (offline dev mode).
 */
export async function checkProxyServiceAvailable(
  service: 'gemini' | 'elevenlabs' | 'pixabay' | 'pexels' | 'freesound',
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `/api/proxy/${service}/status`,
      {
        method: 'GET',
        headers: authHeaders(),
      },
      10_000,
    )
    // If the proxy route exists, the service is configured
    // (404 = route doesn't exist which also means not available)
    return response.ok
  } catch {
    // Server not running or timed out — can't determine availability
    return false
  }
}
