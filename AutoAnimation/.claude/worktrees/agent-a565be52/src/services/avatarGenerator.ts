/**
 * Avatar character generation pipeline.
 *
 * 1. Generate base bust-shot image via Gemini (gemini-3.1-flash-image-preview)
 *    through the /api/nb2/generate endpoint with partType 'concept'
 * 2. Save to IndexedDB
 * 3. Return SavedAvatarCharacter with blob ID
 *
 * For video generation (lip sync), use generateAvatarVideo() which
 * calls the image-to-video pipeline.
 */
import type { SavedAvatarCharacter, AvatarStyle } from '@/types/avatar'
import { imageToVideo, lipSync, pollJob } from '@/services/aiProviderClient'
import { analyzePhotoForAvatar } from '@/services/photoToAvatar'
import { saveAvatarBlob } from '@/services/avatarDB'
import { getModel } from '@/services/aiProviderRegistry'
import { useAIProviderStore } from '@/stores/useAIProviderStore'
import { withCreditGate } from './creditGate'

const apiBase = import.meta.env.VITE_API_URL || ''

const STYLE_PROMPTS: Record<AvatarStyle, string> = {
  realistic: 'photorealistic, professional studio photography, DSLR quality, 85mm lens, natural skin texture with pores and fine details, realistic hair strands, subsurface scattering on skin, professional lighting with soft key light and subtle fill, sharp focus on eyes',
  'semi-realistic': 'semi-realistic digital art portrait, detailed shading, painterly style with realistic proportions, natural skin tones',
  illustrated: 'illustrated character portrait, clean lines, stylized digital art',
  anime: 'anime style character portrait, large expressive eyes, detailed hair, Japanese animation style',
}

export type AvatarResolution = '512' | '1024' | '2048'
export type AvatarAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9'

export interface AvatarGenerationOptions {
  prompt: string
  name?: string
  style: AvatarStyle
  source: 'text' | 'photo'
  sourcePhotoDataUrl?: string
  resolution?: AvatarResolution
  aspectRatio?: AvatarAspectRatio
  onProgress?: (step: string, progress: number) => void
}

export interface AvatarVideoOptions {
  /** Base avatar image as base64 data URL */
  imageBase64: string
  /** Prompt describing desired video movement/speech */
  prompt?: string
  durationSeconds?: number
  modelId?: string
  resolution?: string
  fps?: number
  aspectRatio?: string
  generateAudio?: boolean
  onProgress?: (step: string, progress: number) => void
}

/** Convert a base64 data URL to a Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

/** Downscale an image data URL to a small thumbnail to avoid localStorage quota issues */
async function createThumbnail(dataUrl: string, maxSize = 128): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve('')
    img.src = dataUrl
  })
}

/**
 * Call the NB2 endpoint to generate an image via Gemini (gemini-3.1-flash-image-preview).
 * Uses `customPrompt` to bypass the NB2 concept template (which is designed for
 * full-body cartoon characters) and send the avatar prompt directly.
 */
async function callNB2Generate(
  prompt: string,
  conceptImage?: string,
  resolution: AvatarResolution = '1024',
  aspectRatio: AvatarAspectRatio = '3:4',
): Promise<string> {
  const body: Record<string, string> = {
    partType: 'concept',
    prompt: 'avatar portrait',
    customPrompt: prompt,
    resolution,
    aspectRatio,
  }

  if (conceptImage) {
    // Strip data URL prefix for the API
    body.conceptImage = conceptImage.replace(/^data:image\/\w+;base64,/, '')
  }

  const response = await fetch(`${apiBase}/api/nb2/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || `Image generation failed: ${response.statusText}`)
  }

  const data = await response.json()
  if (!data.image) {
    throw new Error('No image returned from Gemini')
  }

  return data.image as string // base64 image data
}

/**
 * Generate a base avatar image and save to library.
 * Uses Gemini image generation (gemini-3.1-flash-image-preview) via the NB2 endpoint.
 */
export async function generateAvatarCharacter(
  opts: AvatarGenerationOptions
): Promise<SavedAvatarCharacter> {
  const { prompt, name, style, source, sourcePhotoDataUrl, resolution, aspectRatio, onProgress } = opts

  return withCreditGate('nb2-generate', async () => {
    let fullPrompt = prompt

    // Step 1: If source is photo, analyze it first
    if (source === 'photo' && sourcePhotoDataUrl) {
      onProgress?.('Analyzing photo...', 10)
      const description = await analyzePhotoForAvatar(
        sourcePhotoDataUrl,
        style === 'anime' ? 'anime' : style === 'illustrated' ? 'cartoon' : 'semi-realistic'
      )
      fullPrompt = description.generationPrompt
    }

    // Step 2: Generate base image via Gemini
    onProgress?.('Generating avatar image...', 30)

    const imagePrompt = `Close-up portrait photograph, head and shoulders only, cropped above the chest, front-facing centered composition, solid plain neutral gray background, no props no text no watermarks.

${STYLE_PROMPTS[style]}

Subject: ${fullPrompt}

IMPORTANT: Frame tightly from mid-chest to just above the head. Show face, neck, and tops of shoulders only. Do NOT show full body, arms, or hands. The face should fill most of the frame. Make the person look like a real human being — natural proportions, realistic skin with visible texture, real hair with individual strands visible, natural eye reflections and catchlights.`

    const base64Image = await callNB2Generate(
      imagePrompt,
      source === 'photo' ? sourcePhotoDataUrl : undefined,
      resolution,
      aspectRatio,
    )

    onProgress?.('Processing image...', 70)

    const fullDataUrl = `data:image/png;base64,${base64Image}`
    const imageBlob = dataUrlToBlob(fullDataUrl)
    // Create a small thumbnail for localStorage persistence (full image lives in IndexedDB)
    const thumbnailDataUrl = await createThumbnail(fullDataUrl)

    // Step 3: Save to IndexedDB
    onProgress?.('Saving avatar...', 90)
    const characterId = `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const baseBlobId = `${characterId}_base`
    await saveAvatarBlob(baseBlobId, imageBlob)

    const savedCharacter: SavedAvatarCharacter = {
      id: characterId,
      name: name || 'Avatar',
      description: prompt,
      style,
      thumbnailDataUrl,
      baseBlobId,
      source,
      sourcePhotoDataUrl: source === 'photo' ? sourcePhotoDataUrl : undefined,
      createdAt: Date.now(),
    }

    onProgress?.('Done!', 100)
    return savedCharacter
  })
}

