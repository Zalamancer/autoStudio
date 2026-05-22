import type { ElevenLabsAlignment, ElevenLabsVoice, VoiceSettings } from '@/types/voice'
import { withCreditGate } from './creditGate'
import { callElevenLabsProxy } from '@/services/aiProxy'
import { fetchWithRetry } from '@/utils/fetchWithRetry'
import { useAuthStore } from '@/stores/useAuthStore'

const ELEVENLABS_FETCH_CONFIG = { maxRetries: 2, timeoutMs: 60_000, retryDelayMs: 1_000 } as const

/**
 * ElevenLabs v3 emotion cue mapping.
 * Converts our [emotion] cues to v3 expressive text annotations.
 */
const EMOTION_V3_MAP: Record<string, string> = {
  happy: '<cheerful>',
  joy: '<joyfully>',
  amusement: '<amused, with a slight laugh>',
  laughter: '<laughing>',
  satisfaction: '<warmly, content>',
  excited: '<excitedly>',
  angry: '<angrily>',
  anger: '<angrily>',
  rage: '<furiously, with intensity>',
  indignation: '<indignantly>',
  sternness: '<sternly>',
  sad: '<sadly>',
  sadness: '<sadly, with melancholy>',
  grief: '<mournfully, voice breaking>',
  melancholy: '<wistfully>',
  dejection: '<dejectedly>',
  fear: '<fearfully, trembling>',
  anxiety: '<anxiously, nervously>',
  terror: '<terrified, voice shaking>',
  concern: '<with concern>',
  nervous: '<nervously>',
  surprise: '<surprised>',
  shock: '<shocked, gasping>',
  wonder: '<with wonder and awe>',
  alertness: '<alert, attentively>',
  disgust: '<with disgust>',
  revulsion: '<revolted>',
  aversion: '<with distaste>',
  disdain: '<disdainfully>',
  whisper: '<whispering>',
  shout: '<shouting>',
  dramatic: '<dramatically>',
  sarcastic: '<sarcastically>',
  confident: '<confidently>',
  thoughtful: '<thoughtfully>',
}

/**
 * Convert [emotion] cues in script text to ElevenLabs v3 expressive annotations.
 */
function convertEmotionCuesToV3(text: string): string {
  return text.replace(/\[(\w[\w-]*)\]/g, (_match, emotion: string) => {
    const lower = emotion.toLowerCase()
    return EMOTION_V3_MAP[lower] || `<${lower}>`
  })
}

export interface GenerateWithAlignmentResult {
  audioBlob: Blob
  audioUrl: string
  alignment: ElevenLabsAlignment
  duration: number
}

export class ElevenLabsService {
  // API key is now on the server; kept for backward-compat constructor signature
  constructor(_apiKey?: string) {}

  /**
   * Get list of available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    const response = await callElevenLabsProxy('voices', { method: 'GET' }, ELEVENLABS_FETCH_CONFIG)

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data.voices) ? data.voices : []
  }

  /**
   * Generate speech with alignment data (phonemes + character timings)
   */
  async generateWithAlignment(
    text: string,
    voiceId: string,
    settings: VoiceSettings = { stability: 0.5, similarityBoost: 0.75 },
  ): Promise<GenerateWithAlignmentResult> {
    return withCreditGate('elevenlabs-tts', async () => this._generateWithAlignmentImpl(text, voiceId, settings))
  }

