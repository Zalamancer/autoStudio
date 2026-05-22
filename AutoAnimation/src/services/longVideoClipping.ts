/**
 * Long-Video → Shorts Clipping service.
 *
 * Uploads a long video to the server for:
 * 1. Audio extraction (ffmpeg)
 * 2. Transcription (Whisper API)
 * 3. Clip moment identification (Gemini)
 *
 * Returns a list of clip moments that can be fed into BatchCreate.
 */

import { withCreditGate } from './creditGate'
import { getGeminiService } from './gemini'
import { logger } from '@/utils/logger'

export interface TranscriptSegment {
  startSeconds: number
  endSeconds: number
  text: string
}

export interface ClipMoment {
  startSeconds: number
  endSeconds: number
  title: string
  hook: string
  score: number
}

export interface LongVideoAnalysis {
  transcript: string
  timestampedTranscript: string
  segments: TranscriptSegment[]
  durationSeconds: number
  clipMoments: ClipMoment[]
}

/**
 * Analyze a long video and identify the best short-form clip moments.
 * @param videoFile - The video file to analyze (up to 30 min)
 * @param maxClips - Maximum number of clip moments to identify (default: 5)
 * @param onProgress - Progress callback
 */
export async function analyzeLongVideo(
  videoFile: File,
  maxClips: number = 5,
  onProgress?: (phase: string) => void,
): Promise<LongVideoAnalysis> {
  return withCreditGate('whisper-transcript', async () =>
    _analyzeLongVideoImpl(videoFile, maxClips, onProgress),
  )
}

async function _analyzeLongVideoImpl(
  videoFile: File,
  maxClips: number,
  onProgress?: (phase: string) => void,
): Promise<LongVideoAnalysis> {
  onProgress?.('Preparing video...')

  // Convert file to base64
  const arrayBuffer = await videoFile.arrayBuffer()
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
  )

  onProgress?.('Extracting audio and transcribing...')

  // Send to server for extraction + transcription
  const response = await fetch('/api/long-video/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoBase64: base64,
      mimeType: videoFile.type,
      maxClips,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Analysis failed (${response.status})`)
  }

  const data = await response.json() as {
    transcript: string
    timestampedTranscript: string
    segments: TranscriptSegment[]
    durationSeconds: number
  }

  logger.log(
    `[LongVideo] Transcribed ${data.durationSeconds.toFixed(0)}s video, ` +
    `${data.segments.length} segments, ${data.transcript.length} chars`,
  )

  onProgress?.('Identifying best clip moments...')

  // Use Gemini to identify clip moments from the transcript
  const gemini = getGeminiService()
  const clipPrompt = `You are an expert video editor. Analyze the following transcript and identify the ${maxClips} best moments for short-form clips (30-60 seconds each). Each clip should have a strong hook and be self-contained.

Transcript:
${data.timestampedTranscript || data.transcript}

Return a JSON array of clip moments. Each object must have:
- startSeconds (number): start time in seconds
- endSeconds (number): end time in seconds
- title (string): a catchy title for the clip
- hook (string): the opening hook line
- score (number 0-100): virality potential score

Return ONLY the JSON array, no other text.`

  const clipResponse = await gemini.generateContent(clipPrompt)
  let clipMoments: ClipMoment[]
  try {
    const cleaned = clipResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    clipMoments = JSON.parse(cleaned) as ClipMoment[]
  } catch {
    logger.warn('[LongVideo] Failed to parse clip moments from Gemini response, returning empty')
    clipMoments = []
  }

  logger.log(`[LongVideo] Identified ${clipMoments.length} clip moments`)

  return {
    transcript: data.transcript,
    timestampedTranscript: data.timestampedTranscript,
    segments: data.segments,
    durationSeconds: data.durationSeconds,
    clipMoments,
  }
}

/**
 * Convert clip moments into prompts suitable for BatchCreate.
 * Each moment becomes a prompt with the transcript excerpt as context.
 */
export function clipMomentsToPrompts(
  analysis: LongVideoAnalysis,
): { prompt: string; title: string }[] {
  return analysis.clipMoments.map((moment) => {
    // Extract the relevant transcript segment
    const relevantSegments = analysis.segments.filter(
      (s) => s.startSeconds >= moment.startSeconds && s.endSeconds <= moment.endSeconds,
    )
    const excerpt = relevantSegments.map((s) => s.text).join(' ').trim()

    return {
      title: moment.title,
      prompt: `Create a short-form clip based on this excerpt:\n\nHook: "${moment.hook}"\n\nContent: "${excerpt || moment.title}"`,
    }
  })
}
