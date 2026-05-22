// ── AI Provider Registry Types ──

export type AICapability =
  | 'text-to-image'
  | 'image-to-image'
  | 'text-to-video'
  | 'image-to-video'
  | 'text-to-3d'
  | 'image-upscale'
  | 'background-removal'
  | 'inpainting'
  | 'lip-sync'

export type ProviderId = 'fal-ai' | 'replicate' | 'vertex-ai' | 'meshy' | 'gemini'

export interface AIProviderMeta {
  id: ProviderId
  name: string
  website: string
  capabilities: AICapability[]
  models: AIModelMeta[]
  envVar: string
}

export interface AIModelVideoSettings {
  durations?: number[]
  defaultDuration?: number
  resolutions?: string[]
  defaultResolution?: string
  fpsOptions?: number[]
  defaultFps?: number
  aspectRatios?: string[]
  supportsAudio?: boolean
}

export interface AIModelMeta {
  id: string
  name: string
  providerId: ProviderId
  capability: AICapability
  tier: 'fast' | 'standard' | 'premium'
  creditCost: number
  async: boolean
  estimatedSeconds?: number
  aspectRatios?: string[]
  maxResolution?: { width: number; height: number }
  videoSettings?: AIModelVideoSettings
  /** For lip-sync models: whether input is an image or existing video */
  lipSyncInputType?: 'image' | 'video'
}

// ── Unified Request/Response per Capability ──

export interface TextToImageRequest {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  aspectRatio?: string
  seed?: number
  count?: number
}

export interface TextToImageResponse {
  images: Array<{ url?: string; base64?: string; seed?: number }>
  jobId?: string
}

export interface ImageToVideoRequest {
  imageUrl?: string
  imageBase64?: string
  prompt?: string
  durationSeconds?: number
  aspectRatio?: string
  resolution?: string
  fps?: number
  generateAudio?: boolean
}

export interface ImageToVideoResponse {
  jobId: string
}

export interface TextToVideoRequest {
  prompt: string
  durationSeconds?: number
  aspectRatio?: string
  width?: number
  height?: number
}

export interface TextToVideoResponse {
  jobId: string
}

export interface LipSyncRequest {
  imageBase64?: string
  imageUrl?: string
  videoUrl?: string
  audioBase64?: string
  audioUrl?: string
  resolution?: string
  guidanceScale?: number
  seed?: number
  loopMode?: string
}

export interface LipSyncResponse {
  jobId: string
}

export interface AIJobStatus {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  result?: { url?: string; urls?: string[]; base64?: string }
  error?: string
  estimatedSeconds?: number
}
