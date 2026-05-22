/**
 * Step Executor: Setup Camera
 *
 * Reads camera settings from the ClipPlan and applies them
 * to useCameraStore — presets, custom keyframes, or camera directives.
 */

import type { ClipPlan, CameraDirectiveType } from '@/types/orchestrator'
import { useCameraStore, CAMERA_PRESETS, type CameraKeyframe } from '@/stores/useCameraStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

/** Resolve a character target to panX/panY offset (-50 to 50 range) */
function resolveTargetPan(target?: string): { panX: number; panY: number } {
  if (!target || target === 'center') return { panX: 0, panY: 0 }

  const chars = useMultiCharacterStore.getState().characters
  const match = chars.find((c) => c.name.toLowerCase() === target.toLowerCase())
  if (!match) return { panX: 0, panY: 0 }

  // Convert character position (0-100% based) to panX/panY (-50 to 50)
  return {
    panX: (match.position.x / 100) * 100 - 50,
    panY: (match.position.y / 100) * 100 - 50,
  }
}

/** Get zoom for a directive type */
function zoomForType(type: CameraDirectiveType, intensity: number): number {
  switch (type) {
    case 'close-up': return 1.5 + intensity * 0.5
    case 'medium-shot': return 1.2 + intensity * 0.2
    case 'wide-shot': return 1.0
    case 'zoom-in':
    case 'dolly-in': return 1.0 + intensity * 0.8
    case 'zoom-out':
    case 'dolly-out': return 1.4 + intensity * 0.4
    case 'ken-burns': return 1.0 + intensity * 0.25
    default: return 1.0
  }
}

function toEasing(e?: string): CameraKeyframe['easing'] {
  if (e === 'ease-in' || e === 'ease-out' || e === 'ease-in-out' || e === 'linear') return e
  return 'ease-in-out'
}

