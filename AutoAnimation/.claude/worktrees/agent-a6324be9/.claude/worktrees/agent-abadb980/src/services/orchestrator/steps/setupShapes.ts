/**
 * Step Executor: Setup Shapes
 *
 * Uses composition engine for safe-zone-aware positioning and
 * negative space detection to avoid overlapping existing elements.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useShapeStore } from '@/stores/useShapeStore'
import { logger } from '@/utils/logger'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'
import {
  clampToSafeZone,
  findBestNegativeSpace,
  type TargetPlatform,
} from '@/services/compositionEngine'
import { useBrandKitStore } from '@/stores/useBrandKitStore'

export async function executeSetupShapes(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const platform = (ctx.settings?.targetPlatform || 'generic') as TargetPlatform
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']
  const brandKit = useBrandKitStore.getState().getActiveBrandKit()

  // Track placed shapes for negative space calculation
  const placedElements: Array<{ position: { x: number; y: number }; widthPercent: number; heightPercent: number }> = []

  for (let i = 0; i < plan.shapes.length; i++) {
    const shape = plan.shapes[i]
    try {
      // Validate shape type
      const validTypes = ['rectangle', 'circle', 'triangle', 'star']
      if (!validTypes.includes(shape.type)) {
        logger.warn(`[Orchestrator:shapes] Invalid shape type "${shape.type}" — skipping`)
        continue
      }

      // Snapshot shape count before adding
      const beforeCount = useShapeStore.getState().shapes.length

      // addShape auto-creates with defaults, then we update
      useShapeStore.getState().addShape(shape.type as 'rectangle' | 'circle' | 'triangle' | 'star')

      // Find the newly added shape by comparing before/after
      const afterShapes = useShapeStore.getState().shapes
      const added = afterShapes.length > beforeCount ? afterShapes[afterShapes.length - 1] : null
      if (!added) continue

      const startFrame = Math.round((shape.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((shape.endPercent ?? 1) * ctx.totalFrames)

      // Compute position: use negative space finder when no explicit position, otherwise safe-zone clamp
      const shapeW = shape.width || 200
      const shapeH = shape.height || 200
      const widthPercent = (shapeW / dims.w) * 100
      const heightPercent = (shapeH / dims.h) * 100

      let finalPos: { x: number; y: number }
      if (shape.position && (shape.position.x !== 100 || shape.position.y !== 100)) {
        // Explicit position from plan — convert to percentage and clamp to safe zone
        const posPercent = {
          x: (shape.position.x / dims.w) * 100,
          y: (shape.position.y / dims.h) * 100,
        }
        const safePos = clampToSafeZone(posPercent, platform)
        finalPos = {
          x: (safePos.x / 100) * dims.w,
          y: (safePos.y / 100) * dims.h,
        }
      } else {
        // No meaningful position — find best negative space
        const bestPos = findBestNegativeSpace(
          { widthPercent, heightPercent },
          placedElements,
          platform,
        )
        finalPos = {
          x: (bestPos.x / 100) * dims.w,
          y: (bestPos.y / 100) * dims.h,
        }
      }

      // Track this placement for future negative space calculations
      placedElements.push({
        position: { x: (finalPos.x / dims.w) * 100, y: (finalPos.y / dims.h) * 100 },
        widthPercent,
        heightPercent,
      })

      // Apply brand kit colors if active
      const brandFill = brandKit?.shapeDefaults?.fillColor || brandKit?.accentColor
      const brandStroke = brandKit?.shapeDefaults?.strokeColor

      useShapeStore.getState().updateShape(added.id, {
        position: finalPos,
        width: shapeW,
        height: shapeH,
        fill: shape.fill || brandFill || '#3b82f6',
        stroke: brandStroke || 'transparent',
        opacity: shape.opacity ?? 1,
        startFrame,
        endFrame,
      })

    } catch (err) {
      logger.error(`[Orchestrator:shapes] Failed to add shape ${i + 1}:`, err)
    }
  }
}
