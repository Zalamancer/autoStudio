/**
 * Auto-Gesture Engine — Speech-Driven Body Animation
 *
 * Analyzes ElevenLabs alignment data for prosody patterns (emphasis, pauses,
 * questions, exclamations) and generates keyframes on character body/head
 * part transforms to create natural-looking gestures synchronized with speech.
 *
 * Used by the orchestrator's `setup-gestures` step to automatically animate
 * characters during dialogue with zero user effort.
 */

import type { WordEvent } from '@/types/voice'
import type { CharPartTransform } from '@/stores/useMultiCharacterStore'

// ── Types ──

export type GestureType =
  | 'nod'           // Agreement/emphasis — head nods down briefly
  | 'head-tilt'     // Question — head tilts to side
  | 'lean-in'       // Strong emphasis — body leans forward
  | 'lean-back'     // Surprise/exclamation — body leans back
  | 'idle-sway'     // Gentle idle breathing/sway
  | 'shrug'         // Uncertainty — shoulders raise briefly
  | 'bounce'        // Excitement — quick vertical bounce

export interface GestureKeyframe {
  /** Frame number (global timeline position) */
  frame: number
  /** Target part to animate */
  part: 'body' | 'head'
  /** Transform delta applied on top of rest pose */
  transform: Partial<CharPartTransform>
  /** Easing function for interpolation */
  easing: 'ease-in-out' | 'ease-out' | 'linear'
}

export interface GestureSequence {
  type: GestureType
  startFrame: number
  endFrame: number
  keyframes: GestureKeyframe[]
}

interface EmphasisPoint {
  frame: number
  time: number
  type: 'emphasis' | 'question' | 'exclamation' | 'pause' | 'start' | 'end'
  strength: number // 0-1
  word: string
}

// ── Prosody Analysis ──

/**
 * Analyze word timeline for emphasis patterns.
 * Detects: long words, pauses, punctuation, sentence starts/ends.
 */
function detectEmphasisPoints(
  words: WordEvent[],
  globalFrameOffset: number,
  _fps: number,
): EmphasisPoint[] {
  if (words.length === 0) return []

  const points: EmphasisPoint[] = []
  const avgDuration = words.reduce((sum, w) => sum + (w.endTime - w.startTime), 0) / words.length

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const duration = word.endTime - word.startTime
    const frame = word.startFrame + globalFrameOffset

    // Detect sentence start (first word or after sentence-ending punctuation)
    if (i === 0 || (i > 0 && /[.!?]$/.test(words[i - 1].word))) {
      points.push({
        frame,
        time: word.startTime,
        type: 'start',
        strength: 0.3,
        word: word.word,
      })
    }

    // Detect question marks
    if (word.word.endsWith('?') || /\?$/.test(word.word)) {
      points.push({
        frame: word.endFrame + globalFrameOffset,
        time: word.endTime,
        type: 'question',
        strength: 0.7,
        word: word.word,
      })
    }

    // Detect exclamation marks
    if (word.word.endsWith('!') || /!$/.test(word.word)) {
      points.push({
        frame: word.endFrame + globalFrameOffset,
        time: word.endTime,
        type: 'exclamation',
        strength: 0.8,
        word: word.word,
      })
    }

    // Detect emphasis: word significantly longer than average
    if (duration > avgDuration * 1.5 && word.word.length > 3) {
      points.push({
        frame,
        time: word.startTime,
        type: 'emphasis',
        strength: Math.min(1, (duration / avgDuration - 1) * 0.5 + 0.3),
        word: word.word,
      })
    }

    // Detect pauses: gap between words > 300ms
    if (i < words.length - 1) {
      const nextWord = words[i + 1]
      const gap = nextWord.startTime - word.endTime
      if (gap > 0.3) {
        points.push({
          frame: word.endFrame + globalFrameOffset,
          time: word.endTime,
          type: 'pause',
          strength: Math.min(1, gap / 1.0),
          word: word.word,
        })
      }
    }

    // Detect sentence end
    if (/[.!?]$/.test(word.word)) {
      points.push({
        frame: word.endFrame + globalFrameOffset,
        time: word.endTime,
        type: 'end',
        strength: 0.4,
        word: word.word,
      })
    }
  }

  return points
}

