/**
 * Step Executor: Setup Auto Camera
 *
 * Analyzes dialogue timing, emotion changes, and beat timestamps
 * to auto-generate cinematic camera keyframes. Only runs when the
 * Gemini plan did NOT include explicit camera directives.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useCameraStore } from '@/stores/useCameraStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { buildEmotionTimeline } from '@/services/emotionTimeline'
import { generateAutoCameraKeyframes } from '@/services/autoCameraDirector'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeSetupAutoCamera(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const cameraStore = useCameraStore.getState()

  // Skip if camera already has keyframes (from explicit directives or presets)
  if (cameraStore.enabled && cameraStore.keyframes.length > 0) {
    logger.info('[Orchestrator:autoCamera] Skipping — camera already configured')
    return
  }

  // Need generated voices with word timelines to analyze
  if (ctx.generatedVoices.length === 0) {
    logger.info('[Orchestrator:autoCamera] Skipping — no generated voices available')
    return
  }

  // Build dialogue line info from the store (global frame positions)
  // instead of raw voice data (which has local 0-based frames per clip)
  const characters = useMultiCharacterStore.getState().characters
  const storeDialogueLines = useMultiCharacterStore.getState().dialogueLines
  const dialogueLines = storeDialogueLines.map((dl) => {
    const matchedChar = characters.find((c) => c.id === dl.characterId)
    return {
      characterName: matchedChar?.name || 'Narrator',
      startFrame: dl.startFrame,
      endFrame: dl.endFrame,
      wordTimeline: (dl.wordTimeline ?? []) as import('@/types/voice').WordEvent[],
      characterPositionX: matchedChar?.position?.x,
    }
  })

  // Build emotion timeline from all dialogue scripts
  const allEmotionEvents = ctx.generatedVoices.flatMap((voice, idx) => {
    const planLine = plan.dialogue[idx]
    if (!planLine?.script || !voice.wordTimeline?.length) return []
    return buildEmotionTimeline(planLine.script, voice.wordTimeline)
  })

  // Use dialogue end frame (not total planned duration) so camera
  // keyframes align with actual audio rather than extending past it
  const effectiveTotalFrames = ctx.dialogueEndFrame ?? ctx.totalFrames

  // Generate camera keyframes
  const keyframes = generateAutoCameraKeyframes(
    dialogueLines,
    allEmotionEvents,
    ctx.beatTimestamps,
    {
      fps: ctx.fps,
      totalFrames: effectiveTotalFrames,
    },
  )

  if (keyframes.length <= 2) {
    logger.info('[Orchestrator:autoCamera] Not enough data for meaningful camera moves')
    return
  }

  cameraStore.setKeyframes(keyframes)
  cameraStore.setEnabled(true)
  logger.info(
    `[Orchestrator:autoCamera] Generated ${keyframes.length} auto-camera keyframes from dialogue analysis`,
  )
}
