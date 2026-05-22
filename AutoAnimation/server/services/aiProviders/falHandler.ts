import type { AIProviderHandler, AIJobStatus } from './types'

const FAL_API_BASE = 'https://queue.fal.run'
const FAL_UPLOAD_BASE = 'https://rest.alpha.fal.ai'

function getApiKey(): string | undefined {
  return process.env.FAL_AI_API_KEY
}

function buildHeaders(includeContentType = true): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Key ${getApiKey()}` }
  if (includeContentType) h['Content-Type'] = 'application/json'
  return h
}

/**
 * Upload a base64 data URI to FAL CDN storage and return the file URL.
 * Uses the initiate-upload flow: POST to get presigned URL, PUT the binary.
 */
async function uploadDataUriToFalCDN(dataUri: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('FAL_AI_API_KEY not configured')

  // Parse data URI: data:<mime>;base64,<data>
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid data URI for FAL upload')

  const mimeType = match[1]
  const ext = mimeType.split('/')[1] || 'bin'
  const buffer = Buffer.from(match[2], 'base64')
  const fileName = `upload_${Date.now()}.${ext}`

  // Step 1: Initiate upload
  const initRes = await fetch(
    `${FAL_UPLOAD_BASE}/storage/upload/initiate?storage_type=fal-cdn-v3`,
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: fileName,
        content_type: mimeType,
      }),
    },
  )

  if (!initRes.ok) {
    const err = await initRes.text()
    throw new Error(`FAL upload initiate failed ${initRes.status}: ${err}`)
  }

  const { upload_url, file_url } = await initRes.json() as { upload_url: string; file_url: string }

  // Step 2: PUT the binary to the presigned URL
  const putRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: buffer,
  })

  if (!putRes.ok) {
    const err = await putRes.text()
    throw new Error(`FAL upload PUT failed ${putRes.status}: ${err}`)
  }

  return file_url
}

function mapTextToImageParams(model: string, params: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = {
    prompt: params.prompt,
    num_images: params.count ?? 1,
  }
  if (params.negativePrompt) body.negative_prompt = params.negativePrompt
  if (params.seed != null) body.seed = params.seed

  // Image size — FAL uses image_size object or aspect ratio string
  if (params.width && params.height) {
    body.image_size = { width: params.width, height: params.height }
  } else if (params.aspectRatio) {
    // Map common aspect ratios to pixel dimensions
    const ratioMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 },
      '21:9': { width: 1024, height: 440 },
    }
    body.image_size = ratioMap[params.aspectRatio] ?? { width: 1024, height: 1024 }
  }

  return body
}

// FAL LTX valid durations
const VALID_DURATIONS = [6, 8, 10, 12, 14, 16, 18, 20]

function snapToValidDuration(seconds: number): number {
  // Find the closest valid duration
  return VALID_DURATIONS.reduce((prev, curr) =>
    Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev
  )
}

function mapVideoParams(params: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = {}
  if (params.prompt) body.prompt = params.prompt
  if (params.imageUrl) body.image_url = params.imageUrl
  if (params.imageBase64) body.image_url = `data:image/png;base64,${params.imageBase64}`
  if (params.durationSeconds) body.duration = snapToValidDuration(params.durationSeconds)
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio
  if (params.resolution) body.resolution = params.resolution
  if (params.fps) body.fps = params.fps
  if (params.generateAudio != null) body.generate_audio = params.generateAudio
  return body
}

function mapLipSyncParams(model: string, params: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = {}

  // Image input (VEED Fabric models)
  if (params.imageBase64) body.image_url = `data:image/png;base64,${params.imageBase64}`
  if (params.imageUrl) body.image_url = params.imageUrl

  // Video input (Kling LipSync, LatentSync, MuseTalk)
  if (params.videoUrl) {
    // MuseTalk uses source_video_url instead of video_url
    if (model === 'fal-ai/musetalk') {
      body.source_video_url = params.videoUrl
    } else {
      body.video_url = params.videoUrl
    }
  }

  // Audio — already a data URI from the frontend
  if (params.audioBase64) body.audio_url = params.audioBase64
  if (params.audioUrl) body.audio_url = params.audioUrl

  // Model-specific optional params (MuseTalk only accepts source_video_url + audio_url)
  if (model !== 'fal-ai/musetalk') {
    if (params.resolution) body.resolution = params.resolution
    if (params.guidanceScale != null) body.guidance_scale = params.guidanceScale
    if (params.seed != null) body.seed = params.seed
    if (params.loopMode) body.loop_mode = params.loopMode
  }

  return body
}

export const falHandler: AIProviderHandler = {
  providerId: 'fal-ai',

  isConfigured(): boolean {
    return !!getApiKey()
  },

  async execute(capability: string, model: string, params: Record<string, any>): Promise<any> {
    const apiKey = getApiKey()
    if (!apiKey) throw new Error('FAL_AI_API_KEY not configured')

    // Upload large data URIs to FAL CDN before mapping params
    // This avoids the "URL should have at most 2083 characters" error
    if (params.audioBase64 && params.audioBase64.startsWith('data:')) {
      console.log(`[fal] Uploading audio to CDN (${Math.round(params.audioBase64.length / 1024)}KB)...`)
      params.audioUrl = await uploadDataUriToFalCDN(params.audioBase64)
      console.log(`[fal] Audio uploaded: ${params.audioUrl}`)
      delete params.audioBase64
    }
    if (params.imageBase64 && capability === 'lip-sync') {
      console.log(`[fal] Uploading image to CDN (${Math.round(params.imageBase64.length / 1024)}KB)...`)
      const imageDataUri = `data:image/png;base64,${params.imageBase64}`
      params.imageUrl = await uploadDataUriToFalCDN(imageDataUri)
      console.log(`[fal] Image uploaded: ${params.imageUrl}`)
      delete params.imageBase64
    }

    let body: Record<string, any>
    if (capability === 'text-to-image' || capability === 'image-to-image') {
      body = mapTextToImageParams(model, params)
    } else if (capability === 'lip-sync') {
      body = mapLipSyncParams(model, params)
    } else {
      body = mapVideoParams(params)
    }

    console.log(`[fal] Submitting to ${FAL_API_BASE}/${model}`, Object.keys(body))
    const res = await fetch(`${FAL_API_BASE}/${model}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[fal] Submit failed ${res.status}: ${err}`)
      throw new Error(`FAL API error ${res.status}: ${err}`)
    }

    const data = await res.json() as Record<string, any>
    console.log(`[fal] Submit response:`, JSON.stringify(data).slice(0, 500))

    // FAL queue returns request_id + status_url/response_url for async jobs
    if (data.request_id) {
      // Encode the FAL-provided URLs into the jobId (base64 to avoid URL routing issues)
      const statusUrl = data.status_url || `${FAL_API_BASE}/${model}/requests/${data.request_id}/status`
      const responseUrl = data.response_url || `${FAL_API_BASE}/${model}/requests/${data.request_id}`
      const encoded = Buffer.from(`${statusUrl}|${responseUrl}`).toString('base64url')
      return {
        jobId: `fal-urls:${encoded}`,
        status: 'queued',
        estimatedSeconds: data.estimated_time,
      }
    }

    // Synchronous result (rare for queue API)
    if (data.images) {
      return {
        images: data.images.map((img: any) => ({
          url: img.url,
          seed: img.seed,
        })),
      }
    }

    if (data.video?.url) {
      return { jobId: '', result: { url: data.video.url }, status: 'completed' }
    }

    return data
  },

  async getJobStatus(jobId: string): Promise<AIJobStatus> {
    const apiKey = getApiKey()
    if (!apiKey) throw new Error('FAL_AI_API_KEY not configured')

    let statusUrl: string
    let responseUrl: string

    if (jobId.startsWith('fal-urls:')) {
      // New format: fal-urls:<base64url(statusUrl|responseUrl)>
      const encoded = jobId.slice('fal-urls:'.length)
      const decoded = Buffer.from(encoded, 'base64url').toString()
      const [sUrl, rUrl] = decoded.split('|')
      statusUrl = sUrl
      responseUrl = rUrl
    } else {
      // Legacy format: fal:<model>:<requestId>
      const parts = jobId.split(':')
      if (parts.length < 3 || parts[0] !== 'fal') {
        throw new Error(`Invalid FAL job ID: ${jobId}`)
      }
      const model = parts.slice(1, -1).join(':')
      const requestId = parts[parts.length - 1]
      statusUrl = `${FAL_API_BASE}/${model}/requests/${requestId}/status`
      responseUrl = `${FAL_API_BASE}/${model}/requests/${requestId}`
    }

    // Check status (GET — no Content-Type)
    const statusRes = await fetch(statusUrl, { headers: buildHeaders(false) })

    if (!statusRes.ok) {
      const err = await statusRes.text()
      throw new Error(`FAL status error ${statusRes.status}: ${err}`)
    }

    const statusData = await statusRes.json() as Record<string, any>
    console.log(`[fal] Poll status: ${statusData.status}`)

    if (statusData.status === 'COMPLETED') {
      // Fetch the actual result (GET — no Content-Type)
      const resultRes = await fetch(responseUrl, { headers: buildHeaders(false) })

      if (!resultRes.ok) {
        const errText = await resultRes.text().catch(() => '')
        console.error(`[fal] Result fetch failed ${resultRes.status}: ${errText}`)
        // 422 usually means the generation itself failed with a validation error
        let errorMsg = `Failed to fetch result (${resultRes.status})`
        try {
          const errJson = JSON.parse(errText)
          errorMsg = errJson.detail?.[0]?.msg || errJson.detail || errJson.error || errorMsg
        } catch {}
        return { id: jobId, status: 'failed', error: errorMsg }
      }

      const resultData = await resultRes.json() as Record<string, any>

      // Map result based on content type
      if (resultData.images) {
        return {
          id: jobId,
          status: 'completed',
          result: {
            urls: resultData.images.map((img: any) => img.url),
          },
        }
      }

      if (resultData.video?.url) {
        return {
          id: jobId,
          status: 'completed',
          result: { url: resultData.video.url },
        }
      }

      return { id: jobId, status: 'completed', result: resultData }
    }

    if (statusData.status === 'FAILED') {
      return { id: jobId, status: 'failed', error: statusData.error || 'Generation failed' }
    }

    // IN_QUEUE or IN_PROGRESS
    return {
      id: jobId,
      status: statusData.status === 'IN_QUEUE' ? 'queued' : 'processing',
      progress: statusData.progress,
      estimatedSeconds: statusData.estimated_time,
    }
  },
}
