/**
 * Transcription Provider Abstraction Layer
 *
 * Provides a unified interface for all transcription providers.
 * Used by the server route to normalize responses.
 */

import type { WhisperWord, WhisperSegment } from './whisperTranscript'

export type TranscriptionProviderType = 'whisper' | 'deepgram' | 'assemblyai'

export interface NormalizedTranscript {
  text: string
  language: string
  duration: number
  segments: WhisperSegment[]
  words: WhisperWord[]
}

export interface TranscriptionProvider {
  name: TranscriptionProviderType
  transcribe(audio: Blob, options: TranscriptionOptions): Promise<NormalizedTranscript>
}

export interface TranscriptionOptions {
  provider?: TranscriptionProviderType
  language?: string
  diarize?: boolean
  model?: string
}

/**
 * WhisperProvider - uses the existing Whisper endpoint
 */
export class WhisperProvider implements TranscriptionProvider {
  name: TranscriptionProviderType = 'whisper'

  async transcribe(audio: Blob, options: TranscriptionOptions): Promise<NormalizedTranscript> {
    const formData = new FormData()
    formData.append('audio', audio)

    const params = new URLSearchParams()
    params.set('provider', 'whisper')
    if (options.language) params.set('language', options.language)
    if (options.diarize) params.set('diarize', 'true')

    const response = await fetch(`/api/whisper/transcribe?${params.toString()}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Whisper transcription failed: ${response.statusText}`)
    }

    return response.json()
  }
}

/**
 * DeepgramProvider - uses Deepgram via the same endpoint
 */
export class DeepgramProvider implements TranscriptionProvider {
  name: TranscriptionProviderType = 'deepgram'

  async transcribe(audio: Blob, options: TranscriptionOptions): Promise<NormalizedTranscript> {
    const formData = new FormData()
    formData.append('audio', audio)

    const params = new URLSearchParams()
    params.set('provider', 'deepgram')
    if (options.language) params.set('language', options.language)
    if (options.diarize) params.set('diarize', 'true')
    if (options.model) params.set('model', options.model)

    const response = await fetch(`/api/whisper/transcribe?${params.toString()}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Deepgram transcription failed: ${response.statusText}`)
    }

    return response.json()
  }
}

/**
 * AssemblyAIProvider - uses AssemblyAI via the same endpoint
 */
export class AssemblyAIProvider implements TranscriptionProvider {
  name: TranscriptionProviderType = 'assemblyai'

  async transcribe(audio: Blob, options: TranscriptionOptions): Promise<NormalizedTranscript> {
    const formData = new FormData()
    formData.append('audio', audio)

    const params = new URLSearchParams()
    params.set('provider', 'assemblyai')
    if (options.language) params.set('language', options.language)
    if (options.diarize) params.set('diarize', 'true')

    const response = await fetch(`/api/whisper/transcribe?${params.toString()}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `AssemblyAI transcription failed: ${response.statusText}`)
    }

    return response.json()
  }
}

/**
 * Get a provider instance by name
 */
export function getTranscriptionProvider(name: TranscriptionProviderType): TranscriptionProvider {
  switch (name) {
    case 'deepgram':
      return new DeepgramProvider()
    case 'assemblyai':
      return new AssemblyAIProvider()
    case 'whisper':
    default:
      return new WhisperProvider()
  }
}