  private async _generateWithAlignmentImpl(
    text: string,
    voiceId: string,
    settings: VoiceSettings = { stability: 0.5, similarityBoost: 0.75 },
  ): Promise<GenerateWithAlignmentResult> {
    const modelId = settings.modelId ?? 'eleven_v3'
    // For v3, convert [emotion] cues to expressive annotations
    const processedText = modelId === 'eleven_v3' ? convertEmotionCuesToV3(text) : text

    // Use the timestamps endpoint for alignment data
    const response = await callElevenLabsProxy(
      `text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: processedText,
          model_id: modelId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost,
            style: settings.style ?? 0,
            use_speaker_boost: settings.useSpeakerBoost ?? true,
          },
        }),
      },
      ELEVENLABS_FETCH_CONFIG,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to generate speech: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()

    // Decode base64 audio — use fetch(dataURI) for efficient browser-native decoding
    // (avoids blocking main thread with atob + char-by-char iteration on large payloads)
    const audioBase64 = data.audio_base64
    const dataUri = `data:audio/mpeg;base64,${audioBase64}`
    const audioResponse = await fetch(dataUri)
    const audioBlob = await audioResponse.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    // Calculate duration from alignment data
    const alignment = data.alignment as ElevenLabsAlignment
    const endTimes = alignment?.character_end_times_seconds || []
    const duration = endTimes.length > 0 ? endTimes[endTimes.length - 1] : 0

    return {
      audioBlob,
      audioUrl,
      alignment,
      duration,
    }
  }

  /**
   * Generate speech without alignment (regular TTS)
   */
  async generateSpeech(
    text: string,
    voiceId: string,
    settings: VoiceSettings = { stability: 0.5, similarityBoost: 0.75 },
  ): Promise<{ audioBlob: Blob; audioUrl: string }> {
    const modelId = settings.modelId ?? 'eleven_v3'
    const processedText = modelId === 'eleven_v3' ? convertEmotionCuesToV3(text) : text

    const response = await callElevenLabsProxy(
      `text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: processedText,
          model_id: modelId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost,
          },
        }),
      },
      ELEVENLABS_FETCH_CONFIG,
    )

    if (!response.ok) {
      throw new Error(`Failed to generate speech: ${response.statusText}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    return { audioBlob, audioUrl }
  }

  /**
   * Generate multilingual speech with alignment.
   * Uses eleven_multilingual_v2 model with language code parameter.
   */
  async generateMultilingual(
    text: string,
    voiceId: string,
    _languageCode: string,
    settings: VoiceSettings = { stability: 0.5, similarityBoost: 0.75 },
  ): Promise<GenerateWithAlignmentResult> {
    return this._generateWithAlignmentImpl(text, voiceId, {
      ...settings,
      modelId: 'eleven_multilingual_v2',
    })
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await callElevenLabsProxy('user', { method: 'GET' }, { maxRetries: 0, timeoutMs: 15_000 })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get user subscription info
   */
  async getUserInfo(): Promise<{
    characterCount: number
    characterLimit: number
  }> {
    const response = await callElevenLabsProxy('user/subscription', { method: 'GET' }, ELEVENLABS_FETCH_CONFIG)

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    const data = await response.json()
    return {
      characterCount: data.character_count,
      characterLimit: data.character_limit,
    }
  }

  /**
   * Generic ElevenLabs API caller — used by audioCleanup.ts, dubbing.ts, etc.
   * Routes through the server proxy.
   */
  async callElevenLabs(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return callElevenLabsProxy(endpoint, options, ELEVENLABS_FETCH_CONFIG)
  }

  /**
   * Clone a voice from audio samples via server proxy.
   */
  async cloneVoice(name: string, description: string, files: File[]): Promise<{ voice_id: string }> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    for (const file of files) {
      formData.append('files', file)
    }

    const token = useAuthStore.getState().session?.access_token
    const response = await fetchWithRetry(
      '/api/proxy/elevenlabs/voices/add',
      {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      ELEVENLABS_FETCH_CONFIG,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Voice cloning failed: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Delete a cloned voice via server proxy.
   */
  async deleteVoice(voiceId: string): Promise<void> {
    const token = useAuthStore.getState().session?.access_token
    const response = await fetchWithRetry(
      `/api/proxy/elevenlabs/voices/${voiceId}`,
      {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      ELEVENLABS_FETCH_CONFIG,
    )

    if (!response.ok) {
      throw new Error(`Failed to delete voice: ${response.statusText}`)
    }
  }
}

// Singleton instance — API key is on the server now, so this is just a wrapper.
let serviceInstance: ElevenLabsService | null = null

export function getElevenLabsService(): ElevenLabsService {
  if (!serviceInstance) {
    serviceInstance = new ElevenLabsService('proxy')
  }
  return serviceInstance
}

export function initElevenLabsService(apiKey: string): ElevenLabsService {
  serviceInstance = new ElevenLabsService(apiKey)
  return serviceInstance
}

export function hasElevenLabsService(): boolean {
  // Always available — key is on the server now
  return true
}

// ─── Music Generation Types ──────────────────────────────────────────────

export interface MusicSectionSource {
  type: 'section'
  section_name: string
}

export interface MusicSection {
  section_name: string
  positive_local_styles: string[]
  negative_local_styles: string[]
  duration_ms: number
  lines: string[]
  source_from?: MusicSectionSource
}

export interface MusicCompositionPlan {
  positive_global_styles: string[]
  negative_global_styles: string[]
  sections: MusicSection[]
}

export interface GenerateMusicResult {
  audioBlob: Blob
  audioUrl: string
  durationMs: number
}

// ─── Music Generation Functions ──────────────────────────────────────────

/**
 * Create a composition plan from a text prompt using ElevenLabs.
 * This endpoint is FREE (no credits) but rate-limited.
 */
export async function createMusicCompositionPlan(prompt: string, durationMs?: number): Promise<MusicCompositionPlan> {
  const body: Record<string, unknown> = {
    prompt,
    model_id: 'music_v1',
  }
  if (durationMs) body.music_length_ms = durationMs

  const response = await callElevenLabsProxy(
    'music/plan',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    ELEVENLABS_FETCH_CONFIG,
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to create composition plan: ${response.statusText} — ${errText}`)
  }

  return response.json()
}

