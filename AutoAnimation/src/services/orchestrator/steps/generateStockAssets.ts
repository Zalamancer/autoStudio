/**
 * Step Executor: Generate Stock Assets
 *
 * When the orchestrator plan includes stockAssets, this step:
 * 1. Searches existing marketplace stock assets for matching items
 * 2. Generates missing ones via the grid-based AI pipeline
 * 3. Places them on canvas with timing and animation keyframes
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { StockAsset } from '@/types/stockAssets'
import { searchStockAssets, generateStockAssets } from '@/services/stockAssetService'
import { useMediaStore } from '@/stores/useMediaStore'
import { logger } from '@/utils/logger'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'

/**
 * Try to find an existing stock asset matching a prompt.
 * Returns the best match or null.
 */
async function findExistingAsset(prompt: string): Promise<StockAsset | null> {
  try {
    const { assets } = await searchStockAssets(prompt, 5)
    if (assets.length === 0) return null

    // Find best match — prefer exact title match, then partial
    const lower = prompt.toLowerCase()
    const exact = assets.find((a) => a.name.toLowerCase() === lower)
    if (exact) return exact

    // Return first result (sorted by use_count, so most popular)
    return assets[0]
  } catch {
    return null
  }
}

export async function executeGenerateStockAssets(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  if (!plan.stockAssets || plan.stockAssets.length === 0) return

  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  // Phase 1: Search for existing assets, collect missing ones
  const resolved: Array<{ asset: StockAsset; planIndex: number }> = []
  const missing: Array<{ prompt: string; planIndex: number }> = []

  for (let i = 0; i < plan.stockAssets.length; i++) {
    const spec = plan.stockAssets[i]
    const existing = await findExistingAsset(spec.prompt)

    if (existing) {
      logger.info(`[Orchestrator:stock-assets] Found existing asset for "${spec.prompt}": ${existing.id}`)
      resolved.push({ asset: existing, planIndex: i })
    } else {
      missing.push({ prompt: spec.prompt, planIndex: i })
    }
  }

  // Phase 2: Generate missing assets in a single batch
  if (missing.length > 0) {
    logger.info(`[Orchestrator:stock-assets] Generating ${missing.length} missing assets`)

    try {
      const response = await generateStockAssets({
        category: 'props',
        style: plan.stockAssets[0]?.style || 'flat',
        items: missing.map((m) => m.prompt),
        publishToMarketplace: true,
      })

      for (let i = 0; i < response.assets.length; i++) {
        resolved.push({
          asset: response.assets[i],
          planIndex: missing[i].planIndex,
        })
      }
    } catch (err) {
      logger.error('[Orchestrator:stock-assets] Batch generation failed:', err)
      // Non-fatal — continue with whatever we have
    }
  }

  // Phase 3: Place resolved assets on canvas
  const mediaStore = useMediaStore.getState()

  for (const { asset, planIndex } of resolved) {
    const spec = plan.stockAssets![planIndex]

    try {
      // Download the asset image
      const useVector = spec.format === 'vector' && asset.vectorUrl
      const assetUrl = useVector ? asset.vectorUrl : asset.rasterUrl

      const response = await fetch(assetUrl)
      const blob = await response.blob()

      // Add to media store
      const mediaAsset = {
        id: `stock-${asset.id}`,
        name: asset.name,
        type: useVector ? 'image/svg+xml' : 'image/png',
        size: blob.size,
        category: 'images' as const,
        url: '', // Will be set by addAsset
        width: asset.width,
        height: asset.height,
        addedAt: Date.now(),
      }

      mediaStore.addAsset(mediaAsset, blob)

      // Calculate frame range
      const startFrame = Math.round((spec.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((spec.endPercent ?? 1) * ctx.totalFrames)

      // Place on canvas with position and timing
      mediaStore.addToCanvasWithTiming(
        mediaAsset.id,
        startFrame,
        endFrame,
        spec.role === 'foreground' ? 'overlay' : spec.role === 'overlay' ? 'overlay' : 'cutaway',
        'fade',
      )

      // Apply position and scale
      const canvasItems = useMediaStore.getState().canvasItems
      const placedItem = canvasItems.find((item: { assetId: string }) => item.assetId === mediaAsset.id)
      if (placedItem) {
        const posX = spec.position ? (spec.position.x / 100) * dims.w : dims.w / 2
        const posY = spec.position ? (spec.position.y / 100) * dims.h : dims.h / 2

        mediaStore.updateCanvasItem(placedItem.id, {
          position: { x: posX, y: posY },
          scale: spec.scale ?? 0.3,
        })
      }

      logger.info(`[Orchestrator:stock-assets] Placed "${asset.name}" on canvas (frames ${startFrame}-${endFrame})`)
    } catch (err) {
      logger.error(`[Orchestrator:stock-assets] Failed to place "${asset.name}":`, err)
    }
  }

  // Track cost
  if (ctx.addCostEntry && missing.length > 0) {
    ctx.addCostEntry({
      source: 'gemini', // fal.ai costs tracked as AI generation
      label: `Stock Assets: ${missing.length} generated`,
      cost: missing.length * 0.01, // Approximate fal.ai cost per image
      credits: missing.length * 2, // 2 credits per generated asset
    })
  }
}
