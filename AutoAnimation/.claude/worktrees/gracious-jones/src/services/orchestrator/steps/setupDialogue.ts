/**
 * Step Executor: Setup Dialogue
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { VisemeEvent, WordEvent } from '@/types/voice'
import type { DialogueEmotion } from '@/stores/useMultiCharacterStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { CaptionProcessor } from '@/services/captions'
import { buildEmotionTimeline } from '@/services/emotionTimeline'
import { snapFrameToBeat } from '@/services/musicAnalyzer'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeSetupDialogue(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const multiStore = useMultiCharacterStore.getState()

  // Small gap between lines (in frames)
  const GAP_FRAMES = Math.round(ctx.fps * 0.3) // 300ms gap

  // Estimated speaking rate: ~5 words per second (used when no voice data)
  const WORDS_PER_SECOND = 5

  let currentFrame = 0

  for (let i = 0; i < plan.dialogue.length; i++) {
    const line = plan.dialogue[i]
    const voice = ctx.generatedVoices[i]

    const charId = ctx.characterIdMap.get(line.characterName)
    if (!charId) {
      logger.warn(`[Orchestrator:dialogue] Line ${i + 1}: no character ID for "${line.characterName}" — skipping`)
      continue
    }

    let durationFrames: number
    let voiceId: string | null = null
    let visemeTimeline: VisemeEvent[] = []
    let wordTimeline: WordEvent[] = []

    if (voice) {
      // Use actual voice data
      durationFrames = Math.round(voice.audioDuration * ctx.fps)
      voiceId = voice.id
      visemeTimeline = voice.visemeTimeline as VisemeEvent[]
      wordTimeline = voice.wordTimeline as WordEvent[]
    } else {
      // Estimate duration from word count (~5 words/sec)
      const cleanScript = line.script.replace(/\[[\w-]+\]/g, '').trim()
      const wordCount = cleanScript.split(/\s+/).length
      const estimatedSeconds = Math.max(1, wordCount / WORDS_PER_SECOND)
      durationFrames = Math.round(estimatedSeconds * ctx.fps)
    }

    // Snap line start to nearest beat when available — especially on emotion changes
    if (ctx.beatTimestamps && ctx.beatTimestamps.length > 0 && i > 0) {
      const prevEmotion = plan.dialogue[i - 1]?.emotion || 'Auto'
      const currEmotion = line.emotion || 'Auto'
      // Use tighter tolerance (0.15s) for emotion changes, normal (0.2s) otherwise
      const tolerance = prevEmotion !== currEmotion ? 0.15 : 0.2
      currentFrame = snapFrameToBeat(currentFrame, ctx.fps, ctx.beatTimestamps, tolerance)
    }

    const endFrame = currentFrame + durationFrames

    try {
      // Store translated script + original when language is set
      const translatedScript = ctx.translatedScripts?.get(i)
      multiStore.addDialogueLine({
        characterId: charId,
        script: translatedScript || line.script,
        originalScript: translatedScript ? line.script : undefined,
        generatedVoiceId: voiceId,
        startFrame: currentFrame,
        endFrame,
        order: i,
        visemeTimeline,
        wordTimeline,
        emotion: (line.emotion as DialogueEmotion) || 'Auto',
      })
    } catch (err) {
      logger.error(`[Orchestrator:dialogue] addDialogueLine threw for line ${i + 1}:`, err)
    }

    currentFrame = endFrame + GAP_FRAMES

    // Yield to browser between dialogue lines to prevent UI freeze
    await new Promise((r) => setTimeout(r, 10))
  }

  // Record dialogue frame bounds so camera setup can anchor to actual audio
  const allLines = useMultiCharacterStore.getState().dialogueLines
  if (allLines.length > 0) {
    ctx.dialogueStartFrame = allLines[0].startFrame
    ctx.dialogueEndFrame = allLines[allLines.length - 1].endFrame
  }

  // Update totalFrames to match actual dialogue duration
  ctx.totalFrames = Math.max(ctx.totalFrames, currentFrame)

  // Immediately push to timeline store so subsequent steps and playback use the correct duration
  useTimelineStore.getState().setTotalFrames(ctx.totalFrames)

  // ── Build combined timelines with global frame offsets for voice store ──
  // The voice store's activeVisemeTimeline/activeWordTimeline need to use global
  // frame positions so that CharacterComposite (single-char) and CaptionOverlay
  // can look up data at the global currentFrame.
  const allDialogueLines = useMultiCharacterStore.getState().dialogueLines
  if (allDialogueLines.length > 0) {
    const combinedVisemes: VisemeEvent[] = []
    const combinedWords: WordEvent[] = []

    for (const dl of allDialogueLines) {
      const offset = dl.startFrame
      const timeOffset = offset / ctx.fps

      // Offset each viseme event to global timeline position
      for (const v of dl.visemeTimeline) {
        combinedVisemes.push({
          viseme: v.viseme,
          startFrame: v.startFrame + offset,
          endFrame: v.endFrame + offset,
          startTime: v.startTime + timeOffset,
          endTime: v.endTime + timeOffset,
        })
      }

      // Offset each word event to global timeline position
      for (const w of dl.wordTimeline) {
        combinedWords.push({
          word: w.word,
          startFrame: w.startFrame + offset,
          endFrame: w.endFrame + offset,
          startTime: w.startTime + timeOffset,
          endTime: w.endTime + timeOffset,
        })
      }
    }

    // Sort by startFrame for correct lookup order
    combinedVisemes.sort((a, b) => a.startFrame - b.startFrame)
    combinedWords.sort((a, b) => a.startFrame - b.startFrame)

    // Build combined sentence + emotion timelines from the offset word events
    const combinedCleanScript = allDialogueLines
      .map((dl) => dl.script.replace(/\[[\w-]+\]/g, '').replace(/\s+/g, ' ').trim())
      .join('. ')

    const captionProcessor = new CaptionProcessor(ctx.fps)
    const combinedSentences = captionProcessor.groupIntoSentences(combinedCleanScript, combinedWords)

    // Build emotion timeline: concatenate from each line's script + offset word timelines
    const combinedRawScript = allDialogueLines.map((dl) => dl.script).join(' ')
    const combinedEmotionTimeline = buildEmotionTimeline(combinedRawScript, combinedWords)

    // Push combined timelines to voice store so CaptionOverlay and CharacterComposite work
    const existingActiveVoiceId = useVoiceStore.getState().activeVoiceId
    if (existingActiveVoiceId) {
      useVoiceStore.setState({
        activeVisemeTimeline: combinedVisemes,
        activeWordTimeline: combinedWords,
        activeSentenceTimeline: combinedSentences,
        activeEmotionTimeline: combinedEmotionTimeline,
      })
    }
  }
}
