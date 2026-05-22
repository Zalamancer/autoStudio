/**
 * Step Executor: Quality Gate
 *
 * After orchestration completes, populates useViralityStore with the
 * final virality score so the completion phase shows live data.
 *
 * This step never blocks clip completion -- it always succeeds.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeQualityGate(
  _plan: ClipPlan,
  _ctx: ExecutionContext,
): Promise<void> {
  // Populate useViralityStore with the final score so completion phase shows live data
  try {
    const { useViralityStore } = await import('@/stores/useViralityStore')
    const { scoreClipVirality, extractClipMetadata } = await import('@/services/viralityScorer')
    const metadata = extractClipMetadata()
    const viralScore = await scoreClipVirality(metadata, '')
    viralScore.timestamp = Date.now()
    useViralityStore.getState().setCurrentScore(viralScore)
    logger.log(`[Orchestrator:quality-gate] Virality score: ${viralScore.overall}/100`)
  } catch (viralErr) {
    logger.warn('[Orchestrator:quality-gate] Virality scoring failed (non-fatal):', viralErr)
  }
}
