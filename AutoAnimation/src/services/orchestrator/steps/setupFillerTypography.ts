/**
 * Step Executor: Setup Filler Typography
 *
 * For image-story mode, filler words (articles, prepositions, conjunctions, etc.)
 * don't get their own Freepik asset. Instead they're rendered as kinetic text overlays
 * positioned in safe zones (top 20% or bottom 20%, alternating).
 *
 * Consecutive filler words are merged into a single text block so "in the" becomes
 * one overlay rather than two tiny ones.
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { ImageStoryStyle, ImageStoryWordTiming } from '@/types/imageStory'
import type { TextOverlay } from '@/stores/useTextOverlayStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'
import { logger } from '@/utils/logger'

// ── Style-to-template family mapping ──────────────────────────────────
// Each ImageStoryStyle maps to a kinetic typography animation preset that
// complements the visual tone of the overall image story.

const STYLE_TEMPLATE_MAP: Record<ImageStoryStyle, string> = {
  Cartoon: 'bounce-slam',
  Realistic: 'wipe-right',
  Minimalist: 'pop-scale',
  Watercolor: 'circle-reveal',
  Flat: 'whip-right',
  '3D Render': 'flip-x',
}

// ── Filler group helper ───────────────────────────────────────────────

interface FillerGroup {
  /** Merged text content (e.g. "in the") */
  text: string
  /** Start frame of the first word in the group */
  startFrame: number
  /** End frame of the last word in the group */
  endFrame: number
}

/**
 * Collect consecutive filler words into merged groups.
 * Adjacent filler timings (where one ends at or near where the next starts)
 * are collapsed into a single text block.
 */
function collectFillerGroups(timings: ImageStoryWordTiming[]): FillerGroup[] {
  const fillers = timings.filter((t) => t.word.role === 'filler')
  if (fillers.length === 0) return []

  const groups: FillerGroup[] = []
  let current: FillerGroup = {
    text: fillers[0].word.text,
    startFrame: fillers[0].startFrame,
    endFrame: fillers[0].endFrame,
  }

  for (let i = 1; i < fillers.length; i++) {
    const prev = fillers[i - 1]
    const curr = fillers[i]

    // Merge if the gap between previous end and current start is <= 3 frames
    // (i.e. they are adjacent or nearly adjacent in the timeline)
    const gap = curr.startFrame - prev.endFrame
    if (gap <= 3) {
      current.text += ' ' + curr.word.text
      current.endFrame = curr.endFrame
    } else {
      groups.push(current)
      current = {
        text: curr.word.text,
        startFrame: curr.startFrame,
        endFrame: curr.endFrame,
      }
    }
  }
  groups.push(current)

  return groups
}

// ── Step executor ─────────────────────────────────────────────────────

export async function executeSetupFillerTypography(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.imageStory) {
    logger.warn('[Orchestrator:fillerTypography] No imageStory plan — skipping.')
    return
  }

  const wordTimings = ctx.imageStoryWordTimings
  if (!wordTimings || wordTimings.length === 0) {
    logger.warn('[Orchestrator:fillerTypography] No word timings available — skipping.')
    return
  }

  // Canvas dimensions from aspect ratio
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] ?? { w: 1920, h: 1080 }

  // Style-matched animation preset
  const style = plan.imageStory.style
  const animationPreset = STYLE_TEMPLATE_MAP[style] ?? 'pop-scale'

  // Collect consecutive fillers into groups
  const groups = collectFillerGroups(wordTimings)
  if (groups.length === 0) {
    logger.info('[Orchestrator:fillerTypography] No filler words found — nothing to add.')
    return
  }

  logger.info(`[Orchestrator:fillerTypography] Creating ${groups.length} filler text overlay(s) for style "${style}".`)

  const store = useTextOverlayStore.getState()

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]

    try {
      // Alternate between top 20% and bottom 20% safe zones
      const isTop = i % 2 === 0
      // freeY is a percentage (0-100) of canvas height
      // Top zone: 10% from top center, Bottom zone: 90% from top (10% from bottom)
      const freeY = isTop ? 10 : 90

      const overlay: TextOverlay = {
        id: `filler_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        presetType: 'subtitle',
        content: group.text,
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'center',
        verticalAlign: 'middle',
        position: 'free',
        freeX: 50, // horizontally centered
        freeY,
        lineHeight: 1.4,
        letterSpacing: 0,
        textCase: 'none',
        shadow: true,
        background: false,
        backgroundOpacity: 0.7,
        visible: true,
        opacity: 1,
        zIndex: 10, // above scene imagery (images sit at lower z-indices)
        rotation: 0,
        width: Math.round(dims.w * 0.8), // 80% of canvas width for comfortable reading
        height: null,
        startFrame: group.startFrame,
        endFrame: group.endFrame,
        animationPreset,
      }

      store.addOverlay(overlay)
    } catch (err) {
      logger.error(`[Orchestrator:fillerTypography] Failed to add filler group ${i + 1}:`, err)
    }
  }
}
