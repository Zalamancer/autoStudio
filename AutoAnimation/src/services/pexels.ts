// ── Pexels API Service ───────────────────────────────────────────────────────
// Free stock photo & video search via the Pexels API.
// Docs: https://www.pexels.com/api/documentation/

import { callPexelsProxy } from '@/services/aiProxy'
import { fetchWithRetry } from '@/utils/fetchWithRetry'

const PEXELS_FETCH_CONFIG = { maxRetries: 2, timeoutMs: 15_000, retryDelayMs: 1_000 } as const

// ── Types ────────────────────────────────────────────────────────────────────

export interface PexelsPhotoSrc {
  original: string
  large2x: string
  large: string
  medium: string
  small: string
  portrait: string
  landscape: string
  tiny: string
}

export interface PexelsPhotoHit {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id: number
  avg_color: string
  src: PexelsPhotoSrc
  alt: string
  liked?: boolean
}

export interface PexelsVideoFile {
  id: number
  quality: string // 'hd' | 'sd' | 'hls' | ...
  file_type: string // 'video/mp4'
  width: number
  height: number
  fps: number
  link: string
}

export interface PexelsVideoPicture {
  id: number
  nr: number
  picture: string
}

export interface PexelsVideoHit {
  id: number
  width: number
  height: number
  url: string
  image: string
  duration: number // seconds
  user: { id: number; name: string; url: string }
  video_files: PexelsVideoFile[]
  video_pictures: PexelsVideoPicture[]
  tags?: string[]
}

export type PexelsOrientation = 'landscape' | 'portrait' | 'square'
export type PexelsSize = 'large' | 'medium' | 'small'
export type PexelsColor = string // hex or named color

export interface PexelsSearchParams {
  q: string
  page?: number
  per_page?: number // 1–80
  orientation?: PexelsOrientation
  size?: PexelsSize
  color?: PexelsColor
  locale?: string
}

export interface PexelsPhotoResponse {
  total_results: number
  page: number
  per_page: number
  photos: PexelsPhotoHit[]
  next_page?: string
}

export interface PexelsVideoResponse {
  page: number
  per_page: number
  total_results: number
  url: string
  videos: PexelsVideoHit[]
  next_page?: string
}

// ── Service ──────────────────────────────────────────────────────────────────

export class PexelsService {
  constructor(_apiKey?: string) {
    // API key is on the server — param kept for API symmetry with Pixabay.
  }

  private buildParams(params: PexelsSearchParams): Record<string, string> {
    const qs: Record<string, string> = {
      query: params.q,
      per_page: String(params.per_page ?? 20),
      page: String(params.page ?? 1),
    }
    if (params.orientation) qs.orientation = params.orientation
    if (params.size) qs.size = params.size
    if (params.color) qs.color = params.color
    if (params.locale) qs.locale = params.locale
    return qs
  }

  async searchPhotos(params: PexelsSearchParams): Promise<PexelsPhotoResponse> {
    const response = await callPexelsProxy('photos', this.buildParams(params), PEXELS_FETCH_CONFIG)
    if (response.status === 429) {
      throw new Error('Pexels rate limit reached. Please wait a moment and try again.')
    }
    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  async searchVideos(params: PexelsSearchParams): Promise<PexelsVideoResponse> {
    const response = await callPexelsProxy('videos', this.buildParams(params), PEXELS_FETCH_CONFIG)
    if (response.status === 429) {
      throw new Error('Pexels rate limit reached. Please wait a moment and try again.')
    }
    if (!response.ok) {
      throw new Error(`Pexels video API error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  /** Download a remote URL as a Blob. */
  async downloadAsBlob(remoteUrl: string): Promise<Blob> {
    const response = await fetchWithRetry(remoteUrl, {}, PEXELS_FETCH_CONFIG)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }
    return response.blob()
  }

  /** Pick the best HD-quality MP4 file URL from a video hit. */
  pickBestVideoFile(hit: PexelsVideoHit, maxWidth = 1920): PexelsVideoFile | null {
    const mp4s = (hit.video_files || []).filter((f) => f.file_type === 'video/mp4')
    if (mp4s.length === 0) return null
    const sorted = [...mp4s].sort((a, b) => a.width - b.width)
    const fitting = sorted.filter((f) => f.width <= maxWidth)
    return (fitting[fitting.length - 1] ?? sorted[sorted.length - 1]) || null
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

let serviceInstance: PexelsService | null = null

export function getPexelsService(): PexelsService {
  if (!serviceInstance) {
    serviceInstance = new PexelsService()
  }
  return serviceInstance
}

export function hasPexelsService(): boolean {
  // Always available — key is on the server (status check confirms config).
  return true
}
