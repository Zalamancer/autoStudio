// ── Freesound.org API Service ──────────────────────────────────────────────
// Browse 500K+ Creative Commons sound effects via the Freesound API.
// Docs: https://freesound.org/docs/api/

// ── Types ────────────────────────────────────────────────────────────────────

export interface FreesoundHit {
  id: number
  name: string
  tags: string[]
  duration: number // seconds
  previews: {
    'preview-hq-mp3': string
    'preview-hq-ogg': string
    'preview-lq-mp3': string
    'preview-lq-ogg': string
  }
  username: string
  license: string
}

export interface FreesoundSearchParams {
  query: string
  page?: number
  pageSize?: number // 1–150, default 20
  filter?: string // e.g. "duration:[0 TO 30]"
}

export interface FreesoundSearchResponse {
  count: number
  next: string | null
  previous: string | null
  results: FreesoundHit[]
}

// ── Service ──────────────────────────────────────────────────────────────────

import { callFreesoundProxy } from '@/services/aiProxy'

export class FreesoundService {
  constructor(_apiKey?: string) {
    // API key is now on the server — this param is kept for backward compatibility
  }

  async search(params: FreesoundSearchParams): Promise<FreesoundSearchResponse> {
    const qs: Record<string, string> = {
      query: params.query,
      fields: 'id,name,tags,duration,previews,username,license',
      page_size: String(params.pageSize ?? 20),
      page: String(params.page ?? 1),
    }
    if (params.filter) qs.filter = params.filter

    const response = await callFreesoundProxy(qs)
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.')
    }
    if (!response.ok) {
      throw new Error(`Freesound API error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  /** Download a preview URL as a Blob (for importing into local media library). */
  async downloadAsBlob(previewUrl: string): Promise<Blob> {
    // Try direct fetch first; fall back to server proxy if CORS blocks it
    try {
      const response = await fetch(previewUrl)
      if (!response.ok) throw new Error(`Direct download failed: ${response.status}`)
      return response.blob()
    } catch {
      // CORS blocked — route through our server proxy
      const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(previewUrl)}`
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`Proxy download failed: ${response.status} ${response.statusText}`)
      }
      return response.blob()
    }
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

let serviceInstance: FreesoundService | null = null

export function getFreesoundService(): FreesoundService {
  if (!serviceInstance) {
    serviceInstance = new FreesoundService()
  }
  return serviceInstance
}

export function hasFreesoundService(): boolean {
  // Always available — key is on the server now
  return true
}
