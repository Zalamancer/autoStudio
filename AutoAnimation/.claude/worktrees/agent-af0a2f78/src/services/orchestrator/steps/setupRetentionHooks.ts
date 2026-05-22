/**
 * Step Executor: Setup Retention Hooks
 *
 * Reads retention hook definitions from the ClipPlan and
 * populates useRetentionHookStore with the configured hooks.
 */

import type { ClipPlan, ClipPlanRetentionHook } from '@/types/orchestrator'
import { useRetentionHookStore } from '@/stores/useRetentionHookStore'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

let hookCounter = 0

export async function executeSetupRetentionHooks(
  plan: ClipPlan,
  _ctx: ExecutionContext,
): Promise<void> {
  const hooks = plan.retentionHooks
  if (!hooks || hooks.length === 0) {
    logger.info('[Orchestrator:retentionHooks] No retention hooks in plan')
    return
  }

  const store = useRetentionHookStore.getState()

  const storeHooks = hooks.map((h: ClipPlanRetentionHook) => ({
    id: `rh-${++hookCounter}`,
    type: h.type,
    style: h.style,
    position: h.position,
    color: h.color || '#6366f1',
    countdownFrom: h.countdownFrom,
    chapters: h.chapters,
    triggerPercent: h.triggerPercent,
    text: h.text,
    totalSteps: h.totalSteps,
  }))

  store.setHooks(storeHooks)
  logger.info(
    `[Orchestrator:retentionHooks] Set ${storeHooks.length} retention hooks: ${storeHooks.map((h: { type: string }) => h.type).join(', ')}`,
  )
}
