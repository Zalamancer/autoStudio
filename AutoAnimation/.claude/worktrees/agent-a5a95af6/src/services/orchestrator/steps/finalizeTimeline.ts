/**
 * Step Executor: Finalize Timeline
 *
 * Sets final timeline duration and rescales camera keyframes.
 * Quality gate scoring is handled by the dedicated 'quality-gate' step
 * that runs immediately after this one.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useCameraStore } from '@/stores/useCameraStore'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeFinalizeTimeline(
  _plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  try {
    // Ensure totalFrames covers all content
    useTimelineStore.getState().setTotalFrames(ctx.totalFrames)
    useTimelineStore.getState().seekToFrame(0)

    // Rescale camera keyframes to match the final timeline duration.
    // Camera setup may have run before dialogue was generated, using
    // the planned duration instead of the actual audio duration.
    const camStore = useCameraStore.getState()
    if (camStore.enabled && camStore.keyframes.length > 0) {
      const lastKfFrame = camStore.keyframes[camStore.keyframes.length - 1].frame
      if (lastKfFrame > ctx.totalFrames) {
        const scale = ctx.totalFrames / lastKfFrame
        const rescaled = camStore.keyframes.map((kf) => ({
          ...kf,
          frame: Math.round(kf.frame * scale),
        }))
        camStore.setKeyframes(rescaled)
        logger.info(`[Orchestrator:finalize] Rescaled ${rescaled.length} camera keyframes from ${lastKfFrame} to ${ctx.totalFrames} frames`)
      }
    }

    logger.log(`[Orchestrator:finalize] Timeline finalized: ${ctx.totalFrames} frames at ${ctx.fps}fps`)
  } catch (err) {
    logger.error('[Orchestrator:finalize] Failed:', err)
  }
}
