/**
 * Auto-animation helper for the orchestrator.
 *
 * Given an element type, ID, and frame range, automatically applies:
 * 1. An entrance animation preset (first ~0.5s)
 * 2. An exit animation preset (last ~0.5s)
 * 3. An attention animation if the element persists for > 2 seconds
 * 4. Beat-synced emphasis if beat data is available
 *
 * This is the bridge between the animation engine and the orchestrator.
 */

import type { CanvasObjectRef, KeyframableObjectType, EasingType } from '@/types/keyframes'
import { getPresetById, type AnimationPreset } from './presets'
import { type AttentionConfig } from './attention'

// ── Types ─────────────────────────────────────────────────────────────

export type ElementRole =
  | 'title'
  | 'subtitle'
  | 'lower-third'
  | 'cta'
  | 'quote'
  | 'watermark'
  | 'background-media'
  | 'cutaway-media'
  | 'overlay-media'
  | 'accent-media'
  | 'shape-decorative'
  | 'shape-accent'
  | 'svg-object'
  | 'character'
  | 'generic'

export interface AutoAnimateOptions {
  /** Element role for preset selection */
  role: ElementRole
  /** FPS */
  fps: number
  /** Beat timestamps in seconds (optional) */
  beats?: number[]
  /** Override entrance preset ID */
  entrancePreset?: string
  /** Override exit preset ID */
  exitPreset?: string
  /** Disable entrance animation */
  noEntrance?: boolean
  /** Disable exit animation */
  noExit?: boolean
  /** Disable attention animation */
  noAttention?: boolean
  /** Disable beat sync */
  noBeatSync?: boolean
}

export interface AutoAnimateResult {
  /** Keyframes to add to the keyframe store */
  keyframes: Array<{
    objectRef: CanvasObjectRef
    property: string
    frame: number
    value: number
    easing: EasingType
    tag?: string
  }>
  /** Attention animation config (applied separately via the attention system) */
  attentionConfig?: AttentionConfig & { startFrame: number; endFrame: number }
}

// ── Preset Mapping ────────────────────────────────────────────────────

/** Map element roles to entrance presets (primary and fallback) */
const ENTRANCE_MAP: Record<ElementRole, string[]> = {
  'title':            ['elastic-in', 'pop-in', 'fade-in-up'],
  'subtitle':         ['fade-in-up', 'rise-in', 'fade-in'],
  'lower-third':      ['fade-in-left', 'wipe-in-left', 'fade-in'],
  'cta':              ['pop-in', 'bounce-in', 'elastic-in'],
  'quote':            ['fade-in', 'rise-in', 'fade-in-up'],
  'watermark':        ['fade-in', 'fade-in'],
  'background-media': ['zoom-in', 'fade-in', 'fade-in'],
  'cutaway-media':    ['wipe-in-left', 'fade-in', 'zoom-in'],
  'overlay-media':    ['fade-in-up', 'pop-in', 'fade-in'],
  'accent-media':     ['pop-in', 'zoom-in', 'fade-in'],
  'shape-decorative': ['grow-from-center', 'fade-in', 'pop-in'],
  'shape-accent':     ['pop-in', 'elastic-in', 'bounce-in'],
  'svg-object':       ['bounce-in', 'elastic-in', 'pop-in'],
  'character':        ['slide-in-up', 'fade-in-up', 'pop-in'],
  'generic':          ['fade-in', 'fade-in-up', 'pop-in'],
}

/** Map element roles to exit presets */
const EXIT_MAP: Record<ElementRole, string[]> = {
  'title':            ['fade-out-up', 'pop-out', 'fade-out'],
  'subtitle':         ['fade-out-up', 'fade-out', 'dissolve'],
  'lower-third':      ['fade-out', 'slide-out-left', 'fade-out'],
  'cta':              ['pop-out', 'poof', 'fade-out'],
  'quote':            ['fade-out', 'dissolve', 'fade-out-up'],
  'watermark':        ['fade-out', 'fade-out'],
  'background-media': ['fade-out', 'zoom-out', 'dissolve'],
  'cutaway-media':    ['fade-out', 'dissolve', 'fade-out'],
  'overlay-media':    ['fade-out-up', 'pop-out', 'fade-out'],
  'accent-media':     ['pop-out', 'shrink-out', 'fade-out'],
  'shape-decorative': ['shrink-out', 'fade-out', 'dissolve'],
  'shape-accent':     ['pop-out', 'poof', 'fade-out'],
  'svg-object':       ['pop-out', 'fade-out-up', 'fade-out'],
  'character':        ['fade-out-down', 'slide-out-right', 'fade-out'],
  'generic':          ['fade-out', 'fade-out-up', 'dissolve'],
}

