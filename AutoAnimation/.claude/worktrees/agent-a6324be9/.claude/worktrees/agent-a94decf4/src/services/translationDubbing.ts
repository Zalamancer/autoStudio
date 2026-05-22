/**
 * Translation & Dubbing Pipeline
 *
 * Translates dialogue script → re-generates TTS in target language →
 * re-runs lip sync alignment → updates captions.
 *
 * Uses Gemini for translation and ElevenLabs multilingual TTS for dubbing.
 */

import type { DialogueLine } from '@/stores/useMultiCharacterStore'
import { GeminiService } from './gemini'
import { ElevenLabsService, type GenerateWithAlignmentResult } from './elevenlabs'
import { getLipSyncProcessor } from './lipSync'
import { logger } from '@/utils/logger'

// ── Types ──

export interface TranslationResult {
  /** ISO 639-1 language code */
  targetLanguage: string
  /** Translated dialogue lines (same order as input) */
  translatedLines: Array<{
    originalScript: string
    translatedScript: string
    /** Preserved emotion cue */
    emotion?: string
  }>
}

export interface DubbingResult {
  lineId: string
  /** New TTS audio */
  audio: GenerateWithAlignmentResult
  /** Updated viseme timeline */
  visemeTimeline: import('@/types/voice').VisemeEvent[]
  /** Updated word timeline */
  wordTimeline: import('@/types/voice').WordEvent[]
  /** Translated script text */
  translatedScript: string
  /** Original script preserved */
  originalScript: string
  /** Target language code */
  language: string
}

export interface DubbingProgress {
  phase: 'translating' | 'generating-voice' | 'syncing' | 'complete'
  currentLine: number
  totalLines: number
  percentage: number
}

// ── Supported Languages ──

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ru', name: 'Russian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'id', name: 'Indonesian' },
  { code: 'fil', name: 'Filipino' },
  { code: 'ta', name: 'Tamil' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'el', name: 'Greek' },
  { code: 'cs', name: 'Czech' },
  { code: 'fi', name: 'Finnish' },
  { code: 'hr', name: 'Croatian' },
  { code: 'ms', name: 'Malay' },
  { code: 'sk', name: 'Slovak' },
  { code: 'da', name: 'Danish' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ro', name: 'Romanian' },
] as const

// ── Translation via Gemini ──

/**
 * Translate an array of dialogue scripts to the target language using Gemini.
 * Preserves inline [emotion] cues without translating them.
 */
export async function translateDialogue(
  lines: Array<{ script: string; emotion?: string }>,
  targetLanguage: string,
  targetLanguageName: string,
): Promise<TranslationResult> {
  const gemini = new GeminiService('proxy')

  const prompt = `Translate the following dialogue lines to ${targetLanguageName} (${targetLanguage}).

Rules:
- Translate ONLY the spoken text. Do NOT translate emotion cues in square brackets like [happy], [sad], etc.
- Keep the translation natural and conversational, matching the tone of the original.
- Preserve the meaning and emotional intent.
- Return a JSON array of objects with "original" and "translated" fields.
- Return ONLY valid JSON, no markdown code fences.

Dialogue lines:
${lines.map((l, i) => `${i + 1}. "${l.script}"`).join('\n')}

Respond with JSON array like: [{"original": "...", "translated": "..."}]`

  const response = await gemini.generateContent(prompt)
  let parsed: Array<{ original: string; translated: string }>
  try {
    // Strip markdown fences if present
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    logger.error('[translationDubbing] Failed to parse translation response:', response)
    throw new Error('Failed to parse translation response from AI')
  }

  return {
    targetLanguage,
    translatedLines: lines.map((line, i) => ({
      originalScript: line.script,
      translatedScript: parsed[i]?.translated || line.script,
      emotion: line.emotion,
    })),
  }
}

// ── Full Dubbing Pipeline ──

/**
 * Translate and dub all dialogue lines.
 * Pipeline: translate → TTS → lip sync for each line.
 */
export async function translateAndDub(
  dialogueLines: DialogueLine[],
  voiceIdMap: Map<string, string>,
  targetLanguage: string,
  targetLanguageName: string,
  fps: number,
  onProgress?: (progress: DubbingProgress) => void,
): Promise<DubbingResult[]> {
  const total = dialogueLines.length
  if (total === 0) return []

  // Phase 1: Translate all lines at once
  onProgress?.({
    phase: 'translating',
    currentLine: 0,
    totalLines: total,
    percentage: 5,
  })

  const translation = await translateDialogue(
    dialogueLines.map((l) => ({ script: l.script, emotion: l.emotion })),
    targetLanguage,
    targetLanguageName,
  )

  // Phase 2: Generate TTS for each translated line
  const elevenlabs = new ElevenLabsService('proxy')
  const results: DubbingResult[] = []

  for (let i = 0; i < total; i++) {
    const line = dialogueLines[i]
    const translatedText = translation.translatedLines[i].translatedScript
    const voiceId = voiceIdMap.get(line.characterId)

    onProgress?.({
      phase: 'generating-voice',
      currentLine: i + 1,
      totalLines: total,
      percentage: 10 + Math.round((i / total) * 70),
    })

    if (!voiceId) {
      logger.warn(`[translationDubbing] No voice ID for character ${line.characterId}, skipping`)
      continue
    }

    // Generate TTS with alignment data
    const audio = await elevenlabs.generateWithAlignment(translatedText, voiceId)

    // Phase 3: Compute lip sync from alignment
    onProgress?.({
      phase: 'syncing',
      currentLine: i + 1,
      totalLines: total,
      percentage: 80 + Math.round((i / total) * 15),
    })

    const processor = getLipSyncProcessor(fps)
    const visemeTimeline = processor.processAlignment(audio.alignment)

    // Build word timeline from alignment
    const wordTimeline = buildWordTimeline(audio.alignment, fps)

    results.push({
      lineId: line.id,
      audio,
      visemeTimeline,
      wordTimeline,
      translatedScript: translatedText,
      originalScript: line.script,
      language: targetLanguage,
    })
  }

  onProgress?.({
    phase: 'complete',
    currentLine: total,
    totalLines: total,
    percentage: 100,
  })

  return results
}

// ── Helpers ──

/**
 * Build word timeline from ElevenLabs alignment data.
 * ElevenLabs alignment provides character-level timing, so we reconstruct
 * words by grouping consecutive non-space characters.
 */
function buildWordTimeline(
  alignment: import('@/types/voice').ElevenLabsAlignment,
  fps: number,
): import('@/types/voice').WordEvent[] {
  if (!alignment?.characters?.length) return []

  const words: import('@/types/voice').WordEvent[] = []
  let currentWord = ''
  let wordStartTime = 0

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i]
    const startTime = alignment.character_start_times_seconds[i] ?? 0
    const endTime = alignment.character_end_times_seconds[i] ?? startTime

    if (char === ' ' || char === '\n' || char === '\t') {
      if (currentWord) {
        words.push({
          word: currentWord,
          startFrame: Math.round(wordStartTime * fps),
          endFrame: Math.round(endTime * fps),
          startTime: wordStartTime,
          endTime,
        })
        currentWord = ''
      }
    } else {
      if (!currentWord) {
        wordStartTime = startTime
      }
      currentWord += char
    }
  }

  // Push final word
  if (currentWord) {
    const lastIdx = alignment.characters.length - 1
    const endTime = alignment.character_end_times_seconds[lastIdx] ?? 0
    words.push({
      word: currentWord,
      startFrame: Math.round(wordStartTime * fps),
      endFrame: Math.round(endTime * fps),
      startTime: wordStartTime,
      endTime,
    })
  }

  return words
}
