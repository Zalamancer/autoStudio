/**
 * Step Executor: Smart B-Roll -- Analyze dialogue for visual concepts
 * and auto-insert contextual cutaway stock media during gaps.
 *
 * Uses shared brollIntelligence for concept extraction and gap detection.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useMediaStore } from '@/stores/useMediaStore'
import { logger } from '@/utils/logger'
import { type ExecutionContext } from '../constants'
import { extractVisualConcepts, findDialogueGaps } from '@/services/brollIntelligence'
import { callPixabayProxy } from '@/services/aiProxy'

export async function executeSetupSmartBroll(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  const fps = ctx.fps || 30
  const totalFrames = ctx.totalFrames

  // Find gaps between dialogue lines (shared utility)
  const gaps = findDialogueGaps(fps, totalFrames)
  if (gaps.length === 0) {
    logger.log('[SmartBroll] No dialogue gaps found for B-roll insertion')
    return
  }

  // Extract visual concepts from dialogue (shared utility)
  const dialogueTexts = plan.dialogue.map((d) => d.script.replace(/\[[\w-]+\]/g, '').trim())
  const concepts = await extractVisualConcepts(dialogueTexts)

  // Match concepts to gaps (assign nearest non-null concept)
  let conceptIdx = 0
  const matchedGaps = gaps.map((gap) => {
    while (conceptIdx < concepts.length && concepts[conceptIdx] == null) {
      conceptIdx++
    }
    const query = concepts[conceptIdx] || 'abstract motion background'
    conceptIdx++
    return { ...gap, query }
  })

  if (matchedGaps.length === 0) return

  // Search Pixabay and insert media
  const mediaStore = useMediaStore.getState()
  let inserted = 0

  for (const gap of matchedGaps.slice(0, 5)) {
    try {
      const resp = await callPixabayProxy('images', {
        q: gap.query,
        per_page: '3',
        orientation: 'horizontal',
        image_type: 'photo',
      })
      const data = await resp.json()
      const hits = data?.hits || []
      if (hits.length === 0) continue

      const hit = hits[0]
      const assetId = `broll_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const imageUrl = hit.webformatURL || hit.largeImageURL

      // Fetch the image as a blob for addAsset (requires 2 args)
      const imgResp = await fetch(imageUrl)
      const imgBlob = await imgResp.blob()

      mediaStore.addAsset(
        {
          id: assetId,
          type: 'image/jpeg',
          url: imageUrl,
          width: hit.imageWidth,
          height: hit.imageHeight,
          name: `B-Roll: ${gap.query}`,
          size: imgBlob.size,
          category: 'images',
          addedAt: Date.now(),
        },
        imgBlob,
      )

      mediaStore.addToCanvas(assetId)
      const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === assetId)
      if (canvasItem) {
        mediaStore.updateCanvasItem(canvasItem.id, {
          startFrame: gap.startFrame,
          endFrame: gap.endFrame,
          position: { x: 0, y: 0 },
          scale: 1,
          zIndex: 4,
          opacity: 1,
          enterTransition: 'fade',
          exitTransition: 'fade',
          transitionFrames: Math.round(0.3 * fps),
        })
        inserted++
      }
    } catch (err) {
      logger.warn(`[SmartBroll] Failed to insert B-roll for "${gap.query}":`, err)
    }
  }

  logger.log(`[SmartBroll] Inserted ${inserted} contextual B-roll clips`)
}
