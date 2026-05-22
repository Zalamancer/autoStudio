/**
 * AssemblyAI Provider — Server-side AssemblyAI integration.
 *
 * Two-step: upload audio -> create transcript -> poll until complete.
 * Supports speaker labels, auto-chapters, sentiment analysis.
 * Normalizes response to WhisperResult shape.
 */

import logger from '../lib/logger'
import type { NormalizedResult, NormalizedWord, NormalizedSegment } from './deepgramProvider'

const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2'

interface AssemblyAIWord {
  text: string
  start: number
  end: number
  confidence: number
  speaker?: string
}

interface AssemblyAIUtterance {
  text: string
  start: number
  end: number
  confidence: number
  speaker: string
  words: AssemblyAIWord[]
}

interface AssemblyAITranscriptResponse {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  text: string | null
  words: AssemblyAIWord[] | null
  utterances: AssemblyAIUtterance[] | null
  audio_duration: number | null
  language_code: string | null
  error?: string
}

function getApiKey(): string {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY not configured')
  }
  return apiKey
}

async function uploadAudio(audioBuffer: Buffer): Promise<string> {
  const apiKey = getApiKey()

  logger.info('[AssemblyAI] Uploading audio...')

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: audioBuffer,
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error({ status: response.status, body: errorText }, '[AssemblyAI] Upload error')
    throw new Error(`AssemblyAI upload failed: ${response.statusText}`)
  }

  const data = (await response.json()) as { upload_url: string }
  return data.upload_url
}

async function createTranscript(
  audioUrl: string,
  options: { diarize?: boolean; language?: string },
): Promise<string> {
  const apiKey = getApiKey()

  const body: Record<string, unknown> = {
    audio_url: audioUrl,
    punctuate: true,
    format_text: true,
  }

  if (options.diarize) {
    body.speaker_labels = true
  }
  if (options.language) {
    body.language_code = options.language
  } else {
    body.language_detection = true
  }

  logger.info({ diarize: options.diarize }, '[AssemblyAI] Creating transcript...')

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error({ status: response.status, body: errorText }, '[AssemblyAI] Transcript creation error')
    throw new Error(`AssemblyAI transcript creation failed: ${response.statusText}`)
  }

  const data = (await response.json()) as { id: string }
  return data.id
}

async function pollTranscript(transcriptId: string): Promise<AssemblyAITranscriptResponse> {
  const apiKey = getApiKey()
  const maxAttempts = 120 // 10 minutes max (5s intervals)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
      headers: { Authorization: apiKey },
    })

    if (!response.ok) {
      throw new Error(`AssemblyAI polling failed: ${response.statusText}`)
    }

    const data = (await response.json()) as AssemblyAITranscriptResponse

    if (data.status === 'completed') {
      return data
    }

    if (data.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${data.error || 'Unknown error'}`)
    }

    // Wait 5 seconds between polls
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  throw new Error('AssemblyAI transcription timed out')
}

export async function transcribeWithAssemblyAI(
  audioBuffer: Buffer,
  _mimetype: string,
  options: { diarize?: boolean; language?: string } = {},
): Promise<NormalizedResult> {
  // Step 1: Upload audio
  const uploadUrl = await uploadAudio(audioBuffer)

  // Step 2: Create transcript
  const transcriptId = await createTranscript(uploadUrl, options)

  // Step 3: Poll until complete
  const result = await pollTranscript(transcriptId)

  // Normalize to WhisperResult shape
  // AssemblyAI timestamps are in milliseconds
  const words: NormalizedWord[] = (result.words || []).map((w) => ({
    word: w.text,
    start: w.start / 1000,
    end: w.end / 1000,
    confidence: w.confidence,
    speaker: w.speaker || undefined,
  }))

  let segments: NormalizedSegment[]
  if (result.utterances && result.utterances.length > 0) {
    segments = result.utterances.map((utt, i) => ({
      id: i,
      text: utt.text,
      start: utt.start / 1000,
      end: utt.end / 1000,
      speaker: utt.speaker,
      words: utt.words.map((w) => ({
        word: w.text,
        start: w.start / 1000,
        end: w.end / 1000,
        confidence: w.confidence,
        speaker: w.speaker || undefined,
      })),
    }))
  } else {
    // Group words into segments by sentence breaks
    segments = groupWordsIntoSegments(words)
  }

  return {
    text: result.text || '',
    language: result.language_code || 'en',
    duration: (result.audio_duration || 0),
    segments,
    words,
  }
}

function groupWordsIntoSegments(words: NormalizedWord[]): NormalizedSegment[] {
  if (words.length === 0) return []

  const segments: NormalizedSegment[] = []
  let currentWords: NormalizedWord[] = []
  let segId = 0

  for (const word of words) {
    currentWords.push(word)
    if (word.word.match(/[.!?]$/)) {
      segments.push({
        id: segId++,
        text: currentWords.map((w) => w.word).join(' '),
        start: currentWords[0].start,
        end: currentWords[currentWords.length - 1].end,
        speaker: currentWords[0].speaker,
        words: [...currentWords],
      })
      currentWords = []
    }
  }

  if (currentWords.length > 0) {
    segments.push({
      id: segId,
      text: currentWords.map((w) => w.word).join(' '),
      start: currentWords[0].start,
      end: currentWords[currentWords.length - 1].end,
      speaker: currentWords[0].speaker,
      words: [...currentWords],
    })
  }

  return segments
}
