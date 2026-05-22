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

const FREESOUND_BASE_URL = 'https://freesound.org/apiv2'

export class FreesoundService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(params: FreesoundSearchParams): Promise<FreesoundSearchResponse> {
    const url = new URL(`${FREESOUND_BASE_URL}/search/text/`)
    url.searchParams.set('token', this.apiKey)
    url.searchParams.set('query', params.query)
    url.searchParams.set('fields', 'id,name,tags,duration,previews,username,license')
    url.searchParams.set('page_size', String(params.pageSize ?? 20))
    url.searchParams.set('page', String(params.page ?? 1))
    if (params.filter) url.searchParams.set('filter', params.filter)

    const response = await fetch(url.toString())
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
    const apiKey = import.meta.env.VITE_FREESOUND_API_KEY as string | undefined
    if (!apiKey) {
      throw new Error('Freesound API key not configured. Set VITE_FREESOUND_API_KEY in your .env file.')
    }
    serviceInstance = new FreesoundService(apiKey)
  }
  return serviceInstance
}

export function hasFreesoundService(): boolean {
  return serviceInstance !== null || !!import.meta.env.VITE_FREESOUND_API_KEY
}
