/**
 * Step Executor: Setup Stock Media (Pixabay)
 *
 * Enhanced with Stock Media Intelligence:
 * - Multi-query fallback search with concept expansion
 * - Relevance scoring for best result selection
 * - Automatic creative treatments (duotone, color grading, bg removal, etc.)
 * - Smart Ken Burns with subject detection
 * - Context-aware query enrichment via Gemini
 */

import type { ClipPlan, ClipPlanStockMedia } from '@/types/orchestrator'
import { getPixabayService, hasPixabayService } from '@/services/pixabay'
import type { PixabayImageHit, PixabayVideoHit } from '@/services/pixabay'
import { useMediaStore, type MediaAsset } from '@/stores/useMediaStore'
import { getGeminiService, hasGeminiService } from '@/services/gemini'
import {
  buildSearchStrategy,
  scoreImageHit,
  scoreVideoHit,
  suggestCreativeApproach,
  applyTreatmentPipeline,
  findBestSegment,
  findLoopPoint,
  generateSpeedRamp,
  DUOTONE_PRESETS,
  COLOR_GRADE_PRESETS,
  type MediaTreatmentPlan,
  type CreativeTreatment,
} from '@/services/stockMediaIntelligence'
import { logger } from '@/utils/logger'
import {
  ASPECT_RATIO_DIMENSIONS,
  ROLE_ZINDEX,
  ROLE_DEFAULT_SCALE,
  ROLE_DEFAULT_ENTER,
  ROLE_DEFAULT_EXIT,
  type ExecutionContext,
} from '../constants'
import {
  clampToSafeZone,
  type TargetPlatform,
} from '@/services/compositionEngine'

/**
 * Enrich stock media search queries by analyzing dialogue context via Gemini.
 * Replaces generic queries with contextually-specific ones for better B-roll matches.
 */
async function enrichStockMediaQueries(
  plan: ClipPlan,
): Promise<Map<number, string>> {
  const enriched = new Map<number, string>()
  if (!hasGeminiService() || !plan.dialogue || plan.dialogue.length === 0) return enriched
  if (!plan.stockMedia || plan.stockMedia.length === 0) return enriched

  const dialogueContext = plan.dialogue
    .map((d) => d.script.replace(/\[[\w-]+\]/g, '').trim())
    .join('\n')

  const mediaQueries = plan.stockMedia
    .map((m, i) => `${i}. role="${m.role}" query="${m.query}" (${m.startPercent.toFixed(2)}-${m.endPercent.toFixed(2)})`)
    .join('\n')

  const prompt = `Given this dialogue context and stock media queries, suggest more specific, contextually-relevant Pixabay search queries.
Return ONLY a JSON object mapping index to improved query. Only include entries where you can meaningfully improve the query.

Dialogue:
${dialogueContext}

Current media queries:
${mediaQueries}

Example output: {"0": "golden retriever park sunny", "2": "laptop screen closeup office"}`

  try {
    const service = getGeminiService()
    const response = await service.generateContent(prompt)
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>
      for (const [idx, query] of Object.entries(parsed)) {
        if (typeof query === 'string' && query.trim()) {
          enriched.set(Number(idx), query.trim())
        }
      }
    }
    logger.log(`[Orchestrator:stock-media] Enriched ${enriched.size} queries via Gemini`)
  } catch (err) {
    logger.warn('[Orchestrator:stock-media] Query enrichment failed (non-fatal):', err)
  }
  return enriched
}

/**
 * Search for images with fallback queries and scoring.
 */