/** Map element roles to attention animations for persistent elements */
const ATTENTION_MAP: Record<ElementRole, AttentionConfig | null> = {
  'title':            { type: 'breathe', intensity: 0.3, speed: 0.6 },
  'subtitle':         null, // subtitles don't need attention
  'lower-third':      null,
  'cta':              { type: 'pulse', intensity: 0.4, speed: 0.8 },
  'quote':            { type: 'float', intensity: 0.2, speed: 0.5 },
  'watermark':        null,
  'background-media': null, // handled by ken burns
  'cutaway-media':    null,
  'overlay-media':    { type: 'float', intensity: 0.3, speed: 0.4 },
  'accent-media':     { type: 'bob', intensity: 0.3, speed: 0.5 },
  'shape-decorative': { type: 'float', intensity: 0.2, speed: 0.4 },
  'shape-accent':     { type: 'pulse', intensity: 0.3, speed: 0.6 },
  'svg-object':       { type: 'float', intensity: 0.3, speed: 0.5 },
  'character':        { type: 'breathe', intensity: 0.4, speed: 0.5 },
  'generic':          { type: 'float', intensity: 0.2, speed: 0.4 },
}

// ── Core ──────────────────────────────────────────────────────────────

/**
 * Generate animation keyframes for an element.
 *
 * @param objectType - Keyframable object type (text, media, shape, etc.)
 * @param objectId - Unique ID of the element
 * @param startFrame - Frame where the element appears
 * @param endFrame - Frame where the element disappears
 * @param options - Configuration options
 * @returns Keyframes and optional attention config
 */
