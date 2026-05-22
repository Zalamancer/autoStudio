/**
 * Step Executor: Generate Voices (ElevenLabs TTS)
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { GeneratedVoice } from '@/types/voice'
import { toast } from '@/stores/useToastStore'
import { getElevenLabsService, hasElevenLabsService } from '@/services/elevenlabs'
import { LipSyncProcessor } from '@/services/lipSync'
import { CaptionProcessor } from '@/services/captions'
import { buildEmotionTimeline } from '@/services/emotionTimeline'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { CREDIT_COSTS } from '@/types/credits'
import { logger } from '@/utils/logger'
import { translateDialogue, type LanguageCode } from '@/services/translationService'
import { ELEVENLABS_COST_PER_CHAR, type ExecutionContext } from '../constants'

export async function executeGenerateVoices(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  // ── Check if ElevenLabs is available ──
  if (!hasElevenLabsService()) {
    logger.warn('[Orchestrator:voices] ElevenLabs not configured — skipping. Dialogue will be text-only.')
    toast.warning('ElevenLabs not configured — dialogue will be text-only')
    return
  }

  let service: ReturnType<typeof getElevenLabsService>
  try {
    service = getElevenLabsService()
  } catch {
    logger.warn('[Orchestrator:voices] ElevenLabs service unavailable — skipping.')
    return
  }

  // Ensure voice list is available for voice name lookups
  let voices = useVoiceStore.getState().availableVoices
  if (voices.length === 0) {
    try {
      await useVoiceStore.getState().fetchVoices()
      voices = useVoiceStore.getState().availableVoices
    } catch {
      logger.warn('[Orchestrator:voices] Could not fetch voices — will use voice IDs from context')
    }
  }

  if (voices.length === 0 && ctx.voiceIdMap.size === 0) {
    logger.warn('[Orchestrator:voices] No voices available — skipping. Dialogue will be text-only.')
    return
  }

  // ── Auto-translate dialogue if plan.language is set (non-English) ──
  const targetLang = plan.language
  let translatedScripts: Map<number, string> | null = null

  if (targetLang && targetLang !== 'en') {
    try {
      logger.log(`[Orchestrator:voices] Translating dialogue to ${targetLang}`)
      const linesForTranslation = plan.dialogue.map((l) => ({
        characterName: l.characterName,
        script: l.script,
      }))
      const results = await translateDialogue(linesForTranslation, targetLang as LanguageCode)
      translatedScripts = new Map()
      for (let i = 0; i < results.length; i++) {
        translatedScripts.set(i, results[i].translatedScript)
      }
      logger.log(`[Orchestrator:voices] Successfully translated ${results.length} lines`)
    } catch (err) {
      logger.warn('[Orchestrator:voices] Translation failed, using original scripts:', err)
    }
  }

  // Store translated scripts on context so setupDialogue can persist them
  if (translatedScripts) {
    ctx.translatedScripts = translatedScripts
  }

  // ── Generate each line directly via ElevenLabs service (no store updates during generation) ──
  const lipSyncProcessor = new LipSyncProcessor(ctx.fps)
  const captionProcessor = new CaptionProcessor(ctx.fps)
  const collectedVoices: (GeneratedVoice | null)[] = []
  let successCount = 0

  for (let i = 0; i < plan.dialogue.length; i++) {
    const line = plan.dialogue[i]
    // Use translated script if available, otherwise original
    const scriptToSpeak = translatedScripts?.get(i) || line.script
    const cleanScript = scriptToSpeak.replace(/\[[\w-]+\]/g, '').replace(/\s+/g, ' ').trim()

    if (!cleanScript) {
      logger.warn(`[Orchestrator:voices] Line ${i + 1} — empty script after cleaning, skipping`)
      collectedVoices.push(null)
      continue
    }

    // Resolve voice ID for this line
    let voiceId = ctx.voiceIdMap.get(line.characterName)
    if (!voiceId && voices.length > 0) {
      // Fallback: round-robin assignment
      const charIndex = [...ctx.characterIdMap.keys()].indexOf(line.characterName)
      voiceId = voices[Math.max(0, charIndex) % voices.length].voice_id
    }
    if (!voiceId) {
      logger.warn(`[Orchestrator:voices] Line ${i + 1} — no voice ID available, skipping`)
      collectedVoices.push(null)
      continue
    }

    const voiceName = voices.find((v) => v.voice_id === voiceId)?.name || 'Unknown'

    try {
      // Call ElevenLabs directly — no store involvement, no re-renders
      const VOICE_TIMEOUT_MS = 30_000
      const apiResult = await Promise.race([
        service.generateWithAlignment(cleanScript, voiceId),
        new Promise<null>((resolve) =>
          setTimeout(() => {
            logger.warn(`[Orchestrator:voices] Line ${i + 1} — timed out after ${VOICE_TIMEOUT_MS / 1000}s`)
            resolve(null)
          }, VOICE_TIMEOUT_MS),
        ),
      ])

      if (!apiResult) {
        logger.warn(`[Orchestrator:voices] Line ${i + 1} — timed out or returned null`)
        collectedVoices.push(null)
        continue
      }

      // Process alignment data locally (no store)
      const visemeTimeline = lipSyncProcessor.processAlignment(apiResult.alignment)
      const wordTimeline = captionProcessor.extractWords(cleanScript, apiResult.alignment)

      const generatedVoice: GeneratedVoice = {
        id: `voice_${Date.now()}_${i}`,
        script: line.script,
        voiceId: voiceId,
        voiceName,
        audioUrl: apiResult.audioUrl,
        audioDuration: apiResult.duration,
        alignment: apiResult.alignment,
        visemeTimeline,
        wordTimeline,
        createdAt: Date.now(),
      }

      collectedVoices.push(generatedVoice)
      successCount++

      // Track ElevenLabs cost for this voice line
      if (ctx.addCostEntry) {
        const charCount = cleanScript.length
        ctx.addCostEntry({
          source: 'elevenlabs',
          label: `Voice: ${line.characterName} (#${i + 1})`,
          cost: charCount * ELEVENLABS_COST_PER_CHAR,
          credits: CREDIT_COSTS['elevenlabs-tts'],
          characters: charCount,
        })
      }

    } catch (err) {
      logger.warn(`[Orchestrator:voices] Line ${i + 1} — error:`, err)
      collectedVoices.push(null)
    }

    // Yield to browser between API calls
    await new Promise((r) => setTimeout(r, 50))
  }

  // ── Batch-push only valid generated voices to context ──
  for (const voice of collectedVoices) {
    if (voice !== null) {
      ctx.generatedVoices.push(voice)
    }
  }

  // ── Single batch update to the voice store (ONE set() call = ONE re-render) ──
  if (successCount > 0) {
    const validVoices = collectedVoices.filter((v): v is GeneratedVoice => v !== null)
    const lastVoice = validVoices[validVoices.length - 1]

    try {
      // Build emotion timeline for the last voice (for active display)
      const emotionTimeline = buildEmotionTimeline(lastVoice.script, lastVoice.wordTimeline)
      const sentenceTimeline = captionProcessor.groupIntoSentences(
        lastVoice.script.replace(/\[[\w-]+\]/g, '').replace(/\s+/g, ' ').trim(),
        lastVoice.wordTimeline,
      )

      // Use plain object merge — safe regardless of immer middleware
      const existingVoices = useVoiceStore.getState().generatedVoices
      useVoiceStore.setState({
        generatedVoices: [...existingVoices, ...validVoices],
        activeVoiceId: lastVoice.id,
        activeVisemeTimeline: lastVoice.visemeTimeline,
        activeWordTimeline: lastVoice.wordTimeline,
        activeSentenceTimeline: sentenceTimeline,
        activeEmotionTimeline: emotionTimeline,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      logger.warn('[Orchestrator:voices] Failed to batch-push to store:', err)
    }
  }

  if (successCount === 0) {
    logger.warn('[Orchestrator:voices] No voices generated — dialogue will be text-only')
    toast.warning('No voices generated — dialogue will be text-only')
  }
}
