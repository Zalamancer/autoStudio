/**
 * Step Executor: Generate Music
 *
 * Tries advanced music generation service (Suno/dedicated) first,
 * falls back to ElevenLabs Music API if unavailable.
 * If dialogue exists, builds a composition plan that matches mood/pacing.
 * Integrates with sound design presets for style-appropriate music.
 */

import type { ClipPlan } from '@/types/orchestrator'
import { generateMusic } from '@/services/elevenlabs'
import {
  generateMusicAdvanced,
  isMusicGenerationAvailable,
} from '@/services/musicGeneration'
import { buildMusicPlanFromDialogue, buildMusicPromptFromDialogue } from '@/services/musicAnalyzer'
import { detectBeatsFromUrl } from '@/services/beatDetection'
import { enhanceMusicPrompt, getSoundDesignPreset } from '@/services/soundDesigner'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useMediaStore, type MediaAsset } from '@/stores/useMediaStore'
import { useAudioDesignStore } from '@/stores/useAudioDesignStore'
import { CREDIT_COSTS } from '@/types/credits'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeGenerateMusic(
  _plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const dialogueLines = useMultiCharacterStore.getState().dialogueLines
  const durationSeconds = Math.round(ctx.totalFrames / ctx.fps)
  const activePresetId = useAudioDesignStore.getState().activePresetId
  const activePreset = activePresetId ? getSoundDesignPreset(activePresetId) : null

  let audioBlob: Blob
  let musicName: string

  // Try advanced music generation service (Suno etc.) first
  const advancedAvailable = await isMusicGenerationAvailable().catch(() => false)

  if (advancedAvailable) {
    try {
      logger.log('[Orchestrator:music] Using advanced music generation service')

      let moodPrompt = dialogueLines.length > 0
        ? buildMusicPromptFromDialogue(dialogueLines, ctx.fps)
        : 'cinematic, ambient, gentle'

      // Enhance prompt with sound design preset if active
      if (activePreset) {
        moodPrompt = enhanceMusicPrompt(moodPrompt, activePreset)
        logger.log(`[Orchestrator:music] Applied "${activePreset.name}" sound design preset`)
      }

      const result = await generateMusicAdvanced({
        prompt: moodPrompt,
        genre: 'cinematic',
        mood: 'neutral',
        durationSeconds,
        instrumental: true,
      })

      audioBlob = result.audioBlob
      musicName = result.title || `AI Music (${result.provider}, ${durationSeconds}s)`
      logger.log(`[Orchestrator:music] Advanced generation complete via ${result.provider}`)
    } catch (err) {
      logger.warn('[Orchestrator:music] Advanced service failed, falling back to ElevenLabs:', err)
      // Fall through to ElevenLabs
      const fallbackResult = await generateElevenLabsMusic(dialogueLines, ctx, durationSeconds, activePreset)
      audioBlob = fallbackResult.audioBlob
      musicName = fallbackResult.musicName
    }
  } else {
    // Use ElevenLabs directly
    const result = await generateElevenLabsMusic(dialogueLines, ctx, durationSeconds, activePreset)
    audioBlob = result.audioBlob
    musicName = result.musicName
  }

  // Run beat detection on the generated audio for beat-matched auto-cut
  try {
    const blobUrlForBeats = URL.createObjectURL(audioBlob)
    const beatAnalysis = await detectBeatsFromUrl(blobUrlForBeats)
    URL.revokeObjectURL(blobUrlForBeats)

    ctx.beatTimestamps = beatAnalysis.beats
    // Store full analysis in audio design store for other systems
    useAudioDesignStore.getState().setBeatAnalysis(beatAnalysis)

    logger.info(
      `[Orchestrator:music] Beat detection: ${beatAnalysis.bpm} BPM, ` +
      `${beatAnalysis.beats.length} beats, ${beatAnalysis.onsets.length} onsets`
    )
  } catch (err) {
    logger.warn('[Orchestrator:music] Beat detection failed, continuing without beat alignment:', err)
  }

  // Store in useMediaStore so AudioLayer plays it during timeline playback
  const mediaStore = useMediaStore.getState()
  const assetId = `media-music-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const blobUrl = URL.createObjectURL(audioBlob)

  // Get duration from the blob
  let duration = 0
  try {
    const audio = new Audio()
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000)
      audio.addEventListener('loadedmetadata', () => { clearTimeout(timeout); resolve() }, { once: true })
      audio.addEventListener('canplaythrough', () => { clearTimeout(timeout); resolve() }, { once: true })
      audio.addEventListener('error', () => { clearTimeout(timeout); resolve() }, { once: true })
      audio.src = blobUrl
      audio.load()
    })
    duration = audio.duration || 0
  } catch {
    // Duration will default to 0; AudioLayer still plays fine
  }

  const mediaAsset: MediaAsset = {
    id: assetId,
    name: musicName,
    type: audioBlob.type || 'audio/mpeg',
    size: audioBlob.size,
    category: 'audio',
    url: blobUrl,
    duration,
    addedAt: Date.now(),
  }

  // Persist to IndexedDB first (await it instead of fire-and-forget)
  const { saveMediaBlob } = await import('@/services/mediaDB')
  await saveMediaBlob(assetId, audioBlob)

  mediaStore.addAsset(mediaAsset, audioBlob)
  mediaStore.addToCanvas(assetId)

  // Track cost (music generation — estimate based on duration)
  ctx.addCostEntry?.({
    source: 'elevenlabs',
    label: 'Background Music Generation',
    cost: 0,
    credits: CREDIT_COSTS['elevenlabs-music'],
  })
}

/** ElevenLabs fallback — the original music generation path */
async function generateElevenLabsMusic(
  dialogueLines: ReturnType<typeof useMultiCharacterStore.getState>['dialogueLines'],
  ctx: ExecutionContext,
  durationSeconds: number,
  activePreset?: import('@/services/soundDesigner').SoundDesignPreset | null,
): Promise<{ audioBlob: Blob; musicName: string }> {
  if (dialogueLines.length > 0) {
    const compositionPlan = buildMusicPlanFromDialogue(dialogueLines, ctx.fps)

    // If a preset is active, inject its style modifiers into the composition plan
    if (activePreset) {
      compositionPlan.positive_global_styles = [
        ...new Set([...compositionPlan.positive_global_styles, ...activePreset.musicStyles.slice(0, 3)]),
      ]
      compositionPlan.negative_global_styles = [
        ...new Set([...compositionPlan.negative_global_styles, ...activePreset.musicNegativeStyles.slice(0, 2)]),
      ]
    }

    const result = await generateMusic({
      compositionPlan,
      forceInstrumental: true,
    })
    return {
      audioBlob: result.audioBlob,
      musicName: `AI Background Music (${dialogueLines.length} lines${activePreset ? `, ${activePreset.name}` : ''})`,
    }
  } else {
    const durationMs = Math.round(Math.max(3000, Math.min(600_000, durationSeconds * 1000)))
    let prompt = 'Cinematic instrumental background music, ambient, gentle, suitable for a short-form video. No vocals.'
    if (activePreset) {
      prompt = enhanceMusicPrompt(prompt, activePreset)
    }
    const result = await generateMusic({
      prompt,
      durationMs,
      forceInstrumental: true,
    })
    return {
      audioBlob: result.audioBlob,
      musicName: `AI Ambient Music (${Math.round(durationMs / 1000)}s${activePreset ? `, ${activePreset.name}` : ''})`,
    }
  }
}