async function searchImagesWithFallback(
  query: string,
  role: string,
  dims: { w: number; h: number },
): Promise<{ hit: PixabayImageHit; downloadUrl: string } | null> {
  const service = getPixabayService()
  const strategy = buildSearchStrategy(query, role, 'image')
  const targetAspect: 'horizontal' | 'vertical' | 'square' =
    dims.w > dims.h ? 'horizontal' : dims.w < dims.h ? 'vertical' : 'square'

  const defaultOrientation = (role === 'background' || role === 'cutaway')
    ? (dims.w >= dims.h ? 'horizontal' : 'vertical')
    : 'all'

  const allQueries = [strategy.primaryQuery, ...strategy.fallbackQueries]

  for (const q of allQueries) {
    try {
      const results = await service.searchImages({
        q,
        per_page: 10,
        image_type: strategy.imageType || 'photo',
        orientation: defaultOrientation as 'all' | 'horizontal' | 'vertical',
        min_width: strategy.minWidth,
        min_height: strategy.minHeight,
      })

      if (results.hits.length === 0) continue

      // Score and pick the best hit
      const scored = results.hits.map((hit) => ({
        hit,
        score: scoreImageHit(hit, targetAspect),
      }))
      scored.sort((a, b) => b.score - a.score)

      const best = scored[0].hit
      return {
        hit: best,
        downloadUrl: best.largeImageURL,
      }
    } catch (err) {
      logger.warn(`[Orchestrator:stock-media] Search failed for "${q}":`, err)
    }
  }

  return null
}

/**
 * Search for videos with fallback queries and scoring.
 */
async function searchVideosWithFallback(
  query: string,
  role: string,
  targetDurationSecs: number,
): Promise<{ hit: PixabayVideoHit; downloadUrl: string } | null> {
  const service = getPixabayService()
  const strategy = buildSearchStrategy(query, role, 'video')

  const allQueries = [strategy.primaryQuery, ...strategy.fallbackQueries]

  for (const q of allQueries) {
    try {
      const results = await service.searchVideos({
        q,
        per_page: 10,
      })

      if (results.hits.length === 0) continue

      // Score and pick the best hit
      const scored = results.hits.map((hit) => ({
        hit,
        score: scoreVideoHit(hit, targetDurationSecs),
      }))
      scored.sort((a, b) => b.score - a.score)

      const best = scored[0].hit
      const videoFile = best.videos.medium
      return {
        hit: best,
        downloadUrl: videoFile.url,
      }
    } catch (err) {
      logger.warn(`[Orchestrator:stock-media] Video search failed for "${q}":`, err)
    }
  }

  return null
}

/**
 * Resolve treatment plan from clip plan stock media item.
 */
function resolveTreatmentPlan(
  item: ClipPlanStockMedia,
): MediaTreatmentPlan {
  // If explicit treatment specified in the plan
  if (item.creativeTreatment) {
    const treatment = item.creativeTreatment as CreativeTreatment

    const plan: MediaTreatmentPlan = {
      treatment,
      addVignette: item.addVignette ?? false,
      blendMode: ((item.blendMode === 'normal' ? 'source-over' : item.blendMode) ?? 'source-over') as import('@/types/blendModes').BlendMode | 'normal',
    }

    // Resolve duotone preset
    if (treatment === 'duotone' && item.duotonePreset) {
      plan.duotone = DUOTONE_PRESETS[item.duotonePreset] ?? DUOTONE_PRESETS['midnight-gold']
    }

    // Resolve color grade preset
    if (treatment === 'color-grade' && item.colorGradePreset) {
      plan.colorGrade = COLOR_GRADE_PRESETS[item.colorGradePreset] ?? COLOR_GRADE_PRESETS['cinematic']
    }

    return plan
  }

  // Auto-suggest based on role and query
  const suggestion = suggestCreativeApproach(item.role || 'overlay', item.query, item.type)
  return suggestion.treatment
}

