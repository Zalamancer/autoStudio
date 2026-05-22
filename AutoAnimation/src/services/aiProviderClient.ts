import type {
  TextToImageRequest,
  TextToImageResponse,
  TextToVideoRequest,
  TextToVideoResponse,
  ImageToVideoRequest,
  ImageToVideoResponse,
  LipSyncRequest,
  LipSyncResponse,
  AIJobStatus,
  ProviderId,
  AICapability,
} from '@/types/aiProviders'
import { useAIProviderStore } from '@/stores/useAIProviderStore'
import { getModel } from '@/services/aiProviderRegistry'
import { fetchWithRetry } from '@/utils/fetchWithRetry'
import { useAuthStore } from '@/stores/useAuthStore'

const API_BASE = '/api/ai'
const AI_PROVIDER_FETCH_CONFIG = { maxRetries: 2, timeoutMs: 120_000, retryDelayMs: 2_000 } as const

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function post<T>(path: string, body: Record<string, any>): Promise<T> {
  const res = await fetchWithRetry(
    `${API_BASE}${path}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    },
    AI_PROVIDER_FETCH_CONFIG,
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }
  return res.json()
}

function resolveModel(capability: AICapability, modelIdOverride?: string) {
  const modelId = modelIdOverride ?? useAIProviderStore.getState().defaults[capability]
  if (!modelId) throw new Error(`No model selected for ${capability}`)
  const meta = getModel(modelId)
  if (!meta) throw new Error(`Unknown model: ${modelId}`)
  return { modelId, providerId: meta.providerId }
}

export async function generateImage(req: TextToImageRequest, modelId?: string): Promise<TextToImageResponse> {
  const { modelId: model, providerId } = resolveModel('text-to-image', modelId)
  return post<TextToImageResponse>('/text-to-image', {
    provider: providerId,
    model,
    ...req,
  })
}

export async function generateVideo(req: TextToVideoRequest, modelId?: string): Promise<TextToVideoResponse> {
  const { modelId: model, providerId } = resolveModel('text-to-video', modelId)
  return post<TextToVideoResponse>('/text-to-video', {
    provider: providerId,
    model,
    ...req,
  })
}

export async function imageToVideo(req: ImageToVideoRequest, modelId?: string): Promise<ImageToVideoResponse> {
  const { modelId: model, providerId } = resolveModel('image-to-video', modelId)
  return post<ImageToVideoResponse>('/image-to-video', {
    provider: providerId,
    model,
    ...req,
  })
}

export async function lipSync(req: LipSyncRequest, modelId?: string): Promise<LipSyncResponse> {
  const { modelId: model, providerId } = resolveModel('lip-sync', modelId)
  return post<LipSyncResponse>('/lip-sync', {
    provider: providerId,
    model,
    ...req,
  })
}

export async function pollJob(jobId: string, providerId: ProviderId): Promise<AIJobStatus> {
  const res = await fetchWithRetry(
    `${API_BASE}/job/${encodeURIComponent(jobId)}?provider=${providerId}`,
    { headers: authHeaders() },
    AI_PROVIDER_FETCH_CONFIG,
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Poll error ${res.status}`)
  }
  return res.json()
}

export async function getProviderStatus(): Promise<Record<string, boolean>> {
  const res = await fetchWithRetry(
    `${API_BASE}/status`,
    { headers: authHeaders() },
    { maxRetries: 1, timeoutMs: 15_000, retryDelayMs: 1_000 },
  )
  if (!res.ok) throw new Error('Failed to fetch provider status')
  return res.json()
}
