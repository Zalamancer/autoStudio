/**
 * imageToVideoProviders.ts
 *
 * Provider abstraction layer for image-to-video generation.
 * Currently uses Fal.ai/Kling as the primary provider.
 * Extensible to support Runway, Minimax, Luma when API access is available.
 */

export interface JobResult {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
}

export interface ImageToVideoRequest {
  imageUrl: string
  prompt: string
  duration: number
  aspectRatio: string
  motionType?: string
  intensity?: number
}

export type ProviderName = 'kling' | 'runway' | 'minimax' | 'luma'

// ── Provider interface ──

interface ImageToVideoProvider {
  name: ProviderName
  isConfigured(): boolean
  generateFromImage(request: ImageToVideoRequest): Promise<JobResult>
  getStatus(jobId: string): Promise<JobResult>
  getResult(jobId: string): Promise<JobResult>
}

// ── Kling Provider (via Fal.ai) ──

const FAL_API_BASE = 'https://queue.fal.run'
const FAL_MODEL = 'fal-ai/kling-video/v1.6/standard/image-to-video'

function getFalApiKey(): string {
  return process.env.FAL_API_KEY || ''
}

const klingProvider: ImageToVideoProvider = {
  name: 'kling',

  isConfigured() {
    return !!getFalApiKey()
  },

  async generateFromImage(request) {
    const apiKey = getFalApiKey()
    if (!apiKey) throw new Error('FAL_API_KEY not configured')

    const response = await fetch(`${FAL_API_BASE}/${FAL_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: request.imageUrl,
        prompt: request.prompt || 'Gentle natural motion',
        duration: String(request.duration || 5),
        aspect_ratio: request.aspectRatio || '16:9',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Kling API error: ${errText}`)
    }

    const data = await response.json() as { request_id: string }
    return {
      jobId: data.request_id,
      status: 'queued' as const,
    }
  },

  async getStatus(jobId) {
    const apiKey = getFalApiKey()
    if (!apiKey) throw new Error('FAL_API_KEY not configured')

    const response = await fetch(
      `${FAL_API_BASE}/${FAL_MODEL}/requests/${jobId}/status`,
      { headers: { Authorization: `Key ${apiKey}` } },
    )

    if (!response.ok) throw new Error('Status check failed')

    const data = await response.json() as { status: string }

    let status: JobResult['status'] = 'queued'
    if (data.status === 'COMPLETED') status = 'completed'
    else if (data.status === 'FAILED') status = 'failed'
    else if (data.status === 'IN_PROGRESS') status = 'processing'

    return { jobId, status }
  },

  async getResult(jobId) {
    const apiKey = getFalApiKey()
    if (!apiKey) throw new Error('FAL_API_KEY not configured')

    const response = await fetch(
      `${FAL_API_BASE}/${FAL_MODEL}/requests/${jobId}`,
      { headers: { Authorization: `Key ${apiKey}` } },
    )

    if (!response.ok) throw new Error('Failed to fetch result')

    const data = await response.json() as { video?: { url: string } }
    return {
      jobId,
      status: 'completed' as const,
      videoUrl: data.video?.url,
    }
  },
}

// ── Provider Registry ──

const providers: Record<ProviderName, ImageToVideoProvider> = {
  kling: klingProvider,
  runway: klingProvider, // Fallback to Kling until Runway integration is added
  minimax: klingProvider,
  luma: klingProvider,
}

/**
 * Select the best provider based on motion type and availability.
 */
export function selectProvider(motionType?: string, preferredProvider?: string): ImageToVideoProvider {
  // If a specific provider is preferred and configured, use it
  if (preferredProvider && preferredProvider !== 'auto') {
    const provider = providers[preferredProvider as ProviderName]
    if (provider?.isConfigured()) return provider
  }

  // Auto-select: currently only Kling is available
  if (klingProvider.isConfigured()) return klingProvider

  throw new Error('No image-to-video provider is configured. Please set FAL_API_KEY.')
}

export { providers }
