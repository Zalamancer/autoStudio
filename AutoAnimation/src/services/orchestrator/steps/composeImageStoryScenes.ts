/**
 * Step Executor: Compose Image Story Scenes
 *
 * Places background images and noun PNGs onto the canvas for each scene,
 * then applies entry/exit keyframe animations per noun and verb-driven
 * motion keyframes.
 *
 * Layout rules:
 * - Max 3 simultaneous nouns per scene; oldest exits when 4th arrives.
 * - 200ms pre-entry offset (image appears slightly before word is spoken).
 * - Zone-based placement via computeRegion (shared with Remotion/Pixi layers).
 * - Verb animations map to keyframe presets (scale pulse, shake, path, etc.).
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { ImageStoryWordTiming } from '@/types/imageStory'
import { computeRegion } from '@/types/imageStory'
import { useMediaStore, type MediaAsset } from '@/stores/useMediaStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useImageStoryStore } from '@/stores/useImageStoryStore'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'
import type { CanvasObjectRef, EasingType } from '@/types/keyframes'
import { logger } from '@/utils/logger'

// ── Verb Animation Map ──────────────────────────────────────────────────────

interface VerbAnimationParams {
  /** Property keyframes to apply relative to the noun's time range */
  keyframes: {
    property: string
    /** 0-1 offset within the word's spoken range */
    timeOffset: number
    value: number
    easing: EasingType
  }[]
}

/**
 * Maps verb animation categories to concrete keyframe params.
 * Each entry produces keyframes on the noun's canvas item that the verb is linked to.
 */
const VERB_ANIMATION_MAP: Record<string, VerbAnimationParams> = {
  movement: {
    // Horizontal slide: shift x by 15% of canvas width then return
    keyframes: [
      { property: 'freeX', timeOffset: 0, value: 0, easing: 'ease-in-out' },
      { property: 'freeX', timeOffset: 0.4, value: 150, easing: 'ease-in-out' },
      { property: 'freeX', timeOffset: 1, value: 0, easing: 'ease-out' },
    ],
  },
  grab: {
    // Scale pulse — object "grabs" attention
    keyframes: [
      { property: 'scale', timeOffset: 0, value: 1, easing: 'ease-in' },
      { property: 'scale', timeOffset: 0.3, value: 1.25, easing: 'elastic-out' },
      { property: 'scale', timeOffset: 0.7, value: 1.15, easing: 'ease-out' },
      { property: 'scale', timeOffset: 1, value: 1, easing: 'ease-out' },
    ],
  },
  appear: {
    // Fade + scale up from nothing
    keyframes: [
      { property: 'opacity', timeOffset: 0, value: 0, easing: 'ease-out' },
      { property: 'opacity', timeOffset: 0.4, value: 1, easing: 'ease-out' },
      { property: 'scale', timeOffset: 0, value: 0.5, easing: 'elastic-out' },
      { property: 'scale', timeOffset: 0.5, value: 1.05, easing: 'elastic-out' },
      { property: 'scale', timeOffset: 1, value: 1, easing: 'ease-out' },
    ],
  },
  disappear: {
    // Shrink + fade out
    keyframes: [
      { property: 'opacity', timeOffset: 0, value: 1, easing: 'ease-in' },
      { property: 'opacity', timeOffset: 0.8, value: 0, easing: 'ease-in' },
      { property: 'scale', timeOffset: 0, value: 1, easing: 'ease-in' },
      { property: 'scale', timeOffset: 0.8, value: 0.3, easing: 'ease-in' },
    ],
  },
  impact: {
    // Quick shake — rapid horizontal jitter
    keyframes: [
      { property: 'freeX', timeOffset: 0, value: 0, easing: 'linear' },
      { property: 'freeX', timeOffset: 0.1, value: -12, easing: 'linear' },
      { property: 'freeX', timeOffset: 0.2, value: 12, easing: 'linear' },
      { property: 'freeX', timeOffset: 0.3, value: -8, easing: 'linear' },
      { property: 'freeX', timeOffset: 0.4, value: 8, easing: 'linear' },
      { property: 'freeX', timeOffset: 0.5, value: 0, easing: 'ease-out' },
      { property: 'scale', timeOffset: 0, value: 1, easing: 'ease-in' },
      { property: 'scale', timeOffset: 0.15, value: 1.15, easing: 'bounce-out' },
      { property: 'scale', timeOffset: 0.5, value: 1, easing: 'ease-out' },
    ],
  },
  emotion: {
    // Gentle bounce / pulse
    keyframes: [
      { property: 'scale', timeOffset: 0, value: 1, easing: 'ease-in-out' },
      { property: 'scale', timeOffset: 0.25, value: 1.1, easing: 'sine-out' },
      { property: 'scale', timeOffset: 0.5, value: 0.95, easing: 'sine-in' },
      { property: 'scale', timeOffset: 0.75, value: 1.05, easing: 'sine-out' },
      { property: 'scale', timeOffset: 1, value: 1, easing: 'ease-out' },
    ],
  },
  growth: {
    // Continuous upward scale
    keyframes: [
      { property: 'scale', timeOffset: 0, value: 0.7, easing: 'ease-out' },
      { property: 'scale', timeOffset: 0.6, value: 1.2, easing: 'ease-in-out' },
      { property: 'scale', timeOffset: 1, value: 1.1, easing: 'ease-out' },
      { property: 'freeY', timeOffset: 0, value: 0, easing: 'ease-out' },
      { property: 'freeY', timeOffset: 1, value: -30, easing: 'ease-out' },
    ],
  },
  fall: {
    // Gravity drop with bounce
    keyframes: [
      { property: 'freeY', timeOffset: 0, value: -80, easing: 'ease-in' },
      { property: 'freeY', timeOffset: 0.5, value: 0, easing: 'bounce-out' },
      { property: 'freeY', timeOffset: 0.7, value: -15, easing: 'ease-out' },
      { property: 'freeY', timeOffset: 1, value: 0, easing: 'bounce-out' },
      { property: 'scale', timeOffset: 0.5, value: 1.1, easing: 'ease-out' },
      { property: 'scale', timeOffset: 0.7, value: 0.95, easing: 'ease-out' },
      { property: 'scale', timeOffset: 1, value: 1, easing: 'ease-out' },
    ],
  },
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Maximum simultaneous noun images on screen per scene */
const MAX_SIMULTANEOUS_NOUNS = 3

/** How many milliseconds before the word is spoken the image should appear */
const PRE_ENTRY_MS = 200

/** Duration of exit animation in frames (at 30fps ~10 frames = 333ms) */
const EXIT_ANIM_FRAMES = 10

// ── Helpers ──────────────────────────────────────────────────────────────────

function msToFrame(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps)
}

