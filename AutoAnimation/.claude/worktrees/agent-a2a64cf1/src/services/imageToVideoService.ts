/**
 * Image-to-Video generation service.
 * Submits an image to the server proxy (Fal.ai / Kling), polls for result,
 * and returns a video URL. Follows the same pattern as aiAnimation.ts.
 */

import { withCreditGate } from './creditGate'
import { logger } from '@/utils/logger'

export interface ImageToVideoOptions {
  /** Base64-encoded image (with or without data: prefix) */
  imageBase64: string
  /** Motion description prompt */
  prompt?: string
  /** Video duration in seconds (default: 5) */
  durationSeconds?: number
  /** Aspect ratio (default: '16:9') */
  aspectRatio?: string
}

export interface ImageToVideoResult {
  videoUrl: string
  jobId: string
}

export type ImageToVideoStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface ImageToVideoProgress {
  status: ImageToVideoStatus
  progress?: number
  error?: string
}

/**
 * Generate a video from an image. Returns a promise that resolves when
 * the video is ready. Use onProgress for status updates.
 */
export async function generateImageToVideo(
  options: ImageToVideoOptions,
  onProgress?: (progress: ImageToVideoProgress) => void,
): Promise<ImageToVideoResult> {
  return withCreditGate('image-to-video', async () =>
    _generateImageToVideoImpl(options, onProgress),
  )
}

async function _generateImageToVideoImpl(
  options: ImageToVideoOptions,
  onProgress?: (progress: ImageToVideoProgress) => void,
): Promise<ImageToVideoResult> {
  // Submit generation job
  const submitRes = await fetch('/api/image-to-video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: options.imageBase64,
      prompt: options.prompt || 'Gentle natural motion',
      durationSeconds: options.durationSeconds || 5,
      aspectRatio: options.aspectRatio || '16:9',
    }),
  })

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Submit failed (${submitRes.status})`)
  }

  const { jobId } = await submitRes.json() as { jobId: string }
  logger.log(`[ImageToVideo] Job submitted: ${jobId}`)

  onProgress?.({ status: 'queued' })

  // Poll for completion
  const maxAttempts = 120 // 10 minutes at 5s intervals
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 5000))

    const statusRes = await fetch(`/api/image-to-video/status/${jobId}`)
    if (!statusRes.ok) continue

    const status = await statusRes.json() as ImageToVideoProgress & { id?: string }

    onProgress?.({
      status: status.status as ImageToVideoStatus,
      progress: status.progress,
      error: status.error,
    })

    if (status.status === 'completed') {
      // Fetch the result URL
      const resultRes = await fetch(`/api/image-to-video/result/${jobId}`)
      if (!resultRes.ok) {
        throw new Error('Failed to fetch video result')
      }
      const result = await resultRes.json() as { videoUrl: string }
      logger.log(`[ImageToVideo] Job completed: ${jobId}`)
      return { videoUrl: result.videoUrl, jobId }
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Image-to-video generation failed')
    }
  }

  throw new Error('Image-to-video generation timed out')
}
