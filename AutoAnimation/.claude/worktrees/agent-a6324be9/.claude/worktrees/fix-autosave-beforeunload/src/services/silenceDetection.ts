/**
 * Silence Detection Service — Web Audio API-based silence and filler word detection.
 *
 * Analyzes audio buffers to find:
 * 1. Silence regions (RMS energy below threshold)
 * 2. Filler words (matched against word alignment timestamps)
 */

export interface SilenceRegion {
  id: string
  type: 'silence' | 'filler'
  startTime: number // seconds
  endTime: number // seconds
  word?: string // for filler words
  enabled: boolean // whether to include in auto-cut
}

export interface DetectionSettings {
  silenceThresholdDb: number // dB below peak, e.g. -40
  minSilenceDuration: number // seconds, e.g. 0.5
  fillerWords: string[]
}

export const DEFAULT_SETTINGS: DetectionSettings = {
  silenceThresholdDb: -40,
  minSilenceDuration: 0.4,
  fillerWords: ['um', 'uh', 'uhm', 'hmm', 'like', 'you know', 'basically', 'actually', 'so', 'right', 'i mean'],
}

// ─── Silence Detection (Web Audio API) ───────────────────────────────────────

/**
 * Detect silence regions in an AudioBuffer.
 * Uses RMS energy per 50ms window to identify quiet regions.
 */
export function detectSilences(
  audioBuffer: AudioBuffer,
  settings: DetectionSettings = DEFAULT_SETTINGS,
): SilenceRegion[] {
  const sampleRate = audioBuffer.sampleRate
  const channelData = audioBuffer.getChannelData(0) // mono or left channel
  const windowSize = Math.floor(sampleRate * 0.05) // 50ms windows

  // Convert threshold from dB to linear amplitude
  const thresholdLinear = Math.pow(10, settings.silenceThresholdDb / 20)

  const regions: SilenceRegion[] = []
  let silenceStart: number | null = null

  for (let i = 0; i < channelData.length; i += windowSize) {
    const end = Math.min(i + windowSize, channelData.length)

    // Compute RMS energy for this window
    let sumSquares = 0
    for (let j = i; j < end; j++) {
      sumSquares += channelData[j] * channelData[j]
    }
    const rms = Math.sqrt(sumSquares / (end - i))

    const currentTime = i / sampleRate
    const isSilent = rms < thresholdLinear

    if (isSilent && silenceStart === null) {
      silenceStart = currentTime
    } else if (!isSilent && silenceStart !== null) {
      const duration = currentTime - silenceStart
      if (duration >= settings.minSilenceDuration) {
        regions.push({
          id: `silence-${regions.length}`,
          type: 'silence',
          startTime: silenceStart,
          endTime: currentTime,
          enabled: true,
        })
      }
      silenceStart = null
    }
  }

  // Handle trailing silence
  if (silenceStart !== null) {
    const endTime = channelData.length / sampleRate
    const duration = endTime - silenceStart
    if (duration >= settings.minSilenceDuration) {
      regions.push({
        id: `silence-${regions.length}`,
        type: 'silence',
        startTime: silenceStart,
        endTime,
        enabled: true,
      })
    }
  }

  return regions
}

// ─── Filler Word Detection ───────────────────────────────────────────────────

export interface WordTimestamp {
  word: string
  start: number // seconds
  end: number // seconds
}

/**
 * Detect filler words from ElevenLabs word alignment data.
 */
export function detectFillerWords(
  words: WordTimestamp[],
  fillerList: string[] = DEFAULT_SETTINGS.fillerWords,
): SilenceRegion[] {
  const fillerSet = new Set(fillerList.map((w) => w.toLowerCase()))
  const regions: SilenceRegion[] = []

  for (const word of words) {
    const normalized = word.word.toLowerCase().replace(/[.,!?;:]/g, '').trim()

    // Single-word fillers
    if (fillerSet.has(normalized)) {
      regions.push({
        id: `filler-${regions.length}`,
        type: 'filler',
        startTime: word.start,
        endTime: word.end,
        word: word.word,
        enabled: true,
      })
      continue
    }

    // Multi-word fillers (check current + next word)
    const idx = words.indexOf(word)
    if (idx < words.length - 1) {
      const nextWord = words[idx + 1]
      const combined = `${normalized} ${nextWord.word.toLowerCase().replace(/[.,!?;:]/g, '').trim()}`
      if (fillerSet.has(combined)) {
        regions.push({
          id: `filler-${regions.length}`,
          type: 'filler',
          startTime: word.start,
          endTime: nextWord.end,
          word: `${word.word} ${nextWord.word}`,
          enabled: true,
        })
      }
    }
  }

  return regions
}

// ─── Combined Detection ──────────────────────────────────────────────────────

/**
 * Run both silence and filler detection, merge and sort results.
 */
export function detectAll(
  audioBuffer: AudioBuffer | null,
  words: WordTimestamp[],
  settings: DetectionSettings = DEFAULT_SETTINGS,
): SilenceRegion[] {
  const silences = audioBuffer ? detectSilences(audioBuffer, settings) : []
  const fillers = detectFillerWords(words, settings.fillerWords)

  // Merge and sort by start time
  const all = [...silences, ...fillers].sort((a, b) => a.startTime - b.startTime)

  // Re-index IDs
  return all.map((r, i) => ({ ...r, id: `region-${i}` }))
}

/**
 * Decode an audio blob into an AudioBuffer for analysis.
 */
export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const ctx = new AudioContext()
  try {
    const arrayBuffer = await blob.arrayBuffer()
    return await ctx.decodeAudioData(arrayBuffer)
  } finally {
    await ctx.close()
  }
}