export function autoAnimateElement(
  objectType: KeyframableObjectType,
  objectId: string,
  startFrame: number,
  endFrame: number,
  options: AutoAnimateOptions,
): AutoAnimateResult {
  const objectRef: CanvasObjectRef = { objectType, objectId }
  const result: AutoAnimateResult = { keyframes: [] }
  const { fps, role } = options
  const durationFrames = endFrame - startFrame
  const durationSecs = durationFrames / fps

  // ── 1. Entrance Animation ──
  if (!options.noEntrance) {
    const entrancePresetId = options.entrancePreset || pickPreset(ENTRANCE_MAP[role])
    const entrancePreset = getPresetById(entrancePresetId)
    if (entrancePreset) {
      const kfs = generatePresetKeyframes(
        entrancePreset,
        objectRef,
        startFrame,
        fps,
        'entrance',
      )
      result.keyframes.push(...kfs)
    }
  }

  // ── 2. Exit Animation ──
  if (!options.noExit && durationSecs > 1) {
    const exitPresetId = options.exitPreset || pickPreset(EXIT_MAP[role])
    const exitPreset = getPresetById(exitPresetId)
    if (exitPreset) {
      // Exit starts before the endFrame
      const exitDuration = Math.round((exitPreset.durationFrames / 30) * fps)
      const exitStart = Math.max(startFrame, endFrame - exitDuration)
      const kfs = generatePresetKeyframes(
        exitPreset,
        objectRef,
        exitStart,
        fps,
        'exit',
      )
      result.keyframes.push(...kfs)
    }
  }

  // ── 3. Attention Animation (for persistent elements > 2s) ──
  if (!options.noAttention && durationSecs > 2) {
    const attention = ATTENTION_MAP[role]
    if (attention) {
      // Attention runs between entrance end and exit start
      const entranceDuration = Math.round(fps * 0.5)
      const exitDuration = Math.round(fps * 0.5)
      const attentionStart = startFrame + entranceDuration
      const attentionEnd = endFrame - exitDuration

      if (attentionEnd > attentionStart + fps) {
        result.attentionConfig = {
          ...attention,
          startFrame: attentionStart,
          endFrame: attentionEnd,
        }
      }
    }
  }

  // ── 4. Beat Sync (subtle emphasis on beats) ──
  if (!options.noBeatSync && options.beats && options.beats.length > 0) {
    const beatKfs = generateBeatEmphasisKeyframes(
      objectRef,
      startFrame,
      endFrame,
      options.beats,
      fps,
      role,
    )
    result.keyframes.push(...beatKfs)
  }

  return result
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Pick the first available preset from a preference list */
function pickPreset(presetIds: string[]): string {
  for (const id of presetIds) {
    if (getPresetById(id)) return id
  }
  return 'fade-in' // ultimate fallback
}

/** Generate keyframes from a preset at a given start frame */
function generatePresetKeyframes(
  preset: AnimationPreset,
  objectRef: CanvasObjectRef,
  startFrame: number,
  fps: number,
  tag: string,
): AutoAnimateResult['keyframes'] {
  const fpsScale = fps / 30
  return preset.keyframes.map((kf) => ({
    objectRef,
    property: mapPropertyToObjectType(kf.property, objectRef.objectType),
    frame: startFrame + Math.round(kf.frameOffset * fpsScale),
    value: kf.value,
    easing: kf.easing,
    tag: `auto-${tag}`,
  }))
}

/**
 * Map preset property names to the actual property keys used by each object type.
 * Presets use generic names (freeX, freeY, scale, opacity, rotation) that may
 * map differently depending on the object type.
 */
function mapPropertyToObjectType(
  property: string,
  objectType: KeyframableObjectType,
): string {
  // Text overlays use freeX/freeY directly
  if (objectType === 'text') return property

  // Media, lottie, video, dialogueCharacter, riggedCharacter, character3d use position.x/y
  const positionTypes: KeyframableObjectType[] = [
    'media', 'lottie', 'video', 'dialogueCharacter',
    'riggedCharacter', 'character3d', 'pixelArtCharacter',
  ]
  if (positionTypes.includes(objectType)) {
    if (property === 'freeX') return 'position.x'
    if (property === 'freeY') return 'position.y'
  }

  // Shapes use position.x/y for positions, but x/y for keyframes
  // The keyframe system for shapes uses x/y (see applyValues in useKeyframePlayback)
  if (objectType === 'shape') {
    if (property === 'freeX') return 'x'
    if (property === 'freeY') return 'y'
  }

  // Character uses x/y
  if (objectType === 'character') {
    if (property === 'freeX') return 'x'
    if (property === 'freeY') return 'y'
  }

  return property
}

/** Generate subtle beat emphasis keyframes */
function generateBeatEmphasisKeyframes(
  objectRef: CanvasObjectRef,
  startFrame: number,
  endFrame: number,
  beats: number[],
  fps: number,
  role: ElementRole,
): AutoAnimateResult['keyframes'] {
  const result: AutoAnimateResult['keyframes'] = []

  // Only sync certain roles to beats
  const beatSyncRoles: ElementRole[] = [
    'title', 'cta', 'shape-accent', 'svg-object',
  ]
  if (!beatSyncRoles.includes(role)) return result

  const holdFrames = Math.max(1, Math.round(fps * 0.05))
  const returnFrames = Math.round(fps * 0.15)

  // Filter beats that fall within this element's range
  const entranceBuffer = Math.round(fps * 0.6) // Don't beat-sync during entrance
  const exitBuffer = Math.round(fps * 0.6) // Don't beat-sync during exit
  const safeSart = startFrame + entranceBuffer
  const safeEnd = endFrame - exitBuffer

  for (const beatTime of beats) {
    const beatFrame = Math.round(beatTime * fps)
    if (beatFrame < safeSart || beatFrame > safeEnd) continue

    // Subtle scale pulse
    result.push({
      objectRef,
      property: 'scale',
      frame: beatFrame,
      value: 1.06,
      easing: 'ease-out',
      tag: 'auto-beat',
    })
    result.push({
      objectRef,
      property: 'scale',
      frame: beatFrame + holdFrames + returnFrames,
      value: 1,
      easing: 'ease-in-out',
      tag: 'auto-beat',
    })
  }

  return result
}

// ── Batch Auto-Animate ────────────────────────────────────────────────

export interface ElementToAnimate {
  objectType: KeyframableObjectType
  objectId: string
  startFrame: number
  endFrame: number
  role: ElementRole
}

/**
 * Auto-animate multiple elements at once.
 * Used by the orchestrator step to animate all visual elements.
 */
export function autoAnimateElements(
  elements: ElementToAnimate[],
  fps: number,
  beats?: number[],
): AutoAnimateResult {
  const combined: AutoAnimateResult = { keyframes: [] }

  for (const el of elements) {
    const result = autoAnimateElement(
      el.objectType,
      el.objectId,
      el.startFrame,
      el.endFrame,
      { role: el.role, fps, beats },
    )
    combined.keyframes.push(...result.keyframes)
    // Attention configs are collected but need to be applied per-element
    // by the caller (since they're runtime-evaluated, not keyframe-based)
  }

  return combined
}
