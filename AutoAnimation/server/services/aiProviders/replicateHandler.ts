import type { AIProviderHandler, AIJobStatus } from './types'

const REPLICATE_API_BASE = 'https://api.replicate.com/v1'

function getApiToken(): string | undefined {
  return process.env.REPLICATE_API_TOKEN
}

function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiToken()}`,
    'Content-Type': 'application/json',
    Prefer: 'respond-async',
  }
}

function buildInput(capability: string, params: Record<string, any>): Record<string, any> {
  const input: Record<string, any> = {}

  if (params.prompt) input.prompt = params.prompt
  if (params.negativePrompt) input.negative_prompt = params.negativePrompt
  if (params.seed != null) input.seed = params.seed

  if (capability === 'text-to-image' || capability === 'image-to-image') {
    if (params.width) input.width = params.width
    if (params.height) input.height = params.height
    if (params.count) input.num_outputs = params.count
    if (params.aspectRatio) input.aspect_ratio = params.aspectRatio
  }

  if (capability === 'text-to-video' || capability === 'image-to-video') {
    if (params.imageUrl) input.image = params.imageUrl
    if (params.imageBase64) input.image = `data:image/png;base64,${params.imageBase64}`
    if (params.durationSeconds) input.duration = params.durationSeconds
  }

  return input
}

export const replicateHandler: AIProviderHandler = {
  providerId: 'replicate',

  isConfigured(): boolean {
    return !!getApiToken()
  },

  async execute(capability: string, model: string, params: Record<string, any>): Promise<any> {
    const token = getApiToken()
    if (!token) throw new Error('REPLICATE_API_TOKEN not configured')

    const input = buildInput(capability, params)

    const res = await fetch(`${REPLICATE_API_BASE}/predictions`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        model,
        input,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Replicate API error ${res.status}: ${err}`)
    }

    const data = await res.json() as Record<string, any>

    return {
      jobId: `replicate:${data.id}`,
      status: data.status === 'succeeded' ? 'completed' : 'queued',
      estimatedSeconds: data.metrics?.predict_time,
    }
  },

  async getJobStatus(jobId: string): Promise<AIJobStatus> {
    const token = getApiToken()
    if (!token) throw new Error('REPLICATE_API_TOKEN not configured')

    // jobId format: replicate:<predictionId>
    const predictionId = jobId.replace(/^replicate:/, '')

    const res = await fetch(`${REPLICATE_API_BASE}/predictions/${predictionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Replicate status error ${res.status}: ${err}`)
    }

    const data = await res.json() as Record<string, any>

    if (data.status === 'succeeded') {
      const output = data.output

      // Replicate output format varies — normalize it
      if (Array.isArray(output)) {
        return {
          id: jobId,
          status: 'completed',
          result: { urls: output.filter((u: any) => typeof u === 'string') },
        }
      }

      if (typeof output === 'string') {
        return {
          id: jobId,
          status: 'completed',
          result: { url: output },
        }
      }

      return { id: jobId, status: 'completed', result: output }
    }

    if (data.status === 'failed' || data.status === 'canceled') {
      return {
        id: jobId,
        status: 'failed',
        error: data.error || 'Generation failed',
      }
    }

    // starting or processing
    const progress = data.logs
      ? parseProgressFromLogs(data.logs)
      : undefined

    return {
      id: jobId,
      status: data.status === 'starting' ? 'queued' : 'processing',
      progress,
    }
  },
}

/** Try to extract a percentage from Replicate's streaming logs */
function parseProgressFromLogs(logs: string): number | undefined {
  const matches = logs.match(/(\d+)%/g)
  if (matches && matches.length > 0) {
    const last = matches[matches.length - 1]
    return parseInt(last, 10)
  }
  return undefined
}