// ── Gesture Preset Generators ──

function generateNod(frame: number, fps: number, strength: number): GestureKeyframe[] {
  const nodDepth = 3 * strength   // degrees rotation
  const nodYDelta = 2 * strength  // pixels down
  const duration = Math.round(fps * 0.3) // 300ms nod

  return [
    {
      frame,
      part: 'head',
      transform: { rotation: 0, y: 0 },
      easing: 'ease-in-out',
    },
    {
      frame: frame + Math.round(duration * 0.4),
      part: 'head',
      transform: { rotation: nodDepth, y: nodYDelta },
      easing: 'ease-out',
    },
    {
      frame: frame + duration,
      part: 'head',
      transform: { rotation: 0, y: 0 },
      easing: 'ease-in-out',
    },
  ]
}

function generateHeadTilt(frame: number, fps: number, strength: number): GestureKeyframe[] {
  const tiltAngle = 5 * strength // degrees
  const duration = Math.round(fps * 0.5) // 500ms tilt

  return [
    {
      frame,
      part: 'head',
      transform: { rotation: 0 },
      easing: 'ease-in-out',
    },
    {
      frame: frame + Math.round(duration * 0.3),
      part: 'head',
      transform: { rotation: -tiltAngle },
      easing: 'ease-out',
    },
    {
      frame: frame + duration,
      part: 'head',
      transform: { rotation: 0 },
      easing: 'ease-in-out',
    },
  ]
}

function generateLeanIn(frame: number, fps: number, strength: number): GestureKeyframe[] {
  const leanY = -4 * strength  // pixels up (leaning forward)
  const leanScale = 1 + 0.02 * strength
  const duration = Math.round(fps * 0.4)

  return [
    {
      frame,
      part: 'body',
      transform: { y: 0, scaleX: 1, scaleY: 1 },
      easing: 'ease-in-out',
    },
    {
      frame: frame + Math.round(duration * 0.5),
      part: 'body',
      transform: { y: leanY, scaleX: leanScale, scaleY: leanScale },
      easing: 'ease-out',
    },
    {
      frame: frame + duration,
      part: 'body',
      transform: { y: 0, scaleX: 1, scaleY: 1 },
      easing: 'ease-in-out',
    },
  ]
}

function generateLeanBack(frame: number, fps: number, strength: number): GestureKeyframe[] {
  const leanY = 3 * strength
  const squashX = 1 + 0.015 * strength
  const squashY = 1 - 0.01 * strength
  const duration = Math.round(fps * 0.35)

  return [
    {
      frame,
      part: 'body',
      transform: { y: 0, scaleX: 1, scaleY: 1 },
      easing: 'ease-in-out',
    },
    {
      frame: frame + Math.round(duration * 0.4),
      part: 'body',
      transform: { y: leanY, scaleX: squashX, scaleY: squashY },
      easing: 'ease-out',
    },
    {
      frame: frame + duration,
      part: 'body',
      transform: { y: 0, scaleX: 1, scaleY: 1 },
      easing: 'ease-in-out',
    },
  ]
}

function generateBounce(frame: number, fps: number, strength: number): GestureKeyframe[] {
  const bounceY = -5 * strength
  const duration = Math.round(fps * 0.25)

  return [
    {
      frame,
      part: 'body',
      transform: { y: 0 },
      easing: 'ease-in-out',
    },
    {
      frame: frame + Math.round(duration * 0.3),
      part: 'body',
      transform: { y: bounceY },
      easing: 'ease-out',
    },
    {
      frame: frame + duration,
      part: 'body',
      transform: { y: 0 },
      easing: 'ease-in-out',
    },
  ]
}

