/**
 * Video-to-Video Style Transfer Service
 *
 * Sends a video to an AI style transfer API and returns the transformed video.
 * Supports multiple providers (Runway, Kling, ComfyUI) via backend abstraction.
 */

import { withCreditGate } from './creditGate'

const API_BASE = import.meta.env.VITE_API_URL || ''

export type StyleTransferStyle =
  | 'anime'
  | 'cartoon'
  | 'watercolor'
  | 'pixel-art'
  | 'cinematic'
  | 'claymation'
  | 'comic-book'
  | 'oil-painting'
  | 'neon'
  | 'sketch'

export interface StyleTransferOptions {
  /** Base64-encoded video or blob URL of the source video */
  videoBlob: Blob
  /** Target visual style */
  style: StyleTransferStyle
  /** Style intensity (0-1, where 1 = fully stylized) */
  intensity?: number
  /** Custom style prompt (for 'custom' override) */
  customPrompt?: string
}

export interface StyleTransferResult {
  videoBlob: Blob
  videoUrl: string
  durationSeconds: number
  provider: string
  style: StyleTransferStyle
}

export interface StyleTransferJobStatus {
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress: number
  videoUrl?: string
  durationSeconds?: number
  provider?: string
  error?: string
}

/**
 * Submit a video for AI style transfer.
 */
export async function transferVideoStyle(
  options: StyleTransferOptions,
): Promise<StyleTransferResult> {
  return withCreditGate('ai-video', async () => {
    // Upload video as FormData
    const formData = new FormData()
    formData.append('video', options.videoBlob, 'source.mp4')
    formData.append('style', options.style)
    formData.append('intensity', String(options.intensity ?? 0.8))
    if (options.customPrompt) {
      formData.append('customPrompt', options.customPrompt)
    }

    const response = await fetch(`${API_BASE}/api/style-transfer/submit`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const jobId = data.jobId as string

    // Poll for completion
    return pollStyleTransferJob(jobId, options.style)
  })
}

async function pollStyleTransferJob(
  jobId: string,
  style: StyleTransferStyle,
): Promise<StyleTransferResult> {
  const maxAttempts = 180 // 6 minutes at 2s intervals
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000))

    const response = await fetch(`${API_BASE}/api/style-transfer/status/${jobId}`)
    if (!response.ok) continue

    const status: StyleTransferJobStatus = await response.json()

    if (status.status === 'error') {
      throw new Error(status.error || 'Style transfer failed')
    }

    if (status.status === 'complete' && status.videoUrl) {
      const videoResponse = await fetch(`${API_BASE}/api/style-transfer/download/${jobId}`)
      if (!videoResponse.ok) throw new Error('Failed to download styled video')
      const videoBlob = await videoResponse.blob()
      const videoUrl = URL.createObjectURL(videoBlob)

      return {
        videoBlob,
        videoUrl,
        durationSeconds: status.durationSeconds || 0,
        provider: status.provider || 'unknown',
        style,
      }
    }
  }

  throw new Error('Style transfer timed out')
}

/**
 * Check if style transfer backend is available.
 */
export async function isStyleTransferAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/style-transfer/providers`)
    if (!response.ok) return false
    const data = await response.json()
    return Array.isArray(data.providers) && data.providers.length > 0
  } catch {
    return false
  }
}

export const STYLE_OPTIONS: Array<{ value: StyleTransferStyle; label: string; preview: string }> = [
  { value: 'anime', label: 'Anime', preview: '#e91e63' },
  { value: 'cartoon', label: 'Cartoon', preview: '#ff9800' },
  { value: 'watercolor', label: 'Watercolor', preview: '#4caf50' },
  { value: 'pixel-art', label: 'Pixel Art', preview: '#9c27b0' },
  { value: 'cinematic', label: 'Cinematic', preview: '#2196f3' },
  { value: 'claymation', label: 'Claymation', preview: '#795548' },
  { value: 'comic-book', label: 'Comic Book', preview: '#f44336' },
  { value: 'oil-painting', label: 'Oil Painting', preview: '#607d8b' },
  { value: 'neon', label: 'Neon/Cyberpunk', preview: '#00bcd4' },
  { value: 'sketch', label: 'Sketch', preview: '#9e9e9e' },
]
