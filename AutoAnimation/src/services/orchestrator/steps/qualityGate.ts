/**
 * Step Executor: Quality Gate
 *
 * Runs the full QA system (visual, audio, content, platform compliance)
 * AND virality scoring. Stores results in the orchestrator store so the
 * completion phase can surface quality insights.
 *
 * Non-blocking: this step always succeeds to avoid interrupting clip
 * delivery, but quality issues are logged and surfaced in the UI.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeQualityGate(
  _plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  // ── 1. Run full QA checks ──
  try {
    const { extractQAInputFromStores, evaluateQualityGate, DEFAULT_QUALITY_GATE_CONFIG } = await import(
      '@/services/qualityAssurance/qualityGate'
    )

    const qaInput = extractQAInputFromStores()
    const config = {
      ...DEFAULT_QUALITY_GATE_CONFIG,
      // Use target platform from settings if available
      ...(ctx.settings?.targetPlatform ? {} : {}),
    }
    const gateResult = evaluateQualityGate(qaInput, config)
    const report = gateResult.report

    // Store QA report in orchestrator store for completion phase UI
    const { useOrchestratorStore } = await import('@/stores/useOrchestratorStore')
    useOrchestratorStore.setState({
      qaReport: {
        overallScore: report.overallScore,
        grade: report.grade,
        passed: gateResult.passed,
        blockers: report.blockers.length,
        warnings: report.allChecks.filter((c) => c.status === 'warning').length,
        improvements: report.improvements.slice(0, 5).map((imp) => ({
          description: imp.description,
          estimatedImpact: imp.estimatedImpact,
        })),
      },
    })

    // Log category breakdown
    for (const cat of report.categories) {
      if (cat.checks.length > 0) {
        logger.log(
          `[Orchestrator:quality-gate] ${cat.category}: ${cat.score}/100 (${cat.passed} passed, ${cat.failed} failed, ${cat.warnings} warnings)`,
        )
      }
    }

    logger.log(
      `[Orchestrator:quality-gate] QA Score: ${report.overallScore}/100 (${report.grade}) — ${gateResult.passed ? 'PASSED' : 'BELOW THRESHOLD'}`,
    )

    if (report.blockers.length > 0) {
      logger.warn(
        `[Orchestrator:quality-gate] ${report.blockers.length} blocker(s): ${report.blockers.map((b) => b.name).join(', ')}`,
      )
    }
  } catch (qaErr) {
    logger.warn('[Orchestrator:quality-gate] QA evaluation failed (non-fatal):', qaErr)
  }

  // ── 2. Run virality scoring ──
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