/**
 * Generate music from a composition plan or simple prompt.
 * Returns binary audio as a Blob + object URL.
 */
export async function generateMusic(options: {
  prompt?: string
  compositionPlan?: MusicCompositionPlan
  durationMs?: number
  forceInstrumental?: boolean
}): Promise<GenerateMusicResult> {
  return withCreditGate('elevenlabs-music', async () => _generateMusicImpl(options))
}

async function _generateMusicImpl(options: {
  prompt?: string
  compositionPlan?: MusicCompositionPlan
  durationMs?: number
  forceInstrumental?: boolean
}): Promise<GenerateMusicResult> {
  const body: Record<string, unknown> = {
    model_id: 'music_v1',
  }

  if (options.compositionPlan) {
    body.composition_plan = options.compositionPlan
    body.respect_sections_durations = true
  } else if (options.prompt) {
    body.prompt = options.prompt
    if (options.durationMs) body.music_length_ms = options.durationMs
    if (options.forceInstrumental !== undefined) {
      body.force_instrumental = options.forceInstrumental
    }
  }

  const response = await callElevenLabsProxy(
    'music',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    ELEVENLABS_FETCH_CONFIG,
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to generate music: ${response.statusText} — ${errText}`)
  }

  const audioBlob = await response.blob()
  const audioUrl = URL.createObjectURL(audioBlob)

  // Estimate duration from blob size (approximation; real duration measured on load)
  // For mp3 at ~128kbps: durationMs ≈ blobSize * 8 / 128 (ms)
  const estimatedDurationMs = options.durationMs ?? Math.round((audioBlob.size * 8) / 128)

  return {
    audioBlob,
    audioUrl,
    durationMs: estimatedDurationMs,
  }
}

// ─── Sound Effect Generation Types ──────────────────────────────────────

export interface GenerateSoundEffectResult {
  audioBlob: Blob
  audioUrl: string
  durationMs: number
}

// ─── Sound Effect Generation Function ───────────────────────────────────

/**
 * Generate a sound effect from a text prompt using ElevenLabs.
 * Endpoint: POST /v1/sound-generation
 */
export async function generateSoundEffect(options: {
  text: string
  durationSeconds?: number
  promptInfluence?: number // 0-1, default 0.3
}): Promise<GenerateSoundEffectResult> {
  return withCreditGate('elevenlabs-sfx', async () => _generateSoundEffectImpl(options))
}

async function _generateSoundEffectImpl(options: {
  text: string
  durationSeconds?: number
  promptInfluence?: number
}): Promise<GenerateSoundEffectResult> {
  const body: Record<string, unknown> = {
    text: options.text,
  }
  if (options.durationSeconds !== undefined) {
    body.duration_seconds = options.durationSeconds
  }
  if (options.promptInfluence !== undefined) {
    body.prompt_influence = options.promptInfluence
  }

  const response = await callElevenLabsProxy(
    'sound-generation',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    ELEVENLABS_FETCH_CONFIG,
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to generate sound effect: ${response.statusText} — ${errText}`)
  }

  const audioBlob = await response.blob()
  const audioUrl = URL.createObjectURL(audioBlob)

  // Estimate duration from blob size (approximation; real duration measured on load)
  const estimatedDurationMs = options.durationSeconds
    ? options.durationSeconds * 1000
    : Math.round((audioBlob.size * 8) / 128)

  return {
    audioBlob,
    audioUrl,
    durationMs: estimatedDurationMs,
  }
}