/**
 * Generate a lip-synced video from an avatar base image.
 * Uses the image-to-video pipeline from the AI provider registry.
 * Returns the video URL once generation is complete.
 */
export async function generateAvatarVideo(
  opts: AvatarVideoOptions
): Promise<string> {
  const { imageBase64, prompt, durationSeconds, modelId, resolution, fps, aspectRatio, generateAudio, onProgress } = opts

  onProgress?.('Starting video generation...', 5)

  // Strip data URL prefix to get raw base64
  const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64

  // Resolve model — fall back to Kling v3 standard (more reliable than LTX)
  const resolvedModel = modelId
    ?? useAIProviderStore.getState().defaults['image-to-video']
    ?? 'fal-ai/kling-video/v3/standard/image-to-video'

  // Ensure resolution is valid for models that require it (e.g. LTX)
  const meta = getModel(resolvedModel)
  const resolvedResolution = resolution
    || meta?.videoSettings?.defaultResolution
    || undefined

  const response = await imageToVideo(
    {
      imageBase64: base64,
      prompt: prompt || 'talking head, character speaking, subtle mouth movement, natural blinking',
      durationSeconds: durationSeconds ?? 6,
      resolution: resolvedResolution,
      fps,
      aspectRatio,
      generateAudio,
    },
    resolvedModel
  )

  if (!response.jobId) {
    throw new Error('No job ID returned from video generation')
  }

  onProgress?.('Generating video...', 20)

  // Validate model for polling
  if (!meta) throw new Error(`Unknown model: ${resolvedModel}. Please select an image-to-video model in Settings > AI Models.`)

  // Poll for completion
  let status = await pollJob(response.jobId, meta.providerId)
  let attempts = 0
  const maxAttempts = 120 // 10 minutes at 5s intervals

  while (status.status !== 'completed' && status.status !== 'failed' && attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 5000))
    status = await pollJob(response.jobId, meta.providerId)
    attempts++

    const progress = Math.min(20 + (attempts / maxAttempts) * 70, 90)
    onProgress?.('Generating video...', progress)
  }

  if (status.status === 'failed') {
    throw new Error(status.error || 'Video generation failed')
  }

  if (status.status !== 'completed' || !status.result?.url) {
    throw new Error('Video generation timed out')
  }

  onProgress?.('Video ready!', 100)
  return status.result.url
}

/** Convert a Blob to a base64 data URI string */
export function blobToBase64DataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export interface AvatarLipSyncOptions {
  /** Avatar image as base64 data URL (for image-input models like VEED Fabric) */
  imageBase64?: string
  /** Existing video URL (for video-input models like Kling LipSync) */
  videoUrl?: string
  /** Audio blob (TTS or uploaded file) */
  audioBlob: Blob
  modelId?: string
  resolution?: string
  onProgress?: (step: string, progress: number) => void
}

/**
 * Generate a lip-synced video from an avatar image + audio.
 * Converts audio blob to a base64 data URI, submits to the lip-sync
 * pipeline, polls for completion, and returns the video URL.
 */
export async function generateAvatarLipSync(
  opts: AvatarLipSyncOptions
): Promise<string> {
  const { imageBase64, videoUrl, audioBlob, modelId, resolution, onProgress } = opts

  onProgress?.('Preparing audio...', 5)

  // Convert audio blob to base64 data URI for FAL's audio_url parameter
  const audioDataUri = await blobToBase64DataUri(audioBlob)

  onProgress?.('Starting lip sync...', 10)

  const resolvedModel = modelId
    ?? useAIProviderStore.getState().defaults['lip-sync']
    ?? 'veed/fabric-1.0'

  const response = await lipSync(
    {
      imageBase64: imageBase64 ? (imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64) : undefined,
      videoUrl,
      audioBase64: audioDataUri,
      resolution,
    },
    resolvedModel
  )

  if (!response.jobId) {
    throw new Error('No job ID returned from lip sync generation')
  }

  onProgress?.('Generating lip sync video...', 20)

  const meta = getModel(resolvedModel)
  if (!meta) throw new Error(`Unknown model: ${resolvedModel}`)

  let status = await pollJob(response.jobId, meta.providerId)
  let attempts = 0
  const maxAttempts = 120

  while (status.status !== 'completed' && status.status !== 'failed' && attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 5000))
    status = await pollJob(response.jobId, meta.providerId)
    attempts++
    const progress = Math.min(20 + (attempts / maxAttempts) * 70, 90)
    onProgress?.('Generating lip sync video...', progress)
  }

  if (status.status === 'failed') {
    throw new Error(status.error || 'Lip sync generation failed')
  }

  if (status.status !== 'completed' || !status.result?.url) {
    throw new Error('Lip sync generation timed out')
  }

  onProgress?.('Lip sync video ready!', 100)
  return status.result.url
}
