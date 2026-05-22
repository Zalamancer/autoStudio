/**
 * Auto Camera Director — Dialogue-Driven Camera Keyframe Generation
 *
 * Analyzes dialogue timing, emotion changes, emphasis points, and beat
 * timestamps to automatically generate cinematic camera keyframes.
 * Used as a post-execution step when Gemini doesn't include explicit
 * camera directives in the ClipPlan.
 */

import type { CameraKeyframe } from '@/stores/useCameraStore'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { WordEvent } from '@/types/voice'

// ── Types ──

interface DialogueLineInfo {
  characterName: string
  startFrame: number
  endFrame: number
  wordTimeline: WordEvent[]
  /** Character position as percentage of canvas (0-100) */
  characterPositionX?: number
}

interface AutoCameraOptions {
  fps: number
  totalFrames: number
  /** Minimum gap (in frames) between camera moves to avoid jitter */
  minGapFrames?: number
}

interface CameraMoveCandidate {
  frame: number
  zoom: number
  panX: number
  panY: number
  rotation: number
  easing: CameraKeyframe['easing']
  priority: number // higher = more important
  type: string
}

// ── Constants ──

const DEFAULT_MIN_GAP_SECONDS = 1.0
const EMOTION_ZOOM_AMOUNT = 0.15
const EMPHASIS_ZOOM_PULSE = 0.05
const PAUSE_ZOOM_OUT = 0.08
const QUESTION_PAN_AMOUNT = 3

// ── Main API ──

/**
 * Generate cinematic camera keyframes from dialogue analysis.
 *
 * Rules:
 * - Emotion change -> zoom toward speaking character (0.15 zoom over 0.5s)
 * - Emphasis word -> subtle 5% zoom pulse (in 0.2s, out 0.3s)
 * - Question mark -> slight pan toward character
 * - Pause > 1s -> slow zoom out (breathing room)
 * - New speaker -> smooth pan to new character position
 * - Beat drop -> quick zoom burst
 * - Collision avoidance: minimum 1s between camera moves
 */
export function generateAutoCameraKeyframes(
  dialogueLines: DialogueLineInfo[],
  emotionEvents: EmotionEvent[],
  beatTimestamps: number[] | undefined,
  options: AutoCameraOptions,
): CameraKeyframe[] {
  const { fps, totalFrames } = options
  const minGap = options.minGapFrames ?? Math.round(DEFAULT_MIN_GAP_SECONDS * fps)

  const candidates: CameraMoveCandidate[] = []

  // Start with neutral position at the first dialogue frame (not always 0)
  const firstDialogueFrame = dialogueLines.length > 0 ? dialogueLines[0].startFrame : 0
  candidates.push({
    frame: firstDialogueFrame,
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    easing: 'ease-in-out',
    priority: 10,
    type: 'start',
  })

  // 1. Emotion changes -> zoom in
  addEmotionZooms(candidates, emotionEvents, dialogueLines, fps)

  // 2. Emphasis words -> zoom pulse
  addEmphasisPulses(candidates, dialogueLines, fps)

  // 3. Question marks -> pan toward character
  addQuestionPans(candidates, dialogueLines, fps)

  // 4. Pauses -> zoom out for breathing room
  addPauseZoomOuts(candidates, dialogueLines, fps)

  // 5. Speaker changes -> pan to new character
  addSpeakerPans(candidates, dialogueLines, fps)

  // 6. Beat drops -> zoom burst
  if (beatTimestamps && beatTimestamps.length > 0) {
    addBeatBursts(candidates, beatTimestamps, fps)
  }

  // End with neutral
  candidates.push({
    frame: totalFrames - 1,
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    easing: 'ease-out',
    priority: 10,
    type: 'end',
  })

  // Resolve collisions: keep higher-priority moves, remove conflicts
  const resolved = resolveCollisions(candidates, minGap)

  // Convert candidates to CameraKeyframe format
  return resolved.map(({ frame, zoom, panX, panY, rotation, easing }) => ({
    frame,
    zoom,
    panX,
    panY,
    rotation,
    easing,
  }))
}

// ── Camera Move Generators ──

function addEmotionZooms(
  candidates: CameraMoveCandidate[],
  emotionEvents: EmotionEvent[],
  dialogueLines: DialogueLineInfo[],
  fps: number,
): void {
  for (let i = 1; i < emotionEvents.length; i++) {
    const event = emotionEvents[i]
    const prevEmotion = emotionEvents[i - 1].emotion
    if (event.emotion === prevEmotion) continue

    // Find which character is speaking at this frame
    const speakerLine = dialogueLines.find(
      (l) => event.startFrame >= l.startFrame && event.startFrame <= l.endFrame,
    )
    const panX = speakerLine?.characterPositionX != null
      ? (speakerLine.characterPositionX / 100) * 100 - 50
      : 0

    const zoomInFrame = event.startFrame
    const zoomDuration = Math.round(fps * 0.5)

    // Zoom in
    candidates.push({
      frame: zoomInFrame,
      zoom: 1 + EMOTION_ZOOM_AMOUNT,
      panX: panX * 0.3,
      panY: 0,
      rotation: 0,
      easing: 'ease-in-out',
      priority: 7,
      type: 'emotion-zoom-in',
    })

    // Zoom back out
    candidates.push({
      frame: zoomInFrame + zoomDuration,
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      easing: 'ease-out',
      priority: 3,
      type: 'emotion-zoom-out',
    })
  }
}

