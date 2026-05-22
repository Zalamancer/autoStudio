/**
 * Speech-to-Viseme Service
 *
 * Complete pipeline for generating lip sync data from arbitrary audio files:
 *   audioFile -> transcription -> word timestamps -> G2P -> phoneme interpolation -> viseme timeline
 *
 * Supports two transcription backends:
 *   1. Whisper API (server-side, preferred) — returns word-level timestamps
 *   2. Manual transcript (user-provided text) — uses audio duration for even distribution
 */

import { wordToPhonemes } from './g2p'
import { interpolatePhonemeTimings, type WordTiming } from './phonemeInterpolation'
import { LipSyncProcessor } from './lipSync'
import type { VisemeEvent, WordEvent, ElevenLabsAlignment } from '@/types/voice'

export interface SpeechToVisemeResult {
  visemeTimeline: VisemeEvent[]
  wordTimeline: WordEvent[]
  transcript: string
  audioDuration: number
  audioUrl: string
}

/**
 * Get the duration of an audio file by loading it into an Audio element.
 */
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration
      URL.revokeObjectURL(url)
      resolve(duration)
    })
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load audio file'))
    })
  })
}

/**
 * Attempt to transcribe audio using the Whisper API backend.
 * Falls back gracefully if the server endpoint is not available.
 */
async function transcribeWithWhisper(file: File): Promise<{ text: string; words: WordTiming[] } | null> {
  try {
    // Dynamic import to avoid hard dependency on whisper service
    const { transcribeAudio } = await import('./whisperTranscript')
    const result = await transcribeAudio(file)

    return {
      text: result.text,
      words: result.words.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
      })),
    }
  } catch (err) {
    console.warn('[SpeechToViseme] Whisper transcription failed, will need manual transcript:', err)
    return null
  }
}

/**
 * Generate approximate word timings from a transcript and audio duration.
 * Distributes words evenly across the audio duration with slight pauses between.
 *
 * This is a fallback when no word-level timestamps are available.
 */
function distributeWordsEvenly(transcript: string, audioDuration: number): WordTiming[] {
  const words = transcript
    .replace(/\[[\w-]+\]/g, '') // strip emotion cues
    .replace(/[.,!?;:"'()[\]{}]/g, '') // strip punctuation
    .split(/\s+/)
    .filter((w) => w.length > 0)

  if (words.length === 0) return []

  // Estimate word durations based on character count (longer words take longer)
  const charCounts = words.map((w) => w.length)
  const totalChars = charCounts.reduce((sum, c) => sum + c, 0)

  // Reserve ~10% of total time for inter-word pauses
  const pauseFraction = 0.1
  const speechDuration = audioDuration * (1 - pauseFraction)
  const pausePerGap = words.length > 1 ? (audioDuration * pauseFraction) / (words.length - 1) : 0

  const timings: WordTiming[] = []
  let currentTime = 0

  for (let i = 0; i < words.length; i++) {
    const wordDuration = totalChars > 0 ? (charCounts[i] / totalChars) * speechDuration : speechDuration / words.length

    timings.push({
      word: words[i],
      start: currentTime,
      end: currentTime + wordDuration,
    })

    currentTime += wordDuration + pausePerGap
  }

  return timings
}

/**
 * Convert word timings + G2P phonemes into an ElevenLabsAlignment-compatible structure.
 * This allows reuse of the existing LipSyncProcessor.processAlignment() method.
 */
function buildAlignmentFromPhonemes(
  interpolated: ReturnType<typeof interpolatePhonemeTimings>,
  transcript: string,
): ElevenLabsAlignment {
  // Build character-level timing from word boundaries (approximate)
  const characters = transcript.split('')
  const charCount = characters.length
  const totalDuration = interpolated.ends.length > 0 ? interpolated.ends[interpolated.ends.length - 1] : 0

  const charStartTimes = characters.map((_, i) => (i / charCount) * totalDuration)
  const charEndTimes = characters.map((_, i) => ((i + 1) / charCount) * totalDuration)

  return {
    characters,
    character_start_times_seconds: charStartTimes,
    character_end_times_seconds: charEndTimes,
    phonemes: interpolated.phonemes,
    phoneme_start_times_seconds: interpolated.starts,
    phoneme_end_times_seconds: interpolated.ends,
  }
}

export interface ProcessAudioOptions {
  /** Pre-provided transcript to skip transcription step */
  manualTranscript?: string
  /** Progress callback: 0..1 */
  onProgress?: (progress: number) => void
}

/**
 * Main pipeline: process an audio file to produce lip sync data.
 *
 * Steps:
 * 1. Load audio and get duration
 * 2. Transcribe (Whisper API or manual transcript)
 * 3. Convert words to phonemes via G2P
 * 4. Interpolate phoneme timings within word boundaries
 * 5. Run through LipSyncProcessor for viseme timeline
 * 6. Generate word timeline for captions
 *
 * @param audioFile - Audio file (any format the browser can decode)
 * @param fps - Frames per second for frame-based timing
 * @param options - Optional: manual transcript, progress callback
 * @returns Viseme timeline, word timeline, transcript text, audio URL
 */
export async function processAudioForLipSync(
  audioFile: File,
  fps: number,
  options: ProcessAudioOptions = {},
): Promise<SpeechToVisemeResult> {
  const { manualTranscript, onProgress } = options

  // Step 1: Get audio duration
  onProgress?.(0.05)
  const audioDuration = await getAudioDuration(audioFile)
  const audioUrl = URL.createObjectURL(audioFile)

  onProgress?.(0.1)

  // Step 2: Get word-level timings
  let wordTimings: WordTiming[]
  let transcript: string

  if (manualTranscript && manualTranscript.trim().length > 0) {
    // Use manual transcript with evenly distributed timings
    transcript = manualTranscript.trim()
    wordTimings = distributeWordsEvenly(transcript, audioDuration)
    onProgress?.(0.3)
  } else {
    // Try Whisper transcription
    const whisperResult = await transcribeWithWhisper(audioFile)
    onProgress?.(0.5)

    if (whisperResult && whisperResult.words.length > 0) {
      transcript = whisperResult.text
      wordTimings = whisperResult.words
    } else {
      throw new Error(
        'Transcription failed and no manual transcript was provided. ' +
          'Please provide a transcript in the text area and try again.',
      )
    }
  }

  if (wordTimings.length === 0) {
    throw new Error('No words found in transcript')
  }

  // Step 3 & 4: G2P + phoneme interpolation
  onProgress?.(0.6)
  const interpolated = interpolatePhonemeTimings(wordTimings, wordToPhonemes)

  // Step 5: Build alignment and generate viseme timeline
  onProgress?.(0.7)
  const alignment = buildAlignmentFromPhonemes(interpolated, transcript)
  const lipSyncProcessor = new LipSyncProcessor(fps)
  const visemeTimeline = lipSyncProcessor.processAlignment(alignment)

  // Step 6: Build word timeline (for captions)
  onProgress?.(0.85)
  const wordTimeline: WordEvent[] = wordTimings.map((w) => ({
    word: w.word.replace(/[.,!?;:"'()[\]{}]/g, ''),
    startTime: w.start,
    endTime: w.end,
    startFrame: Math.floor(w.start * fps),
    endFrame: Math.ceil(w.end * fps),
  }))

  onProgress?.(1.0)

  return {
    visemeTimeline,
    wordTimeline,
    transcript,
    audioDuration,
    audioUrl,
  }
}
