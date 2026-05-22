/**
 * Whisper Transcript Service — Upload audio/video → get word-level transcript.
 *
 * Supports multiple providers: whisper (OpenAI), deepgram, assemblyai
 */

import { withCreditGate } from './creditGate'
import type { SilenceRegion, FillerRegion } from '@/types/silenceRemoval'

export interface WhisperWord {
  word: string
  start: number
  end: number
  confidence: number // 0-1
  speaker?: string
}

export interface WhisperSegment {
  id: number
  text: string
  start: number
  end: number
  speaker?: string
  words: WhisperWord[]
}

export interface WhisperResult {
  text: string
  language: string
  duration: number
  segments: WhisperSegment[]
  words: WhisperWord[]
}

export interface TranscriptionOptions {
  provider?: 'whisper' | 'deepgram' | 'assemblyai'
  language?: string
  diarize?: boolean
  model?: string
}

/**
 * Upload audio/video file to the server for transcription.
 */
export async function transcribeAudio(file: File, options: TranscriptionOptions = {}): Promise<WhisperResult> {
  return withCreditGate('whisper-transcript', async () => {
    const formData = new FormData()
    formData.append('audio', file)

    const params = new URLSearchParams()
    if (options.provider) params.set('provider', options.provider)
    if (options.language) params.set('language', options.language)
    if (options.diarize) params.set('diarize', 'true')
    if (options.model) params.set('model', options.model)

    const queryString = params.toString()
    const url = `/api/whisper/transcribe${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Transcription failed: ${response.statusText}`)
    }

    return response.json()
  })
}

/**
 * Transcribe from an already-uploaded audio URL.
 */
export async function transcribeFromUrl(audioUrl: string, options: TranscriptionOptions = {}): Promise<WhisperResult> {
  return withCreditGate('whisper-transcript', async () => {
    // Fetch the audio from the URL first, then send to our API
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio from URL: ${audioResponse.statusText}`)
    }
    const audioBlob = await audioResponse.blob()
    const file = new File([audioBlob], 'audio.mp3', { type: audioBlob.type })
    return transcribeAudio(file, options)
  })
}

/**
 * Convert WhisperSegments into dialogue lines for ProAnimate import.
 */
export function segmentsToDialogueLines(
  segments: WhisperSegment[],
  fps: number = 30,
): { script: string; startFrame: number; endFrame: number; emotion: 'Auto' }[] {
  return segments.map((seg) => ({
    script: seg.text.trim(),
    startFrame: Math.round(seg.start * fps),
    endFrame: Math.round(seg.end * fps),
    emotion: 'Auto' as const,
  }))
}

/**
 * Detect silence regions (gaps between consecutive words exceeding the threshold).
 */
export function detectSilences(words: WhisperWord[], thresholdSec: number): SilenceRegion[] {
  const silences: SilenceRegion[] = []

  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].start - words[i].end
    if (gap > thresholdSec) {
      silences.push({
        startTime: words[i].end,
        endTime: words[i + 1].start,
        duration: gap,
        type: 'silence',
      })
    }
  }

  return silences
}

/**
 * Detect filler words in the transcript.
 * Supports multi-word fillers (e.g., "you know") via lookahead.
 */
export function detectFillers(words: WhisperWord[], fillerList: string[]): FillerRegion[] {
  const fillers: FillerRegion[] = []
  const singleWordFillers = fillerList.filter((f) => !f.includes(' '))
  const multiWordFillers = fillerList.filter((f) => f.includes(' '))

  for (let i = 0; i < words.length; i++) {
    const cleaned = words[i].word.toLowerCase().replace(/[.,!?;:"'()[\]{}]/g, '')

    // Check multi-word fillers first
    let matched = false
    for (const mwf of multiWordFillers) {
      const parts = mwf.split(' ')
      if (i + parts.length <= words.length) {
        const combined = parts
          .map((_, j) => words[i + j].word.toLowerCase().replace(/[.,!?;:"'()[\]{}]/g, ''))
          .join(' ')
        if (combined === mwf) {
          fillers.push({
            startTime: words[i].start,
            endTime: words[i + parts.length - 1].end,
            word: mwf,
            type: 'filler',
          })
          matched = true
          break
        }
      }
    }

    if (!matched && singleWordFillers.includes(cleaned)) {
      fillers.push({
        startTime: words[i].start,
        endTime: words[i].end,
        word: cleaned,
        type: 'filler',
      })
    }
  }

  return fillers
}