function generateIdleSway(startFrame: number, endFrame: number, fps: number): GestureKeyframe[] {
  const keyframes: GestureKeyframe[] = []
  const swayPeriod = Math.round(fps * 2.5) // 2.5 second sway cycle
  const swayAmount = 1.5 // degrees

  for (let f = startFrame; f < endFrame; f += swayPeriod) {
    keyframes.push({
      frame: f,
      part: 'body',
      transform: { rotation: 0 },
      easing: 'ease-in-out',
    })
    keyframes.push({
      frame: f + Math.round(swayPeriod * 0.25),
      part: 'body',
      transform: { rotation: swayAmount },
      easing: 'ease-in-out',
    })
    keyframes.push({
      frame: f + Math.round(swayPeriod * 0.5),
      part: 'body',
      transform: { rotation: 0 },
      easing: 'ease-in-out',
    })
    keyframes.push({
      frame: f + Math.round(swayPeriod * 0.75),
      part: 'body',
      transform: { rotation: -swayAmount },
      easing: 'ease-in-out',
    })
  }

  return keyframes
}

// ── Emphasis → Gesture Mapping ──

function mapEmphasisToGesture(point: EmphasisPoint, fps: number): GestureSequence | null {
  switch (point.type) {
    case 'emphasis':
      if (point.strength > 0.6) {
        const kf = generateLeanIn(point.frame, fps, point.strength)
        return {
          type: 'lean-in',
          startFrame: kf[0].frame,
          endFrame: kf[kf.length - 1].frame,
          keyframes: kf,
        }
      } else {
        const kf = generateNod(point.frame, fps, point.strength)
        return {
          type: 'nod',
          startFrame: kf[0].frame,
          endFrame: kf[kf.length - 1].frame,
          keyframes: kf,
        }
      }

    case 'question':
      {
        const kf = generateHeadTilt(point.frame, fps, point.strength)
        return {
          type: 'head-tilt',
          startFrame: kf[0].frame,
          endFrame: kf[kf.length - 1].frame,
          keyframes: kf,
        }
      }

    case 'exclamation':
      {
        const kf = generateBounce(point.frame, fps, point.strength)
        return {
          type: 'bounce',
          startFrame: kf[0].frame,
          endFrame: kf[kf.length - 1].frame,
          keyframes: kf,
        }
      }

    case 'pause':
      if (point.strength > 0.5) {
        const kf = generateLeanBack(point.frame, fps, point.strength)
        return {
          type: 'lean-back',
          startFrame: kf[0].frame,
          endFrame: kf[kf.length - 1].frame,
          keyframes: kf,
        }
      }
      return null

    case 'start':
      {
        const kf = generateNod(point.frame, fps, point.strength)
        return {
          type: 'nod',
          startFrame: kf[0].frame,
          endFrame: kf[kf.length - 1].frame,
          keyframes: kf,
        }
      }

    default:
      return null
  }
}

// ── Remove Overlapping Gestures ──

function removeOverlaps(sequences: GestureSequence[]): GestureSequence[] {
  if (sequences.length <= 1) return sequences

  // Sort by start frame
  sequences.sort((a, b) => a.startFrame - b.startFrame)

  const result: GestureSequence[] = [sequences[0]]

  for (let i = 1; i < sequences.length; i++) {
    const prev = result[result.length - 1]
    const curr = sequences[i]

    // Skip if overlapping with previous
    if (curr.startFrame < prev.endFrame + 5) {
      continue
    }

    result.push(curr)
  }

  return result
}

// ── Main API ──

export interface GestureGenerationInput {
  /** Word timeline for this dialogue line (local frame positions) */
  wordTimeline: WordEvent[]
  /** Global frame offset where this dialogue line starts */
  startFrame: number
  /** Global frame offset where this dialogue line ends */
  endFrame: number
  /** FPS of the project */
  fps: number
  /** Character name (for logging) */
  characterName?: string
}

