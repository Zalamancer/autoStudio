/**
 * Step Executor: Generate SVG Objects
 */

import type { ClipPlan } from '@/types/orchestrator'
import { generateSVGObjects } from '@/services/svgObjectAnimation'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { CREDIT_COSTS } from '@/types/credits'
import { logger } from '@/utils/logger'
import {
  ASPECT_RATIO_DIMENSIONS,
  GEMINI_PRO_INPUT_PRICE,
  GEMINI_PRO_OUTPUT_PRICE,
  type ExecutionContext,
} from '../constants'

export async function executeGenerateSVGObjects(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.svgObjects || plan.svgObjects.length === 0) return

  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  // Generate each SVG object individually for token efficiency
  for (let i = 0; i < plan.svgObjects.length; i++) {
    const objSpec = plan.svgObjects[i]

    try {
      // Generate SVG at the canvas dimensions so it uses the full coordinate space.
      // SVGs are vector — there's no quality cost to generating at larger sizes.
      const objWidth = objSpec.width || dims.w
      const objHeight = objSpec.height || dims.h

      const response = await generateSVGObjects({
        prompt: `A single ${objSpec.prompt} icon/symbol. Simple, flat design, centered in frame. No background, just the object itself.`,
        width: objWidth,
        height: objHeight,
      })

      if (!response.objects || response.objects.length === 0) {
        logger.warn(`[Orchestrator:svg-objects] No objects returned for "${objSpec.prompt}", skipping`)
        continue
      }

      // Calculate frame range
      const startFrame = Math.round((objSpec.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((objSpec.endPercent ?? 1) * ctx.totalFrames)

      // Convert plan keyframes (% positions) to pixel-based keyframes
      const convertedKeyframes = (objSpec.keyframes || [{ time: 0 }]).map((kf) => ({
        time: kf.time,
        x: kf.x !== undefined ? (kf.x / 100) * dims.w : undefined,
        y: kf.y !== undefined ? (kf.y / 100) * dims.h : undefined,
        scaleX: kf.scale,
        scaleY: kf.scale,
        opacity: kf.opacity,
        rotation: kf.rotation,
        easing: 'ease-in-out' as const,
      }))

      // Get or create the SVG object composition
      const store = useSVGObjectStore.getState()
      const existing = store.composition

      const newObj = {
        id: `svg-obj-${Date.now()}-${i}`,
        name: objSpec.prompt,
        zIndex: 10 + i, // Above background, below characters
        visible: true,
        colors: { ...response.objects[0].defaultColors },
        defaultColors: response.objects[0].defaultColors,
        svgMarkup: response.objects[0].svgMarkup,
        keyframes: convertedKeyframes.length > 0 ? convertedKeyframes : [{ time: 0 }],
        startFrame,
        endFrame,
        opacity: 1,
      }

      if (existing) {
        // Add to existing composition
        store.setComposition({
          ...existing,
          objects: [...existing.objects, newObj],
        })
      } else {
        // Create new composition
        store.setComposition({
          id: `svg-comp-${Date.now()}`,
          prompt: 'Orchestrated SVG objects',
          background: 'transparent',
          width: dims.w,
          height: dims.h,
          objects: [newObj],
        })
      }

      // Track SVG object generation cost (Gemini 2.5 Pro)
      if (ctx.addCostEntry) {
        const inputCost = response.tokenUsage ? (response.tokenUsage.promptTokenCount / 1_000_000) * GEMINI_PRO_INPUT_PRICE : 0
        const outputCost = response.tokenUsage ? (response.tokenUsage.candidatesTokenCount / 1_000_000) * GEMINI_PRO_OUTPUT_PRICE : 0
        ctx.addCostEntry({
          source: 'gemini',
          label: `SVG: ${objSpec.prompt.slice(0, 30)}`,
          cost: inputCost + outputCost,
          credits: CREDIT_COSTS['svg-object'],
          tokenUsage: response.tokenUsage,
        })
      }

    } catch (err) {
      logger.error(`[Orchestrator:svg-objects] Failed to generate "${objSpec.prompt}":`, err)
    }
  }
}
