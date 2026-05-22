/**
 * Step Executor: Setup Sound Effects
 *
 * Generates and places sound effects for the clip. Integrates with the
 * sound designer to auto-generate SFX based on scene events and presets.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { hasElevenLabsService, generateSoundEffect } from '@/services/elevenlabs'
import { useMediaStore, type MediaAsset } from '@/stores/useMediaStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useAudioDesignStore } from '@/stores/useAudioDesignStore'
import {
  getSoundDesignPreset,
  detectSceneEvents,
  generateAutoSfx,
  generateTransitionAudio,
} from '@/services/soundDesigner'
import { saveMediaBlob } from '@/services/mediaDB'
import { CREDIT_COSTS } from '@/types/credits'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

/** Check if an SFX time range overlaps with any dialogue line */
function sfxOverlapsDialogue(startFrame: number, endFrame: number): boolean {
  const dialogueLines = useMultiCharacterStore.getState().dialogueLines
  for (const line of dialogueLines) {
    if (startFrame < line.endFrame && endFrame > line.startFrame) {
      return true
    }
  }
  return false
}

export async function executeSetupSoundEffects(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  const audioDesign = useAudioDesignStore.getState()
  const existingSfx = plan.soundEffects ?? []

  // Auto-generate SFX from scene events if auto-SFX is enabled and a preset is active
  let allSfx = [...existingSfx]
  if (audioDesign.autoSfxEnabled && audioDesign.activePresetId) {
    const preset = getSoundDesignPreset(audioDesign.activePresetId)
    if (preset) {
      const events = detectSceneEvents(plan, ctx.fps)
      const autoSfx = generateAutoSfx(events, preset, existingSfx)
      const transitionSfx = generateTransitionAudio(events, preset)

      // Add ambient bed if preset requests it
      if (preset.useAmbientBed && preset.ambientPrompt) {
        autoSfx.push({
          prompt: preset.ambientPrompt,
          source: 'generate',
          startPercent: 0,
          durationSeconds: Math.min(plan.canvas.durationSeconds, 22),
          volume: 0.15 * preset.sfxVolumeMultiplier,
        })
      }

      allSfx = [...allSfx, ...autoSfx, ...transitionSfx]
      logger.info(
        `[Orchestrator:sound-effects] Auto-generated ${autoSfx.length} SFX + ` +
          `${transitionSfx.length} transitions (preset: ${preset.name})`,
      )
    }
  }

  if (allSfx.length === 0) return

  const mediaStore = useMediaStore.getState()
  const totalFrames = ctx.totalFrames
  const fps = ctx.fps || 30

  // Stock-only fast mode: force every SFX onto the Freesound path, regardless of planner choice.
  const preferStockAudio = ctx.settings?.preferStockAudio === true

  for (const sfx of allSfx) {
    try {
      const source = preferStockAudio ? 'search' : sfx.source || 'generate'
      let audioBlob: Blob
      let name: string

      if (source === 'generate' && hasElevenLabsService()) {
        // Generate via ElevenLabs
        const result = await generateSoundEffect({
          text: sfx.prompt,
          durationSeconds: sfx.durationSeconds,
          promptInfluence: 0.3,
        })
        audioBlob = result.audioBlob
        name = `SFX: ${sfx.prompt}`

        // Track cost
        ctx.addCostEntry?.({
          source: 'elevenlabs',
          label: `SFX: ${sfx.prompt.slice(0, 30)}`,
          cost: 0,
          credits: CREDIT_COSTS['elevenlabs-sfx'],
          characters: sfx.prompt.length,
        })
      } else {
        // Fallback: try Freesound search
        const { getFreesoundService, hasFreesoundService } = await import('@/services/freesound')
        if (!hasFreesoundService()) {
          logger.warn('[Orchestrator:sound-effects] No SFX source available, skipping')
          continue
        }
        const service = getFreesoundService()
        const durationFilter = sfx.durationSeconds
          ? `duration:[0 TO ${Math.ceil(sfx.durationSeconds)}]`
          : 'duration:[0 TO 10]'
        const results = await service.search({
          query: sfx.prompt,
          pageSize: 3,
          filter: durationFilter,
        })
        if (results.results.length === 0) {
          logger.warn(`[Orchestrator:sound-effects] No results for "${sfx.prompt}"`)
          continue
        }
        const hit = results.results[0]
        audioBlob = await service.downloadAsBlob(hit.previews['preview-hq-mp3'])
        name = `SFX: ${hit.name}`
      }

      // Create media asset
      const assetId = `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const url = URL.createObjectURL(audioBlob)
      const asset: MediaAsset = {
        id: assetId,
        name,
        type: 'audio/mpeg',
        size: audioBlob.size,
        category: 'audio',
        url,
        addedAt: Date.now(),
      }

      // Persist to IndexedDB and add to store
      await saveMediaBlob(assetId, audioBlob)
      mediaStore.addAsset(asset, audioBlob)

      // Add to canvas with timing
      mediaStore.addToCanvas(assetId)
      const canvasItem = useMediaStore.getState().canvasItems.find((ci) => ci.assetId === assetId)
      if (canvasItem) {
        const startFrame = Math.round((sfx.startPercent ?? 0) * totalFrames)
        const durationFrames = sfx.durationSeconds ? Math.round(sfx.durationSeconds * fps) : Math.round(2 * fps) // default 2 seconds
        const endFrame = Math.min(startFrame + durationFrames, totalFrames)

        // Audio ducking: reduce volume when SFX overlaps dialogue
        let volume = sfx.volume ?? 0.7
        if (sfxOverlapsDialogue(startFrame, endFrame)) {
          volume = Math.min(volume, 0.3)
          logger.info(`[Orchestrator:sound-effects] Ducking "${sfx.prompt}" to ${volume} (overlaps dialogue)`)
        }

        mediaStore.updateCanvasItem(canvasItem.id, {
          startFrame,
          endFrame,
          volume,
        })
      }
    } catch (err) {
      logger.warn(`[Orchestrator:sound-effects] Failed to add "${sfx.prompt}":`, err)
      // Non-fatal — skip this SFX and continue with others
    }
  }
}
