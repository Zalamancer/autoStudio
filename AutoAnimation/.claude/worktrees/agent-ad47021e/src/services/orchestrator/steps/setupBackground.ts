/**
 * Step Executor: Setup Background
 */

import type { ClipPlan } from '@/types/orchestrator'
import { sampleAnimations } from '@/data/sampleAnimations'
import { toast } from '@/stores/useToastStore'
import { generateSVGObjects } from '@/services/svgObjectAnimation'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { CREDIT_COSTS } from '@/types/credits'
import { logger } from '@/utils/logger'
import {
  ASPECT_RATIO_DIMENSIONS,
  GEMINI_PRO_INPUT_PRICE,
  GEMINI_PRO_OUTPUT_PRICE,
  type ExecutionContext,
} from '../constants'

export async function executeSetupBackground(
  plan: ClipPlan,
  _ctx: ExecutionContext,
): Promise<void> {
  if (plan.background.type === 'lottie') {
    const store = useAnimationStore.getState()

    // Ensure library is loaded
    if (store.library.length === 0) {
      store.initLibrary(sampleAnimations)
    }

    // Find best match by query
    const query = (plan.background.lottieQuery || '').toLowerCase()
    const match = sampleAnimations.find(
      (a) =>
        a.category === 'background' &&
        (a.name.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query))),
    )

    if (match) {
      store.addToCanvas(match.id)
    } else if (sampleAnimations.some((a) => a.category === 'background')) {
      // Fallback: add first background animation
      const fallback = sampleAnimations.find((a) => a.category === 'background')!
      store.addToCanvas(fallback.id)
    }
  } else if (plan.background.type === 'svg-generate' && plan.background.svgPrompt) {
    // Skip SVG background if HTML templates cover the full clip — the SVG layer
    // renders on top and blocks the templates.
    const hasFullCoverageTemplate = (plan.htmlTemplates || []).some(
      (t) => (t.startPercent ?? 0) <= 0.01 && (t.endPercent ?? 1) >= 0.95,
    )
    if (hasFullCoverageTemplate) {
      // Fall back to a subtle lottie instead
      const store = useAnimationStore.getState()
      if (store.library.length === 0) store.initLibrary(sampleAnimations)
      const fallback = sampleAnimations.find((a) => a.category === 'background')
      if (fallback) store.addToCanvas(fallback.id)
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
      // SVG generation requires the backend server — fall back to Lottie if server is down
      logger.warn('[Orchestrator] SVG generation failed, falling back to Lottie background:', err)
      toast.warning('SVG generation failed — using Lottie background instead')
      const store = useAnimationStore.getState()
      if (store.library.length === 0) store.initLibrary(sampleAnimations)
      const fallback = sampleAnimations.find((a) => a.category === 'background')
      if (fallback) store.addToCanvas(fallback.id)
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

    // Track SVG background generation cost (Gemini 2.5 Pro)
    if (_ctx.addCostEntry) {
      const inputCost = response.tokenUsage ? (response.tokenUsage.promptTokenCount / 1_000_000) * GEMINI_PRO_INPUT_PRICE : 0
      const outputCost = response.tokenUsage ? (response.tokenUsage.candidatesTokenCount / 1_000_000) * GEMINI_PRO_OUTPUT_PRICE : 0
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
