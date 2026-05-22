// ─── Agent 5: Narrator ──────────────────────────────────────────────────────
// Wraps ElevenLabs TTS integration to produce per-scene narration audio
// with phoneme-level alignment for lip sync.

import type { NarrationResult, SceneSpec, PhonemeTimestamp } from '@/services/manim/types'
import { callElevenLabsProxy } from '@/services/aiProxy'

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel

interface ElevenLabsTimestampResponse {
  audio_base64: string
  alignment: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  }
}

/**
 * Convert base64 audio to a blob URL and compute its duration.
 */
async function base64ToBlobUrl(base64: string, mimeType = 'audio/mpeg'): Promise<{ url: string; duration: number }> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)

  // Decode audio to get accurate duration
  const duration = await new Promise<number>((resolve, reject) => {
    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration))
    audio.addEventListener('error', () => reject(new Error('Failed to load audio for duration check')))
  })

  return { url, duration }
}

/**
 * Extract phoneme timestamps from ElevenLabs character-level alignment.
 * Groups consecutive characters into approximate phoneme-like segments.
 */
function extractPhonemeTimestamps(alignment: ElevenLabsTimestampResponse['alignment']): PhonemeTimestamp[] {
  const timestamps: PhonemeTimestamp[] = []
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    // Skip whitespace and punctuation for phoneme alignment
    if (/\s/.test(char) || /[.,!?;:'"()-]/.test(char)) continue

    timestamps.push({
      phoneme: char,
      startTime: character_start_times_seconds[i],
      endTime: character_end_times_seconds[i],
    })
  }

  return timestamps
}

/**
 * Narrate a single scene using ElevenLabs TTS with phoneme alignment.
 */
export async function narrateScene(scene: SceneSpec, voiceId?: string): Promise<NarrationResult> {
  const voice = voiceId || DEFAULT_VOICE_ID

  // Use the with-timestamps endpoint for phoneme alignment (via server proxy)
  const res = await callElevenLabsProxy(`text-to-speech/${voice}/with-timestamps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: scene.narrationText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`ElevenLabs TTS error (${res.status}) for scene ${scene.index}: ${errorBody}`)
  }

  const data = (await res.json()) as ElevenLabsTimestampResponse

  if (!data.audio_base64) {
    throw new Error(`ElevenLabs returned no audio for scene ${scene.index}`)
  }

  const { url, duration } = await base64ToBlobUrl(data.audio_base64)
  const phonemeAlignment = data.alignment ? extractPhonemeTimestamps(data.alignment) : undefined

  return {
    sceneIndex: scene.index,
    audioUrl: url,
    durationSeconds: duration,
    phonemeAlignment,
  }
}

/**
 * Narrate all scenes sequentially to avoid ElevenLabs rate limits.
 */
export async function narrateAllScenes(scenes: SceneSpec[], voiceId?: string): Promise<NarrationResult[]> {
  const results: NarrationResult[] = []

  for (const scene of scenes) {
    const result = await narrateScene(scene, voiceId)
    results.push(result)
  }

  return results
}
