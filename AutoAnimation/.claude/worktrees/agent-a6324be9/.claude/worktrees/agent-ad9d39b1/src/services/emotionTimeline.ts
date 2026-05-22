import type { WordEvent } from '@/types/voice'

/**
 * Represents an emotion event spanning a range of frames.
 * The emotion applies from startFrame until endFrame.
 */
export interface EmotionEvent {
  emotion: string
  startFrame: number
  endFrame: number
}

/**
 * Regex to match expression cues like [happy], [surprised], [sad], [angry], etc.
 * Captures the cue name inside the brackets.
 */
const EXPRESSION_CUE_REGEX = /\[([\w-]+)\]/g

/**
 * Capitalize the first letter of an emotion string for consistency
 * with the emotionToMouthCurvature mapping (e.g., 'happy' -> 'Happy').
 */
function capitalizeEmotion(emotion: string): string {
  if (emotion.length === 0) return emotion
  return emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase()
}

/**
 * Parse expression cues from a raw script and build an emotion timeline
 * based on word positions in the word timeline.
 *
 * The raw script may contain inline expression cues like [happy], [sad], [angry].
 * These cues are not spoken (they are stripped before TTS), so they don't appear
 * in the word timeline. We determine their frame positions by figuring out which
 * word follows each cue in the raw script, then looking up that word's start frame.
 *
 * Each emotion applies from its cue position until the next cue or the end of the timeline.
 *
 * @param rawScript - The original script with expression cues (e.g., "[happy] Hey everyone!")
 * @param wordTimeline - The word timeline with frame timing for each spoken word
 * @returns Array of EmotionEvent objects sorted by startFrame
 */
export function buildEmotionTimeline(
  rawScript: string,
  wordTimeline: WordEvent[]
): EmotionEvent[] {
  if (!rawScript || wordTimeline.length === 0) {
    return []
  }

  // Find all expression cues and their positions in the raw script
  const cues: Array<{ emotion: string; position: number }> = []
  let match: RegExpExecArray | null

  // Reset regex state
  EXPRESSION_CUE_REGEX.lastIndex = 0
  while ((match = EXPRESSION_CUE_REGEX.exec(rawScript)) !== null) {
    cues.push({
      emotion: capitalizeEmotion(match[1]),
      position: match.index,
    })
  }

  if (cues.length === 0) {
    return []
  }

  // Build the clean script (without cues) to map word indices.
  // We need to know which word index in the clean script follows each cue.
  // Strategy: Walk through the raw script, track which clean-word-index each cue maps to.

  const cueWordIndices: Array<{ emotion: string; wordIndex: number }> = []

  // Split the raw script by expression cues and whitespace to count words
  // We process the raw script character by character to track word positions accurately
  let cleanWordIndex = 0
  let inWord = false

  // Sort cues by position (should already be sorted from regex, but ensure it)
  cues.sort((a, b) => a.position - b.position)

  // Walk through the raw script tracking word positions
  let pos = 0

  // For each cue, count how many clean words appear before it in the raw script
  for (let ci = 0; ci < cues.length; ci++) {
    const cue = cues[ci]
    const cueStart = cue.position
    const cueEnd = cueStart + `[${cue.emotion.toLowerCase()}]`.length

    // Count words from current position up to this cue
    while (pos < cueStart) {
      const char = rawScript[pos]
      const isWhitespace = /\s/.test(char)

      if (!isWhitespace && !inWord) {
        // Starting a new word
        inWord = true
      } else if (isWhitespace && inWord) {
        // Ending a word
        cleanWordIndex++
        inWord = false
      }
      pos++
    }

    // If we were in the middle of a word when we hit the cue, finish it
    if (inWord) {
      cleanWordIndex++
      inWord = false
    }

    // The cue maps to the next clean word index
    cueWordIndices.push({
      emotion: cue.emotion,
      wordIndex: cleanWordIndex,
    })

    // Skip past the cue text
    pos = cueEnd
  }

  // Now map word indices to frame positions using the word timeline
  const lastFrame = wordTimeline.length > 0
    ? Math.max(...wordTimeline.map((w) => w.endFrame))
    : 0

  const events: EmotionEvent[] = []

  for (let i = 0; i < cueWordIndices.length; i++) {
    const { emotion, wordIndex } = cueWordIndices[i]

    // Determine startFrame: use the word at wordIndex if it exists, otherwise use
    // the end of the previous word, or frame 0
    let startFrame: number
    if (wordIndex < wordTimeline.length) {
      startFrame = wordTimeline[wordIndex].startFrame
    } else if (wordTimeline.length > 0) {
      // Cue is after all words - use the last word's end frame
      startFrame = wordTimeline[wordTimeline.length - 1].endFrame
    } else {
      startFrame = 0
    }

    // Determine endFrame: use the next cue's startFrame, or the end of timeline
    let endFrame: number
    if (i + 1 < cueWordIndices.length) {
      const nextWordIndex = cueWordIndices[i + 1].wordIndex
      if (nextWordIndex < wordTimeline.length) {
        endFrame = wordTimeline[nextWordIndex].startFrame
      } else {
        endFrame = lastFrame
      }
    } else {
      endFrame = lastFrame
    }

    // Only add events with valid frame ranges
    if (endFrame > startFrame) {
      events.push({ emotion, startFrame, endFrame })
    }
  }

  return events
}

/**
 * Get the emotion at a specific frame from an emotion timeline.
 * Returns 'Neutral' if no emotion event covers the given frame.
 *
 * @param emotionTimeline - Array of EmotionEvent objects
 * @param frame - The frame number to query
 * @returns The emotion string at the given frame
 */
export function getEmotionAtFrame(
  emotionTimeline: EmotionEvent[],
  frame: number
): string {
  const event = emotionTimeline.find(
    (e) => frame >= e.startFrame && frame < e.endFrame
  )
  return event?.emotion || 'Neutral'
}