export async function executeSetupCamera(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const store = useCameraStore.getState()
  const totalFrames = ctx.totalFrames

  // Use dialogue bounds so camera keyframes align with actual audio
  const audioStart = ctx.dialogueStartFrame ?? 0
  const audioEnd = ctx.dialogueEndFrame ?? totalFrames
  const audioSpan = Math.max(1, audioEnd - audioStart)

  // Option 1: camera presets or custom keyframes
  if (plan.camera) {
    if (plan.camera.presetId) {
      const preset = CAMERA_PRESETS.find((p) => p.id === plan.camera!.presetId)
      if (preset) {
        // Build preset keyframes anchored to audio range instead of 0 → totalFrames
        const rawKfs = preset.buildKeyframes(audioSpan)
        const shiftedKfs = rawKfs.map((kf) => ({
          ...kf,
          frame: kf.frame + audioStart,
        }))
        store.setKeyframes(shiftedKfs)
        store.setEnabled(true)
        logger.info(`[Orchestrator:camera] Applied preset: ${plan.camera.presetId} (frames ${audioStart}–${audioEnd})`)
        return
      }
    }

    if (plan.camera.keyframes && plan.camera.keyframes.length > 0) {
      const kfs: CameraKeyframe[] = plan.camera.keyframes.map((kf) => ({
        frame: Math.round((kf.timePercent ?? 0) * audioSpan) + audioStart,
        zoom: kf.zoom ?? 1,
        panX: kf.panX ?? 0,
        panY: kf.panY ?? 0,
        rotation: kf.rotation ?? 0,
        easing: toEasing(kf.easing),
      }))
      store.setKeyframes(kfs)
      store.setEnabled(true)
      logger.info(`[Orchestrator:camera] Set ${kfs.length} custom camera keyframes (frames ${audioStart}–${audioEnd})`)
      return
    }
  }

  // Option 2: camera directives (converted to keyframes)
  if (plan.cameraDirectives && plan.cameraDirectives.length > 0) {
    const keyframes: CameraKeyframe[] = [
      { frame: audioStart, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'ease-in-out' },
    ]

    for (const d of plan.cameraDirectives) {
      const startFrame = Math.round((d.startPercent ?? 0) * audioSpan) + audioStart
      const endFrame = Math.round((d.endPercent ?? 1) * audioSpan) + audioStart
      const intensity = d.intensity ?? 0.5
      const easing = toEasing(d.easing)
      const { panX: targetPanX, panY: targetPanY } = resolveTargetPan(d.target)

      switch (d.type) {
        case 'close-up':
        case 'medium-shot': {
          const zoom = zoomForType(d.type, intensity)
          keyframes.push({ frame: startFrame, zoom, panX: targetPanX, panY: targetPanY, rotation: 0, easing })
          keyframes.push({ frame: endFrame, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'ease-out' })
          break
        }
        case 'wide-shot':
          keyframes.push({ frame: startFrame, zoom: 1, panX: 0, panY: 0, rotation: 0, easing })
          break
        case 'zoom-in':
        case 'dolly-in': {
          keyframes.push({ frame: startFrame, zoom: 1, panX: 0, panY: 0, rotation: 0, easing })
          keyframes.push({ frame: endFrame, zoom: zoomForType(d.type, intensity), panX: targetPanX, panY: targetPanY, rotation: 0, easing })
          break
        }
        case 'zoom-out':
        case 'dolly-out': {
          const startZoom = zoomForType(d.type, intensity)
          keyframes.push({ frame: startFrame, zoom: startZoom, panX: targetPanX, panY: targetPanY, rotation: 0, easing })
          keyframes.push({ frame: endFrame, zoom: 1, panX: 0, panY: 0, rotation: 0, easing })
          break
        }
        case 'pan-left':
          keyframes.push({ frame: startFrame, zoom: 1.1, panX: 0, panY: 0, rotation: 0, easing })
          keyframes.push({ frame: endFrame, zoom: 1.1, panX: -intensity * 25, panY: 0, rotation: 0, easing })
          break
        case 'pan-right':
          keyframes.push({ frame: startFrame, zoom: 1.1, panX: 0, panY: 0, rotation: 0, easing })
          keyframes.push({ frame: endFrame, zoom: 1.1, panX: intensity * 25, panY: 0, rotation: 0, easing })
          break
        case 'pan-up':
          keyframes.push({ frame: startFrame, zoom: 1.1, panX: 0, panY: 0, rotation: 0, easing })
          keyframes.push({ frame: endFrame, zoom: 1.1, panX: 0, panY: -intensity * 20, rotation: 0, easing })
          break
        case 'pan-down':
          keyframes.push({ frame: startFrame, zoom: 1.1, panX: 0, panY: 0, rotation: 0, easing })
          keyframes.push({ frame: endFrame, zoom: 1.1, panX: 0, panY: intensity * 20, rotation: 0, easing })
          break
        case 'shake':
          // Rapid small oscillations
          for (let f = startFrame; f < endFrame; f += 3) {
            const shake = intensity * 2 * (Math.random() - 0.5)
            keyframes.push({ frame: f, zoom: 1, panX: shake, panY: shake * 0.7, rotation: shake * 0.3, easing: 'linear' })
          }
          keyframes.push({ frame: endFrame, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'ease-out' })
          break
        case 'ken-burns': {
          const endZoom = zoomForType('ken-burns', intensity)
          keyframes.push({ frame: startFrame, zoom: 1, panX: -intensity * 5, panY: -intensity * 3, rotation: 0, easing: 'linear' })
          keyframes.push({ frame: endFrame, zoom: endZoom, panX: intensity * 5, panY: intensity * 3, rotation: 0, easing: 'linear' })
          break
        }
      }
    }

    // Sort and deduplicate
    keyframes.sort((a, b) => a.frame - b.frame)
    const dedupedMap = new Map<number, CameraKeyframe>()
    for (const kf of keyframes) {
      dedupedMap.set(kf.frame, kf)
    }
    const deduped = Array.from(dedupedMap.values()).sort((a, b) => a.frame - b.frame)

    store.setKeyframes(deduped)
    store.setEnabled(true)
    logger.info(`[Orchestrator:camera] Converted ${plan.cameraDirectives.length} directives to ${deduped.length} keyframes`)
  }
}
