/**
 * Music Generation Service
 *
 * Abstracts multiple music generation providers (Suno, ElevenLabs).
 * The backend selects the best available provider; the frontend
 * sends genre/mood/tempo parameters and receives audio.
 */

import { withCreditGate } from './creditGate'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface MusicGenerationOptions {
  /** Text prompt describing the desired music */
  prompt: string
  /** Target genre */
  genre?: MusicGenre
  /** Mood/energy */
  mood?: MusicMood
  /** BPM hint (0 = auto) */
  tempo?: number
  /** Duration in seconds (max 240) */
  durationSeconds?: number
  /** Whether to generate instrumental only */
  instrumental?: boolean
}

export type MusicGenre =
  | 'ambient'
  | 'cinematic'
  | 'electronic'
  | 'hip-hop'
  | 'jazz'
  | 'lo-fi'
  | 'orchestral'
  | 'pop'
  | 'rock'
  | 'r&b'
  | 'acoustic'
  | 'world'
  | 'custom'

export type MusicMood =
  | 'uplifting'
  | 'energetic'
  | 'calm'
  | 'dark'
  | 'dramatic'
  | 'happy'
  | 'melancholic'
  | 'mysterious'
  | 'romantic'
  | 'suspenseful'
  | 'neutral'

export interface MusicGenerationResult {
  audioBlob: Blob
  audioUrl: string
  durationSeconds: number
  provider: 'suno' | 'elevenlabs'
  title?: string
}

export interface MusicGenerationJobStatus {
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress: number
  audioUrl?: string
  durationSeconds?: number
  provider?: string
  title?: string
  error?: string
}

/**
 * Generate music via the backend (picks best available provider).
 * Falls back to ElevenLabs if no dedicated music API is configured.
 */
export async function generateMusicAdvanced(
  options: MusicGenerationOptions,
): Promise<MusicGenerationResult> {
  return withCreditGate('music-generation', async () => {
    const response = await fetch(`${API_BASE}/api/music-generation/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const jobId = data.jobId as string

    // Poll for completion
    return pollMusicJob(jobId)
  })
}

async function pollMusicJob(jobId: string): Promise<MusicGenerationResult> {
  const maxAttempts = 120 // 4 minutes at 2s intervals
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000))

    const response = await fetch(`${API_BASE}/api/music-generation/status/${jobId}`)
    if (!response.ok) continue

    const status: MusicGenerationJobStatus = await response.json()

    if (status.status === 'error') {
      throw new Error(status.error || 'Music generation failed')
    }

    if (status.status === 'complete' && status.audioUrl) {
      // Download audio blob
      const audioResponse = await fetch(`${API_BASE}/api/music-generation/download/${jobId}`)
      if (!audioResponse.ok) throw new Error('Failed to download generated music')
      const audioBlob = await audioResponse.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      return {
        audioBlob,
        audioUrl,
        durationSeconds: status.durationSeconds || 30,
        provider: (status.provider as 'suno' | 'elevenlabs') || 'elevenlabs',
        title: status.title,
      }
    }
  }

  throw new Error('Music generation timed out')
}

/**
 * Check if the advanced music generation backend is available.
 */
export async function isMusicGenerationAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/music-generation/providers`)
    if (!response.ok) return false
    const data = await response.json()
    return Array.isArray(data.providers) && data.providers.length > 0
  } catch {
    return false
  }
}

/**
 * Build a music prompt string from genre + mood + custom text.
 */
export function buildMusicPrompt(options: {
  genre?: MusicGenre
  mood?: MusicMood
  tempo?: number
  customPrompt?: string
}): string {
  const parts: string[] = []
  if (options.genre && options.genre !== 'custom') parts.push(options.genre)
  if (options.mood) parts.push(options.mood)
  if (options.tempo && options.tempo > 0) parts.push(`${options.tempo} BPM`)
  if (options.customPrompt) parts.push(options.customPrompt)
  return parts.join(', ') || 'cinematic background music'
}

export const GENRE_OPTIONS: Array<{ value: MusicGenre; label: string }> = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'lo-fi', label: 'Lo-fi' },
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'hip-hop', label: 'Hip Hop' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'orchestral', label: 'Orchestral' },
  { value: 'r&b', label: 'R&B' },
  { value: 'acoustic', label: 'Acoustic' },
  { value: 'world', label: 'World' },
  { value: 'custom', label: 'Custom' },
]

export const MOOD_OPTIONS: Array<{ value: MusicMood; label: string }> = [
  { value: 'uplifting', label: 'Uplifting' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'calm', label: 'Calm' },
  { value: 'happy', label: 'Happy' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'dark', label: 'Dark' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'suspenseful', label: 'Suspenseful' },
  { value: 'neutral', label: 'Neutral' },
]
