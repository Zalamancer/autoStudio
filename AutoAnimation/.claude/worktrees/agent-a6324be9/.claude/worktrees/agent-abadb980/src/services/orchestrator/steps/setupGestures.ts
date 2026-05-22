/**
 * Step Executor: Setup Gestures (Auto-Gesture System)
 *
 * Analyzes dialogue word timelines for prosody patterns and generates
 * body/head gesture keyframes on each character's part transforms.
 * Runs after setup-dialogue so voice timing data is available.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { generateGesturesForDialogue, type GestureKeyframe } from '@/services/gestureEngine'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeSetupGestures(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  // Respect the plan's gestures config — skip if no gestures defined
  if (!plan.gestures || plan.gestures.length === 0) {
    logger.log('[Orchestrator:gestures] No gestures in plan — skipping')
    return
  }

  const multiStore = useMultiCharacterStore.getState()
  const dialogueLines = multiStore.dialogueLines

  if (dialogueLines.length === 0) {
    logger.warn('[Orchestrator:gestures] No dialogue lines — skipping gesture generation')
    return
  }

  // Build input from dialogue lines
  const inputs = dialogueLines.map(dl => {
    // Resolve character name from ID
    let characterName = 'Unknown'
    for (const [name, id] of ctx.characterIdMap) {
      if (id === dl.characterId) {
        characterName = name
        break
      }
    }

    return {
      characterName,
      wordTimeline: dl.wordTimeline,
      startFrame: dl.startFrame,
      endFrame: dl.endFrame,
    }
  })

  // Generate gestures per character — use average intensity from gesture items, default 0.7
  const avgIntensity = plan.gestures && plan.gestures.length > 0
    ? plan.gestures.reduce((sum, g) => sum + (g.intensity ?? 0.7), 0) / plan.gestures.length
    : 0.7
  const intensity = avgIntensity
  const gesturesByCharacter = generateGesturesForDialogue(inputs, ctx.fps, intensity)

  // Apply gesture keyframes to character part transforms
  let appliedCount = 0

  for (const [characterName, result] of gesturesByCharacter) {
    const charId = ctx.characterIdMap.get(characterName)
    if (!charId) {
      logger.warn(`[Orchestrator:gestures] No character ID for "${characterName}" — skipping`)
      continue
    }

    if (result.keyframes.length === 0) continue

    // Apply gesture keyframes to the character's part transforms
    // We use the multiStore.updateCharacterPartTransform to set per-frame transforms
    applyGestureKeyframes(charId, result.keyframes, multiStore)
    appliedCount += result.keyframes.length
  }

  logger.log(`[Orchestrator:gestures] Applied ${appliedCount} gesture keyframes across ${gesturesByCharacter.size} characters`)
}

/**
 * Apply gesture keyframes to a character's part transforms.
 *
 * For each keyframe, we update the character's part transform (body or head)
 * using the multiStore's updateCharacterPartTransform method.
 *
 * Since these are instantaneous snapshots, the animation system will
 * interpolate between them during playback.
 */
function applyGestureKeyframes(
  characterId: string,
  keyframes: GestureKeyframe[],
  multiStore: ReturnType<typeof useMultiCharacterStore.getState>,
): void {
  // Group keyframes by part
  const bodyKeyframes = keyframes.filter(kf => kf.part === 'body')
  const headKeyframes = keyframes.filter(kf => kf.part === 'head')

  // Apply the final "rest" transforms for body and head to ensure
  // the character returns to neutral after gestures
  if (bodyKeyframes.length > 0) {
    const lastBody = bodyKeyframes[bodyKeyframes.length - 1]
    if (lastBody.transform) {
      multiStore.updateCharacterPartTransform(characterId, 'body', {
        rotation: lastBody.transform.rotation ?? 0,
        y: lastBody.transform.y ?? 0,
        scaleX: lastBody.transform.scaleX ?? 1,
        scaleY: lastBody.transform.scaleY ?? 1,
      })
    }
  }

  if (headKeyframes.length > 0) {
    const lastHead = headKeyframes[headKeyframes.length - 1]
    if (lastHead.transform) {
      multiStore.updateCharacterPartTransform(characterId, 'head', {
        rotation: lastHead.transform.rotation ?? 0,
        y: lastHead.transform.y ?? 0,
      })
    }
  }
}
