/**
 * Deepgram Provider — Server-side Deepgram integration.
 *
 * POST https://api.deepgram.com/v1/listen with audio buffer.
 * Supports diarization, punctuation, utterance detection.
 * Normalizes response to WhisperResult shape.
 */

import logger from '../lib/logger'

export interface DeepgramWord {
  word: string
  start: number
  end: number
  confidence: number
  speaker?: number
}

export interface DeepgramUtterance {
  start: number
  end: number
  transcript: string
  speaker: number
  words: DeepgramWord[]
}

export interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string
        words: DeepgramWord[]
      }>
    }>
    utterances?: DeepgramUtterance[]
  }
  metadata: {
    duration: number
    language?: string
  }
}

export interface NormalizedWord {
  word: string
  start: number
  end: number
  confidence: number
  speaker?: string
}

export interface NormalizedSegment {
  id: number
  text: string
  start: number
  end: number
  speaker?: string
  words: NormalizedWord[]
}

export interface NormalizedResult {
  text: string
  language: string
  duration: number
  segments: NormalizedSegment[]
  words: NormalizedWord[]
}

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen'

export async function transcribeWithDeepgram(
  audioBuffer: Buffer,
  mimetype: string,
  options: { diarize?: boolean; language?: string; model?: string } = {},
): Promise<NormalizedResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured')
  }

  const params = new URLSearchParams({
    model: options.model || 'nova-2',
    punctuate: 'true',
    utterances: 'true',
    smart_format: 'true',
  })

  if (options.diarize) {
    params.set('diarize', 'true')
  }
  if (options.language) {
    params.set('language', options.language)
  } else {
    params.set('detect_language', 'true')
  }

  const url = `${DEEPGRAM_API_URL}?${params.toString()}`

  logger.info({ url: DEEPGRAM_API_URL, diarize: options.diarize }, '[Deepgram] Sending transcription request')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': mimetype || 'audio/mpeg',
    },
    body: audioBuffer,
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error({ status: response.status, body: errorText }, '[Deepgram] API error')
    throw new Error(`Deepgram API error: ${response.statusText}`)
  }

  const data = (await response.json()) as DeepgramResponse

  // Normalize to WhisperResult shape
  const channel = data.results.channels[0]
  const alternative = channel?.alternatives[0]

  if (!alternative) {
    return { text: '', language: 'en', duration: 0, segments: [], words: [] }
  }

  const words: NormalizedWord[] = (alternative.words || []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
    confidence: w.confidence,
    speaker: w.speaker !== undefined ? `Speaker ${w.speaker + 1}` : undefined,
  }))

  // Build segments from utterances if available, otherwise from words
  let segments: NormalizedSegment[]
  if (data.results.utterances && data.results.utterances.length > 0) {
    segments = data.results.utterances.map((utt, i) => ({
      id: i,
      text: utt.transcript,
      start: utt.start,
      end: utt.end,
      speaker: `Speaker ${utt.speaker + 1}`,
      words: utt.words.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
        speaker: w.speaker !== undefined ? `Speaker ${w.speaker + 1}` : undefined,
      })),
    }))
  } else {
    // Group words into segments by sentence breaks
    segments = groupWordsIntoSegments(words)
  }

  return {
    text: alternative.transcript,
    language: data.metadata.language || 'en',
    duration: data.metadata.duration || 0,
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
    // Split on sentence-ending punctuation
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

  // Remaining words
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
