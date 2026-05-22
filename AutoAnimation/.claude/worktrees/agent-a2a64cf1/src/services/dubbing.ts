/**
 * Dubbing Service — ElevenLabs Dubbing API integration.
 *
 * Handles multi-language dubbing: submit audio → poll status →
 * download per-language audio → re-run lip sync + captions.
 */

import { getElevenLabsService } from './elevenlabs'
import type { SentenceEvent } from './captions'
import type { VisemeEvent, WordEvent } from '@/types/voice'
import { withCreditGate } from './creditGate'

// ── Types ──────────────────────────────────────────────────────────────

export interface DubbingJob {
  dubbingId: string
  status: 'dubbing' | 'dubbed' | 'failed'
  targetLanguages: string[]
  sourceLanguage: string
  createdAt: number
}

export interface DubbedLanguageResult {
  language: string
  languageLabel: string
  audioUrl: string
  audioBlob: Blob
  visemeTimeline: VisemeEvent[]
  wordTimeline: WordEvent[]
  sentenceTimeline: SentenceEvent[]
}

/** Languages supported by ElevenLabs Dubbing API */
export const DUBBING_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'pl', label: 'Polish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ms', label: 'Malay' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'cs', label: 'Czech' },
  { code: 'ro', label: 'Romanian' },
  { code: 'el', label: 'Greek' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'no', label: 'Norwegian' },
  { code: 'he', label: 'Hebrew' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'hr', label: 'Croatian' },
  { code: 'sk', label: 'Slovak' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'bn', label: 'Bengali' },
  { code: 'fil', label: 'Filipino' },
] as const

// ── API Functions ──────────────────────────────────────────────────────

/**
 * Create a dubbing job for an audio file.
 */
export async function createDubbingJob(
  audioBlob: Blob,
  sourceLanguage: string,
  targetLanguages: string[],
): Promise<string> {
  return withCreditGate('dubbing', async () => {
    const service = getElevenLabsService()

    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.mp3')
    formData.append('source_lang', sourceLanguage)
    formData.append('target_langs', targetLanguages.join(','))
    formData.append('mode', 'automatic')
    formData.append('watermark', 'false')

    const response = await service.callElevenLabs('dubbing', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Dubbing failed: ${response.statusText} - ${text}`)
    }

    const data = await response.json()
    return data.dubbing_id
  })
}

/**
 * Poll dubbing job status.
 */
export async function getDubbingStatus(
  dubbingId: string,
): Promise<{ status: string; error?: string }> {
  const service = getElevenLabsService()
  const response = await service.callElevenLabs(`dubbing/${dubbingId}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to get dubbing status: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Download dubbed audio for a specific language.
 */
export async function downloadDubbedAudio(
  dubbingId: string,
  languageCode: string,
): Promise<Blob> {
  const service = getElevenLabsService()
  const response = await service.callElevenLabs(
    `dubbing/${dubbingId}/audio/${languageCode}`,
    { method: 'GET' },
  )

  if (!response.ok) {
    throw new Error(`Failed to download dubbed audio: ${response.statusText}`)
  }

  return response.blob()
}

/**
 * Process dubbed audio: generate lip sync and caption timelines.
 *
 * Without alignment data from the dubbing API, we generate an estimated
 * word timeline by evenly distributing placeholder words across the audio
 * duration. This ensures captions display even without viseme data.
 */
export function processDubbedAudio(
  audioBlob: Blob,
  languageCode: string,
  fps: number,
  translatedText?: string,
): DubbedLanguageResult {
  const audioUrl = URL.createObjectURL(audioBlob)
  const label = DUBBING_LANGUAGES.find((l) => l.code === languageCode)?.label ?? languageCode

  // Estimate audio duration from blob size (rough: ~16kB/s for typical TTS audio)
  const estimatedDurationSec = Math.max(1, audioBlob.size / 16000)

  // Build basic word + sentence timelines if we have translated text
  const wordTimeline: WordEvent[] = []
  const sentenceTimeline: SentenceEvent[] = []

  if (translatedText && translatedText.trim()) {
    const words = translatedText.trim().split(/\s+/)
    const totalFrames = Math.round(estimatedDurationSec * fps)
    const framesPerWord = totalFrames / Math.max(1, words.length)

    for (let i = 0; i < words.length; i++) {
      const startFrame = Math.round(i * framesPerWord)
      const endFrame = Math.round((i + 1) * framesPerWord)
      wordTimeline.push({
        word: words[i],
        startFrame,
        endFrame,
        startTime: startFrame / fps,
        endTime: endFrame / fps,
      })
    }

    // Create a single sentence spanning the full duration
    sentenceTimeline.push({
      sentence: translatedText.trim(),
      startFrame: 0,
      endFrame: totalFrames,
      startTime: 0,
      endTime: estimatedDurationSec,
      words: wordTimeline,
    })
  }

  return {
    language: languageCode,
    languageLabel: label,
    audioUrl,
    audioBlob,
    visemeTimeline: [],
    wordTimeline,
    sentenceTimeline,
  }
}

/**
 * Poll until dubbing completes or fails.
 */
export async function waitForDubbing(
  dubbingId: string,
  onProgress?: (status: string) => void,
  maxWaitMs: number = 300_000,
): Promise<void> {
  const startTime = Date.now()
  const pollInterval = 5_000

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getDubbingStatus(dubbingId)
    onProgress?.(result.status)

    if (result.status === 'dubbed') return
    if (result.status === 'failed') {
      throw new Error(result.error || 'Dubbing failed')
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error('Dubbing timed out')
}
