/**
 * Orchestrator step: sync-to-beat
 *
 * Aligns visual elements (stock media transitions, text entrances,
 * shapes, camera zooms) to detected music beat timestamps.
 * Runs after generate-music and after other visual steps.
 */

import type { ClipPlan, BeatSyncConfig } from '@/types/orchestrator'
import type { ExecutionContext } from '../constants'
import { snapToNearestBeat, generatePulseKeyframes, beatsToFrames } from '@/services/beatSync'
import type { BeatAnalysis } from '@/services/beatDetection'
import { logger } from '@/utils/logger'

const DEFAULT_CONFIG: BeatSyncConfig = {
  enabled: true,
  intensity: 0.5,
  syncMediaTransitions: true,
  syncCameraZoom: true,
  syncTextOverlays: true,
  syncShapeEffects: true,
  subdivision: 1,
}

/**
 * Filter beat frames by subdivision (every Nth beat).
 */
function applySubdivision(beatFrames: number[], subdivision: number): number[] {
  if (subdivision <= 1) return beatFrames
  return beatFrames.filter((_, i) => i % subdivision === 0)
}

export async function executeSyncToBeat(
  _plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const config: BeatSyncConfig = { ...DEFAULT_CONFIG, ...ctx.settings?.beatSync }

  if (config.enabled === false) {
    logger.info('[Orchestrator:beat-sync] Beat sync disabled in settings, skipping')
    return
  }

  const beats = ctx.beatTimestamps
  if (!beats || beats.length === 0) {
    logger.info('[Orchestrator:beat-sync] No beat timestamps available, skipping')
    return
  }

  // Build a minimal BeatAnalysis for utility functions
  const analysis: BeatAnalysis = {
    bpm: beats.length > 1 ? 60 / (beats[1] - beats[0]) : 120,
    beats,
    onsets: beats,
    segments: [],
    duration: ctx.totalFrames / ctx.fps,
  }

  const allBeatFrames = beatsToFrames(analysis, ctx.fps)
  const beatFrames = applySubdivision(allBeatFrames, config.subdivision ?? 1)

  let snappedItems = 0
  let keyframesAdded = 0

  // ── Snap media transitions to beats ──
  if (config.syncMediaTransitions) {
    try {
      const { useMediaStore } = await import('@/stores/useMediaStore')
      const mediaStore = useMediaStore.getState()
      for (const item of mediaStore.canvasItems) {
        const newStart = snapToNearestBeat(item.startFrame, beatFrames, 15)
        const newEnd = snapToNearestBeat(item.endFrame, beatFrames, 15)
        if (newStart !== item.startFrame || newEnd !== item.endFrame) {
          mediaStore.updateCanvasItem(item.id, {
            startFrame: newStart,
            endFrame: newEnd,
          })
          snappedItems++
        }
      }
    } catch (err) {
      logger.warn('[Orchestrator:beat-sync] Media sync failed:', err)
    }
  }

  // ── Snap text overlay entrances to beats ──
  if (config.syncTextOverlays) {
    try {
      const { useTextOverlayStore } = await import('@/stores/useTextOverlayStore')
      const store = useTextOverlayStore.getState()
      for (const overlay of store.overlays) {
        const start = overlay.startFrame ?? 0
        const end = overlay.endFrame ?? 0
        const newStart = snapToNearestBeat(start, beatFrames, 15)
        const newEnd = snapToNearestBeat(end, beatFrames, 15)
        if (newStart !== start || newEnd !== end) {
          store.updateOverlay(overlay.id, {
            startFrame: newStart,
            endFrame: newEnd,
          })
          snappedItems++
        }
      }
    } catch (err) {
      logger.warn('[Orchestrator:beat-sync] Text sync failed:', err)
    }
  }

  // ── Add beat pulse keyframes to shapes ──
  if (config.syncShapeEffects) {
    try {
      const { useShapeStore } = await import('@/stores/useShapeStore')
      const { useKeyframeStore } = await import('@/stores/useKeyframeStore')
      const shapeStore = useShapeStore.getState()
      const kfStore = useKeyframeStore.getState()

      const pulseIntensity = (config.intensity ?? 0.5) * 0.1 // Scale: 0-0.1 range

      for (const shape of shapeStore.shapes) {
        // Snap start/end to beats
        const newStart = snapToNearestBeat(shape.startFrame, beatFrames, 15)
        const newEnd = snapToNearestBeat(shape.endFrame, beatFrames, 15)
        if (newStart !== shape.startFrame || newEnd !== shape.endFrame) {
          shapeStore.updateShape(shape.id, {
            startFrame: newStart,
            endFrame: newEnd,
          })
          snappedItems++
        }

        // Add pulse keyframes
        const pulses = generatePulseKeyframes(
          beatFrames,
          shape.startFrame,
          shape.endFrame,
          { pulseIntensity, pulseDurationFrames: 4 },
        )
        for (const pulse of pulses) {
          const ref = { objectType: 'shape' as const, objectId: shape.id }
          kfStore.setKeyframe(ref, 'scaleX', pulse.frame, pulse.scaleX)
          kfStore.setKeyframe(ref, 'scaleY', pulse.frame, pulse.scaleY)
          keyframesAdded += 2
        }
      }
    } catch (err) {
      logger.warn('[Orchestrator:beat-sync] Shape sync failed:', err)
    }
  }

  // ── Camera zoom sync to beats ──
  if (config.syncCameraZoom) {
    try {
      const { useCameraStore } = await import('@/stores/useCameraStore')
      const cameraStore = useCameraStore.getState()
      cameraStore.syncToBeats(beats, ctx.fps)
      keyframesAdded += beatFrames.length
    } catch (err) {
      logger.warn('[Orchestrator:beat-sync] Camera sync failed:', err)
    }
  }

  logger.info(
    `[Orchestrator:beat-sync] Synced ${snappedItems} items to beats, added ${keyframesAdded} keyframes ` +
    `(subdivision: ${config.subdivision}, intensity: ${config.intensity})`,
  )
}
