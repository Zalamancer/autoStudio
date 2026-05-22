/**
 * Step Executor: Setup Background
 *
 * Supports 4 background types:
 * - "none": Solid dark fill — used when HTML template covers the full clip
 * - "image": Real scene image via Pixabay search (office, park, classroom, etc.)
 * - "lottie": Ambient particle overlay from built-in library (legacy)
 * - "svg-generate": AI-generated SVG scene via Gemini
 */

import type { ClipPlan } from '@/types/orchestrator'
import { sampleAnimations } from '@/data/sampleAnimations'
import { toast } from '@/stores/useToastStore'
import { generateSVGObjects } from '@/services/svgObjectAnimation'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { CREDIT_COSTS } from '@/types/credits'
import { logger } from '@/utils/logger'
import {
  ASPECT_RATIO_DIMENSIONS,
  GEMINI_PRO_INPUT_PRICE,
  GEMINI_PRO_OUTPUT_PRICE,
  type ExecutionContext,
} from '../constants'

export async function executeSetupBackground(plan: ClipPlan, _ctx: ExecutionContext): Promise<void> {
  // Image-heavy / stock-only fast mode: the stock images ARE the background, so skip every generation
  // branch (Lottie, SVG, Pixabay injection) and paint the canvas white for the sliver visible during
  // cross-fade gaps. This also shields us from planner drift where `background.type` slips back to
  // "svg-generate" despite the image-heavy directive.
  if (_ctx.settings?.imageHeavyMode) {
    useSettingsStore.getState().setSetting('canvasBgColor', '#ffffff')
    logger.log('[Orchestrator:background] Image-heavy mode — skipping background, white canvas fill')
    return
  }

  // ── "none" — solid dark fill, no background layer ──
  if (plan.background.type === 'none') {
    // Dark fill is the renderer's default (#18181b) — no store action needed
    logger.log('[Orchestrator:background] Using solid dark fill (HTML template is the visual)')
    return
  }

  // ── "image" — real scene background via Pixabay ──
  if (plan.background.type === 'image' && plan.background.imageQuery) {
    // Inject a background stock media entry into the plan so the existing
    // setupStockMedia step handles the Pixabay search and canvas placement.
    // This reuses the full stock media intelligence pipeline (multi-query
    // fallback, relevance scoring, Ken Burns, etc.)
    if (!plan.stockMedia) plan.stockMedia = []

    // Only inject if there isn't already a background-role stock media item
    const hasStockBg = plan.stockMedia.some((sm) => sm.role === 'background')
    if (!hasStockBg) {
      plan.stockMedia.unshift({
        query: plan.background.imageQuery,
        type: 'image',
        role: 'background',
        position: { x: 50, y: 50 },
        scale: 1.05,
        startPercent: 0,
        endPercent: 1,
        enterTransition: 'fade',
        exitTransition: 'fade',
        transitionDuration: 0.5,
      })
      logger.log(`[Orchestrator:background] Injected image background: "${plan.background.imageQuery}"`)
    }

    // Set a dark canvas color as fallback while Pixabay loads
    // Dark fill is the renderer's default (#18181b) — no store action needed
    return
  }

  // ── "lottie" — ambient particle overlay (legacy) ──
  if (plan.background.type === 'lottie') {
    const store = useAnimationStore.getState()

    if (store.library.length === 0) {
      store.initLibrary(sampleAnimations)
    }

    const query = (plan.background.lottieQuery || '').toLowerCase()
    const match = sampleAnimations.find(
      (a) =>
        a.category === 'background' &&
        (a.name.toLowerCase().includes(query) || a.tags.some((t) => t.toLowerCase().includes(query))),
    )

    if (match) {
      store.addToCanvas(match.id)
    } else if (sampleAnimations.some((a) => a.category === 'background')) {
      const fallback = sampleAnimations.find((a) => a.category === 'background')!
      store.addToCanvas(fallback.id)
    }
    return
  }

  // ── "svg-generate" — AI-generated SVG scene ──
  if (plan.background.type === 'svg-generate' && plan.background.svgPrompt) {
    // Skip SVG background if HTML templates cover the full clip
    const hasFullCoverageTemplate = (plan.htmlTemplates || []).some(
      (t) => (t.startPercent ?? 0) <= 0.01 && (t.endPercent ?? 1) >= 0.95,
    )
    if (hasFullCoverageTemplate) {
      // Dark fill is the renderer's default (#18181b) — no store action needed
      logger.log('[Orchestrator:background] Skipping SVG — HTML template covers full clip')
      return
    }

    const { totalFrames } = useTimelineStore.getState()
    const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

    let response: Awaited<ReturnType<typeof generateSVGObjects>>
    try {
      response = await generateSVGObjects({
        prompt: plan.background.svgPrompt,
        width: dims.w,
        height: dims.h,
      })
    } catch (err) {
      logger.warn('[Orchestrator] SVG generation failed, using dark fill:', err)
      toast.warning('SVG generation failed — using dark background')
      // Dark fill is the renderer's default (#18181b) — no store action needed
      return
    }

    const composition = {
      id: `svg-comp-${Date.now()}`,
      prompt: plan.background.svgPrompt,
      background: response.background,
      width: response.width,
      height: response.height,
      objects: (response.objects || []).map((obj, i) => ({
        id: `svg-obj-${Date.now()}-${i}`,
        name: obj.name,
        zIndex: obj.zIndex,
        visible: true,
        colors: { ...obj.defaultColors },
        defaultColors: obj.defaultColors,
        svgMarkup: obj.svgMarkup,
        keyframes: obj.keyframes || [{ time: 0 }],
        startFrame: 0,
        endFrame: totalFrames,
        opacity: 1,
      })),
    }

    useSVGObjectStore.getState().setComposition(composition)

    if (_ctx.addCostEntry) {
      const inputCost = response.tokenUsage
        ? (response.tokenUsage.promptTokenCount / 1_000_000) * GEMINI_PRO_INPUT_PRICE
        : 0
      const outputCost = response.tokenUsage
        ? (response.tokenUsage.candidatesTokenCount / 1_000_000) * GEMINI_PRO_OUTPUT_PRICE
        : 0
      _ctx.addCostEntry({
        source: 'gemini',
        label: 'SVG Background',
        cost: inputCost + outputCost,
        credits: CREDIT_COSTS['svg-object'],
        tokenUsage: response.tokenUsage,
      })
    }
  }
}
