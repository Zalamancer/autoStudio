/**
 * Step Executor: Setup Character Motion
 *
 * Creates position/scale/rotation keyframes from plan's motionKeyframes on characters,
 * and assigns per-dialogue-line rig animation segments based on animationName.
 * Runs after setup-dialogue and setup-gestures so frame ranges and rig data are available.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useRigStore } from '@/stores/useRigStore'
import { logger } from '@/utils/logger'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'

export async function executeSetupCharacterMotion(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  let motionKeyframeCount = 0
  let animSegmentCount = 0

  // ── Part A: Motion keyframes (position/scale/rotation) from plan ──
  for (const planChar of plan.characters) {
    if (!planChar.motionKeyframes || planChar.motionKeyframes.length === 0) continue

    const charId = ctx.characterIdMap.get(planChar.name)
    if (!charId) continue

    const objRef = { objectType: 'dialogueCharacter' as const, objectId: charId }
    const kfStore = useKeyframeStore.getState()

    for (const kf of planChar.motionKeyframes) {
      const frame = Math.round(kf.timePercent * ctx.totalFrames)
      const pixelX = Math.round((kf.position.x / 100) * dims.w)
      const pixelY = Math.round((kf.position.y / 100) * dims.h)

      kfStore.setKeyframe(objRef, 'position.x', frame, pixelX)
      kfStore.setKeyframe(objRef, 'position.y', frame, pixelY)

      if (kf.scale !== undefined) {
        kfStore.setKeyframe(objRef, 'scale', frame, kf.scale)
      }
      if (kf.rotation !== undefined) {
        kfStore.setKeyframe(objRef, 'rotation', frame, kf.rotation)
      }

      motionKeyframeCount++
    }
  }

  // ── Part B: Per-dialogue-line animation assignment ──
  const multiStore = useMultiCharacterStore.getState()
  const dialogueLines = multiStore.dialogueLines
  const rigState = useRigStore.getState()

  for (let i = 0; i < plan.dialogue.length; i++) {
    const planLine = plan.dialogue[i]
    if (!planLine.animationName) continue

    const charId = ctx.characterIdMap.get(planLine.characterName)
    if (!charId) continue

    const animList = ctx.rigAnimationMap.get(planLine.characterName)
    if (!animList || animList.length === 0) continue

    // Find the matching animation by name (case-insensitive fuzzy)
    const animEntry = animList.find(
      (a) => a.name.toLowerCase() === planLine.animationName!.toLowerCase(),
    ) || animList.find(
      (a) => a.name.toLowerCase().includes(planLine.animationName!.toLowerCase()) ||
             planLine.animationName!.toLowerCase().includes(a.name.toLowerCase()),
    )
    if (!animEntry) {
      logger.warn(`[Orchestrator:motion] Animation "${planLine.animationName}" not found for "${planLine.characterName}" — available: ${animList.map((a) => a.name).join(', ')}`)
      continue
    }

    // Find the matching dialogue line in the store (by order index)
    const dialogueLine = dialogueLines[i]
    if (!dialogueLine || dialogueLine.characterId !== charId) continue

    // Select this animation's pose track for the character at this frame range
    const poseTracks = rigState.poseTracks.filter((t) => t.characterId === charId)
    const targetTrack = poseTracks[animEntry.index]
    if (targetTrack) {
      useRigStore.getState().selectCharacterPoseTrack(charId, targetTrack.id)
      animSegmentCount++
    }

    logger.log(`[Orchestrator:motion] Line ${i} "${planLine.characterName}": animation "${animEntry.name}" (idx ${animEntry.index}) for frames ${dialogueLine.startFrame}-${dialogueLine.endFrame}`)
  }

  // ── Part C: Auto-select default animation for characters without per-line assignments ──
  for (const planChar of plan.characters) {
    if (planChar.dimension === '3d') continue
    const charId = ctx.characterIdMap.get(planChar.name)
    if (!charId) continue

    const animList = ctx.rigAnimationMap.get(planChar.name)
    if (!animList || animList.length === 0) continue

    const defaultAnimName = planChar.defaultAnimation
    if (defaultAnimName) {
      const animEntry = animList.find(
        (a) => a.name.toLowerCase() === defaultAnimName.toLowerCase(),
      ) || animList.find(
        (a) => a.name.toLowerCase().includes(defaultAnimName.toLowerCase()),
      )
      if (animEntry) {
        const poseTracks = useRigStore.getState().poseTracks.filter((t) => t.characterId === charId)
        const targetTrack = poseTracks[animEntry.index]
        if (targetTrack) {
          useRigStore.getState().selectCharacterPoseTrack(charId, targetTrack.id)
          logger.log(`[Orchestrator:motion] Default animation "${animEntry.name}" selected for "${planChar.name}"`)
        }
      }
    }
  }

  logger.log(`[Orchestrator:motion] Created ${motionKeyframeCount} motion keyframes, ${animSegmentCount} animation segments`)
}
