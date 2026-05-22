// ── Pixabay API Service ──────────────────────────────────────────────────────
// Free stock image & video search via the Pixabay API.
// Docs: https://pixabay.com/api/docs/

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
  | 'grayscale' | 'transparent' | 'red' | 'orange' | 'yellow'
  | 'green' | 'turquoise' | 'blue' | 'lilac' | 'pink'
  | 'white' | 'gray' | 'black' | 'brown'
export type PixabayCategory =
  | 'backgrounds' | 'fashion' | 'nature' | 'science' | 'education'
  | 'feelings' | 'health' | 'people' | 'religion' | 'places'
  | 'animals' | 'industry' | 'computer' | 'food' | 'sports'
  | 'transportation' | 'travel' | 'buildings' | 'business' | 'music'

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

const PIXABAY_IMAGE_URL = 'https://pixabay.com/api/'
const PIXABAY_VIDEO_URL = 'https://pixabay.com/api/videos/'

export class PixabayService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchImages(params: PixabaySearchParams): Promise<PixabayImageResponse> {
    const url = new URL(PIXABAY_IMAGE_URL)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('q', params.q)
    url.searchParams.set('per_page', String(params.per_page ?? 20))
    url.searchParams.set('page', String(params.page ?? 1))
    url.searchParams.set('safesearch', 'true')
    if (params.image_type) url.searchParams.set('image_type', params.image_type)
    if (params.orientation) url.searchParams.set('orientation', params.orientation)
    if (params.category) url.searchParams.set('category', params.category)
    if (params.order) url.searchParams.set('order', params.order)
    if (params.editors_choice) url.searchParams.set('editors_choice', 'true')
    if (params.colors) url.searchParams.set('colors', params.colors)
    if (params.min_width) url.searchParams.set('min_width', String(params.min_width))
    if (params.min_height) url.searchParams.set('min_height', String(params.min_height))

    const response = await fetchWithRetry(url.toString(), {}, PIXABAY_FETCH_CONFIG)
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.')
    }
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  async searchVideos(params: PixabaySearchParams): Promise<PixabayVideoResponse> {
    const url = new URL(PIXABAY_VIDEO_URL)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('q', params.q)
    url.searchParams.set('per_page', String(params.per_page ?? 20))
    url.searchParams.set('page', String(params.page ?? 1))
    url.searchParams.set('safesearch', 'true')
    if (params.video_type) url.searchParams.set('video_type', params.video_type)
    if (params.category) url.searchParams.set('category', params.category)
    if (params.order) url.searchParams.set('order', params.order)
    if (params.editors_choice) url.searchParams.set('editors_choice', 'true')
    if (params.min_width) url.searchParams.set('min_width', String(params.min_width))
    if (params.min_height) url.searchParams.set('min_height', String(params.min_height))

    const response = await fetchWithRetry(url.toString(), {}, PIXABAY_FETCH_CONFIG)
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
    const apiKey = import.meta.env.VITE_PIXABAY_API_KEY as string | undefined
    if (!apiKey) {
      throw new Error('Pixabay API key not configured. Set VITE_PIXABAY_API_KEY in your .env file.')
    }
    serviceInstance = new PixabayService(apiKey)
  }
  return serviceInstance
}

export function hasPixabayService(): boolean {
  return serviceInstance !== null || !!import.meta.env.VITE_PIXABAY_API_KEY
}
