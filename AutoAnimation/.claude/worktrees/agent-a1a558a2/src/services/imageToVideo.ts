/**
 * imageToVideo.ts
 *
 * Frontend service for AI image-to-video generation.
 * Handles upload, generation, and status polling.
 */

const API_BASE = import.meta.env.VITE_API_URL || ''

export type MotionType = 'camera-pan' | 'camera-zoom' | 'subtle-motion' | 'full-animation' | 'cinematic'
export type ImageToVideoProvider = 'auto' | 'kling' | 'runway' | 'minimax' | 'luma'

export interface ImageToVideoOptions {
  provider: ImageToVideoProvider
  motionType: MotionType
  duration: number
  intensity: number
  aspectRatio?: string
}

export interface VideoJobStatus {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  videoUrl?: string
  error?: string
}

export interface MotionPreset {
  id: string
  label: string
  description: string
  motionType: MotionType
  prompt: string
  intensity: number
}

/** Pre-configured motion presets for non-technical users */
export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'slow-zoom',
    label: 'Slow Zoom In',
    description: 'Gentle zoom into the center of the image',
    motionType: 'camera-zoom',
    prompt: 'Slow cinematic zoom into the center of the scene',
    intensity: 0.3,
  },
  {
    id: 'pan-left',
    label: 'Pan Left',
    description: 'Smooth horizontal pan from right to left',
    motionType: 'camera-pan',
    prompt: 'Smooth horizontal pan from right to left, revealing the scene',
    intensity: 0.4,
  },
  {
    id: 'parallax',
    label: 'Parallax Depth',
    description: 'Subtle 3D parallax effect with depth separation',
    motionType: 'subtle-motion',
    prompt: 'Subtle 3D parallax effect, foreground and background move at different speeds',
    intensity: 0.3,
  },
  {
    id: 'subtle',
    label: 'Subtle Motion',
    description: 'Gentle natural movement (wind, water, hair)',
    motionType: 'subtle-motion',
    prompt: 'Gentle natural motion, subtle movement of elements like wind, water, or fabric',
    intensity: 0.2,
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Dramatic camera movement with depth of field',
    motionType: 'cinematic',
    prompt: 'Cinematic camera movement with dramatic depth of field and slow motion elements',
    intensity: 0.6,
  },
  {
    id: 'full-animation',
    label: 'Full Animation',
    description: 'Full scene animation with character/element movement',
    motionType: 'full-animation',
    prompt: 'Animate the full scene with natural character and element movement',
    intensity: 0.8,
  },
]

/**
 * Convert an image file to base64 data URL for the server.
 */
export async function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Start image-to-video generation.
 * Returns a job ID for status polling.
 */
export async function generateFromImage(
  imageBase64: string,
  prompt: string,
  options: ImageToVideoOptions,
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/image-to-video/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      prompt,
      durationSeconds: options.duration,
      aspectRatio: options.aspectRatio || '16:9',
      motionType: options.motionType,
      provider: options.provider,
      intensity: options.intensity,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Generation failed' }))
    throw new Error((data as { error?: string }).error || `HTTP ${response.status}`)
  }

  const result = await response.json() as { jobId: string }
  return result.jobId
}

/**
 * Poll job status until completion or failure.
 * Yields status updates as an async generator.
 */
export async function* pollImageToVideoStatus(jobId: string): AsyncGenerator<VideoJobStatus> {
  const MAX_POLLS = 120 // 6 minutes at 3s intervals
  const POLL_INTERVAL = 3000

  for (let i = 0; i < MAX_POLLS; i++) {
    const response = await fetch(`${API_BASE}/api/image-to-video/status/${jobId}`)

    if (!response.ok) {
      yield { id: jobId, status: 'failed', error: 'Failed to check status' }
      return
    }

    const status = await response.json() as VideoJobStatus

    yield status

    if (status.status === 'completed' || status.status === 'failed') {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
  }

  yield { id: jobId, status: 'failed', error: 'Generation timed out' }
}

/**
 * Get the result video URL for a completed job.
 */
export async function getImageToVideoResult(jobId: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/image-to-video/result/${jobId}`)

  if (!response.ok) {
    throw new Error('Video not ready yet')
  }

  const data = await response.json() as { videoUrl: string }
  return data.videoUrl
}