function makeAssetId(): string {
  return `is_asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function makeObjectRef(canvasItemId: string): CanvasObjectRef {
  return { objectType: 'media', objectId: canvasItemId }
}

/**
 * Add entry keyframes for a noun image (opacity fade-in + elastic scale pop).
 */
function addEntryKeyframes(
  canvasItemId: string,
  entryFrame: number,
  fps: number,
): void {
  const kfStore = useKeyframeStore.getState()
  const ref = makeObjectRef(canvasItemId)

  // Opacity: 0 -> 1 over ~6 frames
  const fadeDuration = Math.round(fps * 0.2)
  kfStore.setKeyframe(ref, 'opacity', entryFrame, 0)
  kfStore.setKeyframe(ref, 'opacity', entryFrame + fadeDuration, 1)

  // Scale: 0.6 -> 1.05 -> 1 (elastic pop)
  const popMid = Math.round(fps * 0.15)
  const popEnd = Math.round(fps * 0.3)
  kfStore.setKeyframe(ref, 'scale', entryFrame, 0.6)
  kfStore.setKeyframe(ref, 'scale', entryFrame + popMid, 1.05)
  kfStore.setKeyframe(ref, 'scale', entryFrame + popEnd, 1)
}

/**
 * Add exit keyframes for a noun image being evicted (opacity + scale out).
 */
function addExitKeyframes(
  canvasItemId: string,
  exitFrame: number,
  fps: number,
): void {
  const kfStore = useKeyframeStore.getState()
  const ref = makeObjectRef(canvasItemId)

  const duration = EXIT_ANIM_FRAMES
  kfStore.setKeyframe(ref, 'opacity', exitFrame, 1)
  kfStore.setKeyframe(ref, 'opacity', exitFrame + duration, 0)
  kfStore.setKeyframe(ref, 'scale', exitFrame, 1)
  kfStore.setKeyframe(ref, 'scale', exitFrame + duration, 0.4)
}

/**
 * Apply verb-specific animation keyframes to a noun's canvas item.
 */
function applyVerbAnimation(
  canvasItemId: string,
  verbCategory: string,
  verbStartFrame: number,
  verbEndFrame: number,
): void {
  const params = VERB_ANIMATION_MAP[verbCategory]
  if (!params) return

  const kfStore = useKeyframeStore.getState()
  const ref = makeObjectRef(canvasItemId)
  const frameDuration = verbEndFrame - verbStartFrame

  for (const kf of params.keyframes) {
    const frame = Math.round(verbStartFrame + kf.timeOffset * frameDuration)
    kfStore.setKeyframe(ref, kf.property, frame, kf.value)
  }
}

// ── Main Executor ────────────────────────────────────────────────────────────

export async function executeComposeImageStoryScenes(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const imageStory = plan.imageStory
  if (!imageStory || !imageStory.scenes.length) {
    logger.warn('[composeImageStoryScenes] No image story plan found, skipping.')
    return
  }

  const wordTimings = ctx.imageStoryWordTimings
  if (!wordTimings || wordTimings.length === 0) {
    logger.warn('[composeImageStoryScenes] No word timings available, skipping.')
    return
  }

  const { fps } = ctx
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] ?? { w: 1920, h: 1080 }
  const canvasW = dims.w
  const canvasH = dims.h

  const mediaStore = useMediaStore.getState()
  const imageStoryStore = useImageStoryStore.getState()
  const selectedAssets = imageStoryStore.selectedAssets

  logger.info(`[composeImageStoryScenes] Composing ${imageStory.scenes.length} scenes, ${wordTimings.length} timed words`)

  // Build a quick lookup: word text (lowercase) -> timing
  const timingByWord = new Map<string, ImageStoryWordTiming[]>()
  for (const wt of wordTimings) {
    const key = wt.word.text.toLowerCase()
    const arr = timingByWord.get(key) ?? []
    arr.push(wt)
    timingByWord.set(key, arr)
  }

  // Track active nouns per scene for the 3-simultaneous limit
  interface ActiveNoun {
    canvasItemId: string
    assetId: string
    entryFrame: number
    endFrame: number
    word: string
  }

  let globalTimingIndex = 0 // incremental index into wordTimings for scene boundaries

  for (const scene of imageStory.scenes) {
    // ── 1. Place background image ──────────────────────────────────────

    const bgSearchTerm = scene.background.searchTerm
    const bgAssetUrl = selectedAssets[`bg_${scene.id}`] ?? selectedAssets[bgSearchTerm]

    if (bgAssetUrl) {
      const bgAssetId = makeAssetId()

      // Determine the scene's frame range from its words' timings
      const sceneWordTimings = wordTimings.filter((wt) =>
        scene.words.some((sw) => sw.text.toLowerCase() === wt.word.text.toLowerCase()),
      )
      const sceneStartFrame = sceneWordTimings.length > 0
        ? Math.min(...sceneWordTimings.map((wt) => wt.startFrame))
        : globalTimingIndex < wordTimings.length ? wordTimings[globalTimingIndex].startFrame : 0
      const sceneEndFrame = sceneWordTimings.length > 0
        ? Math.max(...sceneWordTimings.map((wt) => wt.endFrame))
        : globalTimingIndex < wordTimings.length ? wordTimings[Math.min(globalTimingIndex + scene.words.length - 1, wordTimings.length - 1)].endFrame : ctx.totalFrames

      // Register asset in the store
      const bgAsset: MediaAsset = {
        id: bgAssetId,
        name: `bg_${scene.id}_${bgSearchTerm}`,
        type: 'image/jpeg',
        size: 0,
        category: 'images',
        url: bgAssetUrl,
        addedAt: Date.now(),
      }

      mediaStore.addAssets([bgAsset])
      mediaStore.addToCanvas(bgAssetId)

      // Patch the canvas item for background placement
      const bgCanvasItem = mediaStore.canvasItems.find((c) => c.assetId === bgAssetId)
      if (bgCanvasItem) {
        mediaStore.updateCanvasItem(bgCanvasItem.id, {
          position: { x: 0, y: 0 },
          scale: 1.05, // slight bleed like standard backgrounds
          startFrame: sceneStartFrame,
          endFrame: sceneEndFrame,
          zIndex: 0,
          enterTransition: 'fade',
          exitTransition: 'fade',
        })
      }
    }

    // ── 2. Place noun PNGs with zone-based layout ──────────────────────

    const activeNouns: ActiveNoun[] = []
    const nounWords = scene.words.filter((w) => w.role === 'image_noun')
    let nounPlacementIndex = 0

    for (const nounWord of nounWords) {
      // Find timing for this noun
      const key = nounWord.text.toLowerCase()
      const timingEntries = timingByWord.get(key)
      if (!timingEntries || timingEntries.length === 0) continue

      // Use the first unused timing entry for this word
      const timing = timingEntries.shift()!

      // Resolve the asset URL from selectedAssets or search term
      const searchTerm = nounWord.searchTerm ?? nounWord.text
      const nounAssetUrl = selectedAssets[searchTerm] ?? selectedAssets[key]
      if (!nounAssetUrl) {
        logger.warn(`[composeImageStoryScenes] No asset found for noun "${nounWord.text}" (search: ${searchTerm})`)
        continue
      }

      // ── Enforce max 3 simultaneous nouns ────────────────────────────

      if (activeNouns.length >= MAX_SIMULTANEOUS_NOUNS) {
        // Evict the oldest noun
        const oldest = activeNouns.shift()!
        const evictFrame = timing.startFrame - EXIT_ANIM_FRAMES
        addExitKeyframes(oldest.canvasItemId, Math.max(0, evictFrame), fps)

        // Shorten its endFrame so it exits visually
        mediaStore.updateCanvasItem(oldest.canvasItemId, {
          endFrame: evictFrame + EXIT_ANIM_FRAMES + 1,
        })
      }

      // ── Compute placement region ────────────────────────────────────

      const currentActive = activeNouns.length
      const totalAfter = currentActive + 1
      const region = computeRegion(currentActive, totalAfter, canvasW, canvasH)

      // Pre-entry: show image slightly before the word is spoken
      const preEntryFrames = msToFrame(PRE_ENTRY_MS, fps)
      const entryFrame = Math.max(0, timing.startFrame - preEntryFrames)

      // Noun stays until the last word in the scene or next eviction
      const sceneNounTimings = nounWords
        .map((nw) => {
          const t = timingByWord.get(nw.text.toLowerCase())
          return t && t.length > 0 ? t[0] : null
        })
        .filter(Boolean) as ImageStoryWordTiming[]
      const lastFrameInScene = sceneNounTimings.length > 0
        ? Math.max(...sceneNounTimings.map((t) => t.endFrame))
        : timing.endFrame + msToFrame(2000, fps) // 2s fallback

      // ── Register asset and add to canvas ────────────────────────────

      const assetId = makeAssetId()
      const nounAsset: MediaAsset = {
        id: assetId,
        name: `noun_${searchTerm}`,
        type: 'image/png',
        size: 0,
        category: 'images',
        url: nounAssetUrl,
        addedAt: Date.now(),
      }

      mediaStore.addAssets([nounAsset])
      mediaStore.addToCanvas(assetId)

      // Patch canvas item with position, timing, zIndex
      const canvasItem = mediaStore.canvasItems.find((c) => c.assetId === assetId)
      if (!canvasItem) {
        logger.warn(`[composeImageStoryScenes] Canvas item not created for asset ${assetId}`)
        continue
      }

      mediaStore.updateCanvasItem(canvasItem.id, {
        position: { x: region.x, y: region.y },
        startFrame: entryFrame,
        endFrame: lastFrameInScene,
        zIndex: region.zIndex + 1, // above background
        opacity: 0, // starts invisible, keyframes fade in
        enterTransition: 'none', // keyframes handle entry
        exitTransition: 'none',
      })

      // ── Add entry keyframes (opacity + elastic scale) ───────────────

      addEntryKeyframes(canvasItem.id, entryFrame, fps)

      // Track this noun as active
      activeNouns.push({
        canvasItemId: canvasItem.id,
        assetId,
        entryFrame,
        endFrame: lastFrameInScene,
        word: nounWord.text,
      })

      nounPlacementIndex++
    }

    // ── 3. Apply verb animations ─────────────────────────────────────

    const verbWords = scene.words.filter((w) => w.role === 'action_verb')
    for (const verbWord of verbWords) {
      const verbCategory = verbWord.animation ?? 'movement'
      const linkedNoun = verbWord.linkedNoun?.toLowerCase()
      if (!linkedNoun) continue

      // Find the active noun's canvas item that this verb targets
      const targetNoun = activeNouns.find(
        (an) => an.word.toLowerCase() === linkedNoun,
      )
      if (!targetNoun) {
        logger.debug(`[composeImageStoryScenes] Verb "${verbWord.text}" linked to "${linkedNoun}" but no active canvas item found`)
        continue
      }

      // Find verb timing
      const verbKey = verbWord.text.toLowerCase()
      const verbTimings = timingByWord.get(verbKey)
      if (!verbTimings || verbTimings.length === 0) continue

      const verbTiming = verbTimings.shift()!
      applyVerbAnimation(
        targetNoun.canvasItemId,
        verbCategory,
        verbTiming.startFrame,
        verbTiming.endFrame,
      )
    }

    // Advance the global timing index past this scene's words
    globalTimingIndex += scene.words.length
  }

  logger.info('[composeImageStoryScenes] Scene composition complete')
}
