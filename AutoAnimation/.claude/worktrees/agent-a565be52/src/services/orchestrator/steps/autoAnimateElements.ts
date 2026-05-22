/**
 * Step Executor: Auto-Animate Elements
 *
 * Runs after all visual elements are placed on the canvas.
 * Scans text overlays, shapes, stock media, and SVG objects,
 * then applies entrance/exit/attention/beat-sync animations
 * via the animation engine.
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { ExecutionContext } from '../constants'
import {
  autoAnimateElement,
  type ElementRole,
} from '@/engine/autoAnimate'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { logger } from '@/utils/logger'

export async function executeAutoAnimateElements(
  _plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const fps = ctx.fps || 30
  const beats = ctx.beatTimestamps
  const kfStore = useKeyframeStore.getState()
  let totalKeyframes = 0
  let elementsAnimated = 0

  // ── Auto-animate text overlays ──
  try {
    const textStore = useTextOverlayStore.getState()
    for (const overlay of textStore.overlays) {
      const startFrame = overlay.startFrame ?? 0
      const endFrame = overlay.endFrame ?? ctx.totalFrames

      // Skip overlays that already have keyframes
      const ref = { objectType: 'text' as const, objectId: overlay.id }
      if (kfStore.hasKeyframes(ref)) continue

      // Map preset type to element role
      const role = mapTextPresetToRole(overlay.presetType)

      const result = autoAnimateElement(
        'text',
        overlay.id,
        startFrame,
        endFrame,
        { role, fps, beats },
      )

      applyKeyframes(kfStore, result.keyframes)
      totalKeyframes += result.keyframes.length
      elementsAnimated++
    }
  } catch (err) {
    logger.warn('[Orchestrator:auto-animate] Text overlay animation failed:', err)
  }

  // ── Auto-animate shapes ──
  try {
    const shapeStore = useShapeStore.getState()
    for (const shape of shapeStore.shapes) {
      const ref = { objectType: 'shape' as const, objectId: shape.id }
      if (kfStore.hasKeyframes(ref)) continue

      const role: ElementRole = shape.fill && shape.opacity && shape.opacity < 0.5
        ? 'shape-decorative'
        : 'shape-accent'

      const result = autoAnimateElement(
        'shape',
        shape.id,
        shape.startFrame,
        shape.endFrame,
        { role, fps, beats },
      )

      applyKeyframes(kfStore, result.keyframes)
      totalKeyframes += result.keyframes.length
      elementsAnimated++
    }
  } catch (err) {
    logger.warn('[Orchestrator:auto-animate] Shape animation failed:', err)
  }

  // ── Auto-animate stock media ──
  try {
    const mediaStore = useMediaStore.getState()
    for (const item of mediaStore.canvasItems) {
      const ref = { objectType: 'media' as const, objectId: item.id }
      if (kfStore.hasKeyframes(ref)) continue

      // Determine role from z-index and scale (rough heuristic)
      let role: ElementRole = 'overlay-media'
      if (item.zIndex <= 1) role = 'background-media'
      else if (item.zIndex <= 3) role = 'cutaway-media'
      else if (item.scale && item.scale < 0.5) role = 'accent-media'

      // Background media shouldn't get pop-in animations
      const noEntrance = role === 'background-media'
      const noExit = role === 'background-media'

      const result = autoAnimateElement(
        'media',
        item.id,
        item.startFrame,
        item.endFrame,
        { role, fps, beats, noEntrance, noExit },
      )

      applyKeyframes(kfStore, result.keyframes)
      totalKeyframes += result.keyframes.length
      elementsAnimated++
    }
  } catch (err) {
    logger.warn('[Orchestrator:auto-animate] Media animation failed:', err)
  }

  // ── Auto-animate SVG objects ──
  try {
    const svgStore = useSVGObjectStore.getState()
    if (svgStore.composition) {
      for (const obj of svgStore.composition.objects) {
        // SVG objects use their own keyframe system, but we can add
        // entrance emphasis via the main keyframe store if they don't have custom motion.
        // For now, SVG objects that have no keyframes or only a single keyframe
        // (static position) get auto-animated.
        const hasMotion = obj.keyframes && obj.keyframes.length > 1
        if (hasMotion) continue

        // SVG objects don't go through the standard keyframe store,
        // so we log them as animated but skip keyframe generation.
        // Their entrance/exit is handled by SVGObjectLayer via opacity/scale SVG attributes.
        elementsAnimated++
      }
    }
  } catch (err) {
    logger.warn('[Orchestrator:auto-animate] SVG animation failed:', err)
  }

  logger.info(
    `[Orchestrator:auto-animate] Animated ${elementsAnimated} elements, ` +
    `added ${totalKeyframes} keyframes` +
    (beats ? ` (${beats.length} beats available for sync)` : ''),
  )
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Map text overlay preset types to animation roles */
function mapTextPresetToRole(presetType: string): ElementRole {
  switch (presetType) {
    case 'title': return 'title'
    case 'subtitle': return 'subtitle'
    case 'lower-third': return 'lower-third'
    case 'cta': return 'cta'
    case 'quote': return 'quote'
    case 'watermark': return 'watermark'
    default: return 'generic'
  }
}

/** Apply generated keyframes to the keyframe store using tagged keyframes */
function applyKeyframes(
  kfStore: ReturnType<typeof useKeyframeStore.getState>,
  keyframes: Array<{
    objectRef: { objectType: string; objectId: string }
    property: string
    frame: number
    value: number
    easing: string
    tag?: string
  }>,
): void {
  for (const kf of keyframes) {
    if (kf.tag) {
      kfStore.setTaggedKeyframe(
        kf.objectRef as import('@/types/keyframes').CanvasObjectRef,
        kf.property,
        kf.frame,
        kf.value,
        kf.easing as import('@/types/keyframes').EasingType,
        kf.tag,
      )
    } else {
      kfStore.setKeyframe(
        kf.objectRef as import('@/types/keyframes').CanvasObjectRef,
        kf.property,
        kf.frame,
        kf.value,
      )
    }
  }
}
