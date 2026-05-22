// ── Pixabay API Service ──────────────────────────────────────────────────────
// Free stock image & video search via the Pixabay API.
// Docs: https://pixabay.com/api/docs/

import { callPixabayProxy } from '@/services/aiProxy'
import { fetchWithRetry } from '@/utils/fetchWithRetry'

const PIXABAY_FETCH_CONFIG = { maxRetries: 2, timeoutMs: 15_000, retryDelayMs: 1_000 } as const

// ── Types ────────────────────────────────────────────────────────────────────

export interface PixabayImageHit {
  id: number
  pageURL: string
  type: string // 'photo' | 'illustration' | 'vector'
  tags: string // comma-separated keywords
  previewURL: string // ~150px wide (fast thumbnails)
  webformatURL: string // max 640px wide (valid 24h)
  largeImageURL: string // max 1280px wide
  imageWidth: number
  imageHeight: number
  imageSize: number // bytes
  views: number
  downloads: number
  likes: number
  user: string
  userImageURL: string
}

export interface PixabayVideoSize {
  url: string
  width: number
  height: number
  size: number // bytes
  thumbnail: string
}

export interface PixabayVideoHit {
  id: number
  pageURL: string
  type: string // 'film' | 'animation'
  tags: string
  duration: number // seconds
  videos: {
    large: PixabayVideoSize
    medium: PixabayVideoSize
    small: PixabayVideoSize
    tiny: PixabayVideoSize
  }
  views: number
  downloads: number
  likes: number
  user: string
  userImageURL: string
}

export type PixabayImageType = 'all' | 'photo' | 'illustration' | 'vector'
export type PixabayOrientation = 'all' | 'horizontal' | 'vertical'
export type PixabayVideoType = 'all' | 'film' | 'animation'
export type PixabayOrder = 'popular' | 'latest'
export type PixabayColor =
  | 'grayscale'
  | 'transparent'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'turquoise'
  | 'blue'
  | 'lilac'
  | 'pink'
  | 'white'
  | 'gray'
  | 'black'
  | 'brown'
export type PixabayCategory =
  | 'backgrounds'
  | 'fashion'
  | 'nature'
  | 'science'
  | 'education'
  | 'feelings'
  | 'health'
  | 'people'
  | 'religion'
  | 'places'
  | 'animals'
  | 'industry'
  | 'computer'
  | 'food'
  | 'sports'
  | 'transportation'
  | 'travel'
  | 'buildings'
  | 'business'
  | 'music'

export interface PixabaySearchParams {
  q: string
  page?: number
  per_page?: number // 3–200, default 20
  image_type?: PixabayImageType
  orientation?: PixabayOrientation
  category?: PixabayCategory
  safesearch?: boolean
  order?: PixabayOrder
  editors_choice?: boolean
  colors?: PixabayColor
  min_width?: number
  min_height?: number
  video_type?: PixabayVideoType
}

export interface PixabayImageResponse {
  total: number
  totalHits: number
  hits: PixabayImageHit[]
}

export interface PixabayVideoResponse {
  total: number
  totalHits: number
  hits: PixabayVideoHit[]
}

// ── Service ──────────────────────────────────────────────────────────────────

export class PixabayService {
  constructor(_apiKey?: string) {
    // API key is now on the server — this param is kept for backward compatibility
  }

  private buildParams(params: PixabaySearchParams): Record<string, string> {
    const qs: Record<string, string> = {
      q: params.q,
      per_page: String(params.per_page ?? 20),
      page: String(params.page ?? 1),
      safesearch: 'true',
    }
    if (params.image_type) qs.image_type = params.image_type
    if (params.orientation) qs.orientation = params.orientation
    if (params.category) qs.category = params.category
    if (params.order) qs.order = params.order
    if (params.editors_choice) qs.editors_choice = 'true'
    if (params.colors) qs.colors = params.colors
    if (params.min_width) qs.min_width = String(params.min_width)
    if (params.min_height) qs.min_height = String(params.min_height)
    if (params.video_type) qs.video_type = params.video_type
    return qs
  }

  async searchImages(params: PixabaySearchParams): Promise<PixabayImageResponse> {
    const response = await callPixabayProxy('images', this.buildParams(params), PIXABAY_FETCH_CONFIG)
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.')
    }
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  async searchVideos(params: PixabaySearchParams): Promise<PixabayVideoResponse> {
    const response = await callPixabayProxy('videos', this.buildParams(params), PIXABAY_FETCH_CONFIG)
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.')
    }
    if (!response.ok) {
      throw new Error(`Pixabay video API error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  /** Download a remote URL as a Blob (for importing into local media library). */
  async downloadAsBlob(remoteUrl: string): Promise<Blob> {
    const response = await fetchWithRetry(remoteUrl, {}, PIXABAY_FETCH_CONFIG)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }
    return response.blob()
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

let serviceInstance: PixabayService | null = null

export function getPixabayService(): PixabayService {
  if (!serviceInstance) {
    serviceInstance = new PixabayService()
  }
  return serviceInstance
}

export function hasPixabayService(): boolean {
  // Always available — key is on the server now
  return true
}