function addEmphasisPulses(
  candidates: CameraMoveCandidate[],
  dialogueLines: DialogueLineInfo[],
  fps: number,
): void {
  for (const line of dialogueLines) {
    if (!line.wordTimeline || line.wordTimeline.length === 0) continue

    const avgDuration = line.wordTimeline.reduce(
      (sum, w) => sum + (w.endTime - w.startTime), 0,
    ) / line.wordTimeline.length

    for (const word of line.wordTimeline) {
      const duration = word.endTime - word.startTime
      // Only pick significantly emphasized words
      if (duration > avgDuration * 1.8 && word.word.length > 3) {
        const frame = word.startFrame + line.startFrame
        const pulseIn = Math.round(fps * 0.2)
        const pulseOut = Math.round(fps * 0.3)

        candidates.push({
          frame,
          zoom: 1 + EMPHASIS_ZOOM_PULSE,
          panX: 0,
          panY: 0,
          rotation: 0,
          easing: 'ease-out',
          priority: 4,
          type: 'emphasis-pulse-in',
        })

        candidates.push({
          frame: frame + pulseIn + pulseOut,
          zoom: 1,
          panX: 0,
          panY: 0,
          rotation: 0,
          easing: 'ease-in-out',
          priority: 2,
          type: 'emphasis-pulse-out',
        })
      }
    }
  }
}

function addQuestionPans(
  candidates: CameraMoveCandidate[],
  dialogueLines: DialogueLineInfo[],
  fps: number,
): void {
  for (const line of dialogueLines) {
    if (!line.wordTimeline) continue

    for (const word of line.wordTimeline) {
      if (word.word.endsWith('?')) {
        const panX = line.characterPositionX != null
          ? ((line.characterPositionX / 100) * 100 - 50) * 0.15
          : QUESTION_PAN_AMOUNT

        const frame = word.endFrame + line.startFrame
        candidates.push({
          frame: frame - Math.round(fps * 0.3),
          zoom: 1.05,
          panX,
          panY: -1,
          rotation: 0,
          easing: 'ease-in-out',
          priority: 5,
          type: 'question-pan',
        })

        candidates.push({
          frame: frame + Math.round(fps * 0.5),
          zoom: 1,
          panX: 0,
          panY: 0,
          rotation: 0,
          easing: 'ease-out',
          priority: 2,
          type: 'question-return',
        })
      }
    }
  }
}

function addPauseZoomOuts(
  candidates: CameraMoveCandidate[],
  dialogueLines: DialogueLineInfo[],
  fps: number,
): void {
  for (const line of dialogueLines) {
    if (!line.wordTimeline || line.wordTimeline.length < 2) continue

    for (let i = 0; i < line.wordTimeline.length - 1; i++) {
      const word = line.wordTimeline[i]
      const next = line.wordTimeline[i + 1]
      const gap = next.startTime - word.endTime

      if (gap > 1.0) {
        const frame = word.endFrame + line.startFrame
        const zoomOutDuration = Math.round(Math.min(gap, 2) * fps)

        candidates.push({
          frame,
          zoom: 1,
          panX: 0,
          panY: 0,
          rotation: 0,
          easing: 'ease-in-out',
          priority: 3,
          type: 'pause-start',
        })

        candidates.push({
          frame: frame + zoomOutDuration,
          zoom: 1 - PAUSE_ZOOM_OUT,
          panX: 0,
          panY: 0,
          rotation: 0,
          easing: 'ease-out',
          priority: 3,
          type: 'pause-zoom-out',
        })
      }
    }
  }
}

function addSpeakerPans(
  candidates: CameraMoveCandidate[],
  dialogueLines: DialogueLineInfo[],
  fps: number,
): void {
  let prevSpeaker: string | null = null

  for (const line of dialogueLines) {
    if (prevSpeaker && line.characterName !== prevSpeaker) {
      const panX = line.characterPositionX != null
        ? ((line.characterPositionX / 100) * 100 - 50) * 0.2
        : 0

      // Pan to new speaker slightly before they start
      const panFrame = Math.max(0, line.startFrame - Math.round(fps * 0.2))
      candidates.push({
        frame: panFrame,
        zoom: 1.05,
        panX,
        panY: 0,
        rotation: 0,
        easing: 'ease-in-out',
        priority: 6,
        type: 'speaker-pan',
      })
    }
    prevSpeaker = line.characterName
  }
}

function addBeatBursts(
  candidates: CameraMoveCandidate[],
  beatTimestamps: number[],
  fps: number,
): void {
  // Only use strong beats (every 4th beat) to avoid over-animation
  for (let i = 0; i < beatTimestamps.length; i += 4) {
    const frame = Math.round(beatTimestamps[i] * fps)
    const returnFrame = frame + Math.round(fps * 0.25)

    candidates.push({
      frame,
      zoom: 1.08,
      panX: 0,
      panY: 0,
      rotation: 0,
      easing: 'ease-out',
      priority: 4,
      type: 'beat-burst',
    })

    candidates.push({
      frame: returnFrame,
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      easing: 'ease-in-out',
      priority: 2,
      type: 'beat-return',
    })
  }
}

// ── Collision Resolution ──

function resolveCollisions(
  candidates: CameraMoveCandidate[],
  minGap: number,
): CameraMoveCandidate[] {
  // Sort by priority (desc), then frame (asc)
  const sorted = [...candidates].sort(
    (a, b) => b.priority - a.priority || a.frame - b.frame,
  )

  const accepted: CameraMoveCandidate[] = []

  for (const candidate of sorted) {
    const tooClose = accepted.some(
      (a) => Math.abs(a.frame - candidate.frame) < minGap && a.priority >= candidate.priority,
    )
    if (!tooClose) {
      accepted.push(candidate)
    }
  }

  // Sort accepted by frame
  accepted.sort((a, b) => a.frame - b.frame)
  return accepted
}
