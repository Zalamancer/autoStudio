/**
 * Step Executor: Setup Canvas
 *
 * Also pre-computes the composition layout (rule of thirds grid, safe zones,
 * character positions, color palette) so downstream steps can use it.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'
import {
  refineClipLayout,
  type AspectRatioKey,
  type TargetPlatform,
} from '@/services/compositionEngine'

export async function executeSetupCanvas(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']
  useCanvasStore.getState().setCanvasDimensions(dims.w, dims.h)
  // Sync editor aspect ratio selector so UI stays consistent
  useEditorStore.getState().setAspectRatio(plan.canvas.aspectRatio)
  useTimelineStore.getState().setFps(plan.canvas.fps)

  ctx.totalFrames = plan.canvas.fps * plan.canvas.durationSeconds
  ctx.fps = plan.canvas.fps

  useTimelineStore.getState().setTotalFrames(ctx.totalFrames)

  // Pre-compute composition layout for downstream steps
  const aspectRatio = (plan.canvas.aspectRatio || '16:9') as AspectRatioKey
  const platform = (ctx.settings?.targetPlatform || 'generic') as TargetPlatform
  const templateContext = plan.htmlTemplates?.[0]?.templateId || ''

  // Build brand profile from context if available
  let brandProfile: import('@/types/brandDirector').BrandProfile | undefined
  if (ctx.settings?.brandContext) {
    const bc = ctx.settings.brandContext
    brandProfile = {
      url: '',
      businessName: bc.businessName,
      industry: bc.industry,
      niche: '',
      targetAudience: [],
      products: [],
      brandValues: [],
      tone: bc.tone,
      primaryColors: bc.primaryColors,
      tagline: bc.tagline,
      description: '',
    }
  }

  ctx.compositionLayout = refineClipLayout(
    {
      aspectRatio,
      characterCount: plan.characters.length,
      templateContext,
      textOverlayCount: plan.textOverlays.length,
      stockMediaCount: plan.stockMedia?.length || 0,
      svgObjectCount: plan.svgObjects?.length || 0,
      shapeCount: plan.shapes.length,
    },
    { platform, brandProfile },
  )
}