export interface GestureResult {
  /** All gesture sequences generated */
  sequences: GestureSequence[]
  /** Flattened keyframes sorted by frame */
  keyframes: GestureKeyframe[]
}

/**
 * Generate gesture keyframes from dialogue word timeline.
 *
 * Analyzes prosody patterns and maps them to natural body/head movements:
 * - Emphasis words → nods or lean-in
 * - Questions → head tilt
 * - Exclamations → bounce
 * - Pauses → lean-back (thinking)
 * - Idle periods → gentle body sway
 */
export function generateGestures(input: GestureGenerationInput): GestureResult {
  const { wordTimeline, startFrame, endFrame, fps } = input

  // Detect emphasis points from word timing
  const emphasisPoints = detectEmphasisPoints(wordTimeline, startFrame, fps)

  // Map emphasis to gesture sequences
  const rawSequences: GestureSequence[] = []

  for (const point of emphasisPoints) {
    const seq = mapEmphasisToGesture(point, fps)
    if (seq) {
      rawSequences.push(seq)
    }
  }

  // Remove overlapping gestures
  const sequences = removeOverlaps(rawSequences)

  // Add idle sway for gaps between gestures (if gap > 1 second)
  const withIdle = [...sequences]
  const minIdleGap = fps // 1 second

  // Check gap before first gesture
  if (sequences.length === 0 || sequences[0].startFrame - startFrame > minIdleGap) {
    const idleEnd = sequences.length > 0 ? sequences[0].startFrame - 5 : endFrame
    const idleKf = generateIdleSway(startFrame, idleEnd, fps)
    if (idleKf.length > 0) {
      withIdle.unshift({
        type: 'idle-sway',
        startFrame,
        endFrame: idleEnd,
        keyframes: idleKf,
      })
    }
  }

  // Flatten all keyframes and sort by frame
  const allKeyframes = withIdle.flatMap(s => s.keyframes)
  allKeyframes.sort((a, b) => a.frame - b.frame)

  return {
    sequences: withIdle,
    keyframes: allKeyframes,
  }
}

/**
 * Generate gestures for multiple dialogue lines and merge results.
 */
export function generateGesturesForDialogue(
  dialogueLines: Array<{
    characterName: string
    wordTimeline: WordEvent[]
    startFrame: number
    endFrame: number
  }>,
  fps: number,
  intensity: number = 1,
): Map<string, GestureResult> {
  const resultsByCharacter = new Map<string, GestureResult>()

  for (const line of dialogueLines) {
    const result = generateGestures({
      wordTimeline: line.wordTimeline,
      startFrame: line.startFrame,
      endFrame: line.endFrame,
      fps,
      characterName: line.characterName,
    })

    // Scale transforms by intensity
    if (intensity !== 1) {
      for (const kf of result.keyframes) {
        if (kf.transform) {
          if (kf.transform.rotation != null) kf.transform.rotation *= intensity
          if (kf.transform.y != null) kf.transform.y *= intensity
          if (kf.transform.x != null) kf.transform.x *= intensity
          if (kf.transform.scaleX != null) kf.transform.scaleX = 1 + (kf.transform.scaleX - 1) * intensity
          if (kf.transform.scaleY != null) kf.transform.scaleY = 1 + (kf.transform.scaleY - 1) * intensity
        }
      }
    }

    const existing = resultsByCharacter.get(line.characterName)
    if (existing) {
      // Merge with existing gestures for this character
      existing.sequences.push(...result.sequences)
      existing.keyframes.push(...result.keyframes)
      existing.keyframes.sort((a, b) => a.frame - b.frame)
    } else {
      resultsByCharacter.set(line.characterName, result)
    }
  }

  return resultsByCharacter
}