export async function executeSetupStockMedia(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.stockMedia || plan.stockMedia.length === 0) return
  if (!hasPixabayService()) {
    logger.warn('[Orchestrator:stock-media] Pixabay not configured, skipping stock media')
    return
  }

  const service = getPixabayService()
  const mediaStore = useMediaStore.getState()
  const totalFrames = ctx.totalFrames
  const fps = ctx.fps || 30
  const clipDuration = plan.canvas.durationSeconds || 15
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']
  const platform = (ctx.settings?.targetPlatform || 'generic') as TargetPlatform

  // Enrich queries with dialogue context for better semantic matching
  const enrichedQueries = await enrichStockMediaQueries(plan)

  for (let itemIndex = 0; itemIndex < plan.stockMedia.length; itemIndex++) {
    const item = { ...plan.stockMedia[itemIndex] }
    // Use enriched query if available
    const enrichedQuery = enrichedQueries.get(itemIndex)
    if (enrichedQuery) {
      logger.log(`[Orchestrator:stock-media] Enriched query: "${item.query}" -> "${enrichedQuery}"`)
      item.query = enrichedQuery
    }
    try {
      // Check if this is a brand image reference
      if (item.query.startsWith('brand:') && ctx.settings?.brandContext?.brandImageAssetIds) {
        const targetRole = item.query.replace('brand:', '').trim()
        const { brandImageAssetIds, brandImageRoles } = ctx.settings.brandContext
        const assetId = brandImageAssetIds.find((id) => brandImageRoles?.[id] === targetRole)
        if (assetId) {
          const asset = useMediaStore.getState().assets.find((a) => a.id === assetId)
          if (asset) {
            // Brand image already in media store — just add to canvas
            const role = item.role || 'overlay'
            mediaStore.addToCanvas(asset.id)
            const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === asset.id)
            if (canvasItem) {
              const startFrame = Math.round(item.startPercent * totalFrames)
              const endFrame = Math.round(item.endPercent * totalFrames)
              const finalScale = item.scale ?? ROLE_DEFAULT_SCALE[role] ?? 1
              const containerW = dims.w * finalScale
              const containerH = dims.h * finalScale
              let posX: number
              let posY: number
              if (role === 'background' || role === 'cutaway') {
                posX = (dims.w - containerW) / 2
                posY = (dims.h - containerH) / 2
              } else {
                // Clamp overlay/accent positions to platform safe zones
                const safePos = clampToSafeZone(item.position, platform)
                posX = (safePos.x / 100) * dims.w - containerW / 2
                posY = (safePos.y / 100) * dims.h - containerH / 2
              }
              const enterTransition = item.enterTransition || ROLE_DEFAULT_ENTER[role] || 'fade'
              const exitTransition = item.exitTransition || ROLE_DEFAULT_EXIT[role] || 'fade'
              const transitionDurationSecs = item.transitionDuration ?? 0.5
              const transitionFrames = Math.round(transitionDurationSecs * fps)
              const zIndex = item.zIndex ?? ROLE_ZINDEX[role] ?? 5
              mediaStore.updateCanvasItem(canvasItem.id, {
                position: { x: posX, y: posY },
                scale: finalScale,
                startFrame,
                endFrame,
                zIndex,
                enterTransition: enterTransition as import('@/stores/useMediaStore').MediaTransitionType,
                exitTransition: exitTransition as import('@/stores/useMediaStore').MediaTransitionType,
                transitionFrames,
              })
            }
            continue
          }
        }
        // Brand image not found — fall through to Pixabay search with cleaned query
        logger.warn(`[Orchestrator:stock-media] Brand image "${targetRole}" not found, skipping`)
        continue
      }

      const role = item.role || 'overlay'
      let downloadUrl: string | undefined
      let width = 0
      let height = 0
      let duration: number | undefined

      // ── Enhanced search with scoring and fallback ──
      if (item.type === 'image') {
        const result = await searchImagesWithFallback(item.query, role, dims)
        if (!result) {
          logger.warn(`[Orchestrator:stock-media] No image results for "${item.query}" (all fallbacks exhausted)`)
          continue
        }
        downloadUrl = result.downloadUrl
        width = result.hit.imageWidth
        height = result.hit.imageHeight
      } else {
        const targetDuration = (item.endPercent - item.startPercent) * clipDuration
        const result = await searchVideosWithFallback(item.query, role, targetDuration)
        if (!result) {
          logger.warn(`[Orchestrator:stock-media] No video results for "${item.query}" (all fallbacks exhausted)`)
          continue
        }
        downloadUrl = result.downloadUrl
        width = result.hit.videos.medium.width
        height = result.hit.videos.medium.height
        duration = result.hit.duration
      }

      if (!downloadUrl) {
        logger.warn(`[Orchestrator:stock-media] No download URL for "${item.query}"`)
        continue
      }

      // ── Smart video duration ──
      const effectiveStartPercent = item.startPercent
      let effectiveEndPercent = item.endPercent
      if (item.type === 'video' && duration && duration > 0) {
        const plannedDuration = (item.endPercent - item.startPercent) * clipDuration
        if (plannedDuration > duration) {
          effectiveEndPercent = item.startPercent + (duration / clipDuration)
        }
      }

      // ── Download and apply creative treatment ──
      let blob = await service.downloadAsBlob(downloadUrl)
      const treatmentPlan = resolveTreatmentPlan(item)
      let treatedUrl: string | null = null
      let kenBurnsConfig = treatmentPlan.kenBurns ?? null

      // Apply treatment pipeline for images (videos keep their original form)
      if (item.type === 'image' && treatmentPlan.treatment !== 'none') {
        try {
          const result = await applyTreatmentPipeline(blob, treatmentPlan)
          blob = result.blob
          treatedUrl = URL.createObjectURL(result.blob)
          if (result.kenBurns) {
            kenBurnsConfig = result.kenBurns
          }
          logger.log(`[Orchestrator:stock-media] Applied treatment "${treatmentPlan.treatment}" to "${item.query}"`)
        } catch (err) {
          logger.warn(`[Orchestrator:stock-media] Treatment failed for "${item.query}", using original:`, err)
        }
      }

      // ── Video Intelligence: trim, loop detection, speed ramp ──
      let videoTrimConfig: import('@/services/stockMediaIntelligence').VideoTrimConfig | undefined
      let videoLoopConfig: import('@/services/stockMediaIntelligence').LoopPointConfig | undefined
      let videoSpeedRamp: import('@/services/stockMediaIntelligence').SpeedRampConfig | undefined

      if (item.type === 'video' && duration && duration > 1) {
        const videoObjUrl = URL.createObjectURL(blob)
        const targetSegmentDuration = (item.endPercent - item.startPercent) * clipDuration

        try {
          // Find the most interesting segment if video is longer than needed
          if (duration > targetSegmentDuration + 1) {
            videoTrimConfig = await findBestSegment(videoObjUrl, targetSegmentDuration)
            treatmentPlan.videoTrim = videoTrimConfig
            logger.log(`[Orchestrator:stock-media] Video trim: ${videoTrimConfig.startTime.toFixed(1)}s-${videoTrimConfig.endTime.toFixed(1)}s for "${item.query}"`)
          }

          // Detect loop points for background videos
          if (role === 'background') {
            videoLoopConfig = await findLoopPoint(videoObjUrl)
            if (videoLoopConfig.similarity > 0.5) {
              logger.log(`[Orchestrator:stock-media] Loop point found (similarity=${videoLoopConfig.similarity.toFixed(2)}): ${videoLoopConfig.loopStart.toFixed(1)}s-${videoLoopConfig.loopEnd.toFixed(1)}s`)
            }
          }

          // Generate speed ramp for cutaway/accent videos
          if ((role === 'cutaway' || role === 'accent') && targetSegmentDuration > 1) {
            videoSpeedRamp = await generateSpeedRamp(videoObjUrl, targetSegmentDuration)
            treatmentPlan.speedRamp = videoSpeedRamp
            logger.log(`[Orchestrator:stock-media] Speed ramp: ${videoSpeedRamp.segments.length} segments for "${item.query}"`)
          }
        } catch (err) {
          logger.warn(`[Orchestrator:stock-media] Video intelligence failed for "${item.query}" (non-fatal):`, err)
        }

        URL.revokeObjectURL(videoObjUrl)
      }

      const url = treatedUrl || URL.createObjectURL(blob)

      const asset: MediaAsset = {
        id: `stock_${item.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: item.query,
        type: item.type === 'image' ? 'image/jpeg' : 'video/mp4',
        size: blob.size,
        category: item.type === 'image' ? 'images' : 'video',
        url,
        width,
        height,
        duration,
        addedAt: Date.now(),
      }

      mediaStore.addAsset(asset, blob)
      mediaStore.addToCanvas(asset.id)

      // Find the newly created canvas item and adjust timing, position, scale, transitions
      const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === asset.id)
      if (canvasItem) {
        const startFrame = Math.round(effectiveStartPercent * totalFrames)
        const endFrame = Math.round(effectiveEndPercent * totalFrames)

        const finalScale = item.scale ?? ROLE_DEFAULT_SCALE[role] ?? 1
        const containerW = dims.w * finalScale
        const containerH = dims.h * finalScale

        let posX: number
        let posY: number
        if (role === 'background' || role === 'cutaway') {
          posX = (dims.w - containerW) / 2
          posY = (dims.h - containerH) / 2
        } else {
          // Clamp overlay/accent positions to platform safe zones
          const safePos = clampToSafeZone(item.position, platform)
          posX = (safePos.x / 100) * dims.w - containerW / 2
          posY = (safePos.y / 100) * dims.h - containerH / 2
        }

        const enterTransition = item.enterTransition || ROLE_DEFAULT_ENTER[role] || 'fade'
        const exitTransition = item.exitTransition || ROLE_DEFAULT_EXIT[role] || 'fade'
        const transitionDurationSecs = item.transitionDuration ?? 0.5
        const transitionFrames = Math.round(transitionDurationSecs * fps)
        const zIndex = item.zIndex ?? ROLE_ZINDEX[role] ?? 5

        // Use ken-burns transition if subject-aware KB was generated
        const useKenBurns = kenBurnsConfig != null
        const effectiveEnterTransition = useKenBurns ? 'ken-burns' : enterTransition

        mediaStore.updateCanvasItem(canvasItem.id, {
          position: { x: posX, y: posY },
          scale: finalScale,
          startFrame,
          endFrame,
          zIndex,
          enterTransition: effectiveEnterTransition as import('@/stores/useMediaStore').MediaTransitionType,
          exitTransition: exitTransition as import('@/stores/useMediaStore').MediaTransitionType,
          transitionFrames,
          // Stock Media Intelligence fields
          creativeTreatment: (treatmentPlan.treatment || 'none') as string,
          duotoneConfig: treatmentPlan.duotone ? { dark: treatmentPlan.duotone.shadow, light: treatmentPlan.duotone.highlight } : null,
          colorGradeConfig: treatmentPlan.colorGrade as unknown as Record<string, unknown> ?? null,
          kenBurnsConfig: kenBurnsConfig as unknown as Record<string, unknown> ?? null,
          blendMode: ((treatmentPlan.blendMode === 'normal' ? 'source-over' : treatmentPlan.blendMode) ?? 'source-over') as string,
          treatedUrl,
          // Video intelligence fields
          ...(videoTrimConfig ? { videoTrim: { startTime: videoTrimConfig.startTime, endTime: videoTrimConfig.endTime } } : {}),
          ...(videoLoopConfig && videoLoopConfig.similarity > 0.5 ? { videoLoop: { similarity: videoLoopConfig.similarity } } : {}),
          ...(videoSpeedRamp ? { speedRamp: videoSpeedRamp as unknown as Record<string, unknown> } : {}),
        } as Partial<import('@/stores/useMediaStore').CanvasMediaItem>)
      }

      logger.log(`[Orchestrator:stock-media] Added "${item.query}" (${item.type}, role=${role}, treatment=${treatmentPlan.treatment}) to canvas`)
    } catch (err) {
      logger.warn(`[Orchestrator:stock-media] Failed to fetch "${item.query}":`, err)
      // Non-fatal — skip this asset and continue with others
    }
  }
}
