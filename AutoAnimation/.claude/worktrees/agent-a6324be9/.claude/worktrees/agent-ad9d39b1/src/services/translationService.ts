/**
 * Translation service -- translates dialogue lines to target languages using Gemini.
 * Preserves [emotion] cues and character names.
 *
 * Also provides the full dubbing pipeline (Feature #48):
 *   translate -> timing adjust -> TTS regen -> viseme rebuild -> caption rebuild.
 */

import { getGeminiService } from './gemini'

export interface TranslationResult {
  originalScript: string
  translatedScript: string
  characterName: string
}

/** Supported languages for translation (subset of ElevenLabs multilingual_v2 languages) */
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
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ro', name: 'Romanian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'el', name: 'Greek' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'no', name: 'Norwegian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'ru', name: 'Russian' },
  { code: 'bg', name: 'Bulgarian' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

export interface DialogueLineInput {
  characterName: string
  script: string
}

/**
 * Translate an array of dialogue lines to the target language using Gemini.
 * Preserves [emotion] cues and character names.
 */
export async function translateDialogue(
  lines: DialogueLineInput[],
  targetLang: LanguageCode,
): Promise<TranslationResult[]> {
  const langName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang

  const linesText = lines
    .map((l, i) => `${i + 1}. [${l.characterName}]: ${l.script}`)
    .join('\n')

  const prompt = `You are a professional dialogue translator for animated videos.

Translate the following dialogue lines to ${langName}.

RULES:
- Keep ALL [emotion] cues exactly as-is (e.g. [happy], [sad], [surprised])
- Keep character names exactly as-is (they are proper nouns)
- Preserve the same tone, register, and energy as the original
- Keep the same approximate script length (important for lip sync timing)
- Do NOT add or remove emotion cues
- Translate naturally — avoid word-for-word translation

INPUT:
${linesText}

OUTPUT FORMAT:
Return ONLY a JSON array of objects with "index" (1-based), "characterName", and "translatedScript" fields.
Example: [{"index":1,"characterName":"Alex","translatedScript":"[happy] Hola mundo!"}]`

  const service = getGeminiService()
  const response = await service.generateContent(prompt)

  // Parse JSON response
  const jsonMatch = response.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Failed to parse translation response')
  }

  const parsed: Array<{ index: number; characterName: string; translatedScript: string }> =
    JSON.parse(jsonMatch[0])

  return lines.map((line, i) => {
    const translated = parsed.find((p) => p.index === i + 1)
    return {
      originalScript: line.script,
      translatedScript: translated?.translatedScript || line.script,
      characterName: line.characterName,
    }
  })
}

// ── Full Translation Pipeline (Feature #48) ──────────────────────────────────

import type { TranslatedDialogueLine, TranslatedProject, TranslationConfig } from '@/types/translation'
import { translateSentences, CAPTION_LANGUAGES } from '@/services/captionTranslation'
import { estimateTranslatedDuration, computeTimingAdjustment } from '@/services/translationTiming'
import { getElevenLabsService } from '@/services/elevenlabs'
import { LipSyncProcessor } from '@/services/lipSync'
import { useTranslationStore } from '@/stores/useTranslationStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

function stripEmotionCues(script: string): string {
  return script.replace(/\[[\w-]+\]\s*/g, '').trim()
}

function extractEmotionCuesFromScript(script: string): string[] {
  return script.match(/\[[\w-]+\]/g) || []
}

function reinjectCues(translatedText: string, originalScript: string): string {
  const cues = extractEmotionCuesFromScript(originalScript)
  if (cues.length === 0) return translatedText
  return cues.join(' ') + ' ' + translatedText
}

/**
 * Full translation pipeline: translate dialogue, regenerate TTS, rebuild visemes.
 */
export async function translateProjectFull(
  config: TranslationConfig,
  geminiApiKey: string,
): Promise<TranslatedProject> {
  const store = useTranslationStore.getState()
  const multiCharStore = useMultiCharacterStore.getState()
  const fps = useTimelineStore.getState().fps || 30

  const dialogueLines = multiCharStore.getSortedLines()
  const characters = multiCharStore.characters

  if (dialogueLines.length === 0) {
    throw new Error('No dialogue lines to translate')
  }

  const langInfo = CAPTION_LANGUAGES.find((l) => l.code === config.targetLanguage)
  const langLabel = langInfo?.label ?? config.targetLanguage

  // Initialize progress
  for (const line of dialogueLines) {
    store.updateLineProgress(line.id, { lineId: line.id, status: 'pending' })
  }

  // Step 1-2: Batch translate
  const cleanScripts = dialogueLines.map((l) => stripEmotionCues(l.script))
  for (const line of dialogueLines) {
    store.updateLineProgress(line.id, { status: 'translating' })
  }

  let translatedTexts: string[]
  try {
    translatedTexts = await translateSentences(cleanScripts, langLabel, geminiApiKey)
  } catch (err) {
    throw new Error(`Translation failed: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  const translatedLines: TranslatedDialogueLine[] = []
  let totalCredits = 5

  for (let i = 0; i < dialogueLines.length; i++) {
    const line = dialogueLines[i]
    const translatedText = translatedTexts[i] || cleanScripts[i]
    const fullScript = reinjectCues(translatedText, line.script)

    // Timing
    const origDuration = (line.endFrame - line.startFrame) / fps
    const estDuration = estimateTranslatedDuration(origDuration, cleanScripts[i].length, translatedText.length, config.targetLanguage)
    const timing = computeTimingAdjustment(origDuration, estDuration, config.minSpeed, config.maxSpeed, config.maxOverlapSeconds)

    store.updateLineProgress(line.id, { status: 'generating-voice' })

    const character = characters.find((c) => c.id === line.characterId)
    let audioUrl: string | null = null
    let audioDuration = 0
    let visemeTimeline = line.visemeTimeline || []
    let wordTimeline = line.wordTimeline || []

    try {
      const service = getElevenLabsService()
      if (service && character?.voiceId) {
        const result = await service.generateWithAlignment(fullScript, character.voiceId, {
          stability: 0.5,
          similarityBoost: 0.75,
          modelId: 'eleven_multilingual_v2',
        })
        audioUrl = result.audioUrl
        audioDuration = result.duration

        store.updateLineProgress(line.id, { status: 'syncing' })
        if (result.alignment) {
          const processor = new LipSyncProcessor()
          visemeTimeline = processor.processAlignment(result.alignment).map((v: any) => ({
            ...v,
            startFrame: v.startFrame + line.startFrame,
            endFrame: v.endFrame + line.startFrame,
          }))

          // Build word timeline
          const chars = result.alignment.characters || []
          const starts = result.alignment.character_start_times_seconds || []
          const ends = result.alignment.character_end_times_seconds || []
          wordTimeline = []
          let curWord = ''
          let wordStart = 0
          for (let j = 0; j < chars.length; j++) {
            if (chars[j] === ' ' || j === chars.length - 1) {
              if (j === chars.length - 1 && chars[j] !== ' ') curWord += chars[j]
              if (curWord.trim()) {
                wordTimeline.push({
                  word: curWord.trim(),
                  startFrame: Math.round(wordStart * fps) + line.startFrame,
                  endFrame: Math.round((ends[j] || ends[j - 1] || 0) * fps) + line.startFrame,
                  startTime: wordStart,
                  endTime: ends[j] || ends[j - 1] || 0,
                })
              }
              curWord = ''
              wordStart = starts[j + 1] || 0
            } else {
              if (!curWord) wordStart = starts[j] || 0
              curWord += chars[j]
            }
          }
        }
        totalCredits += 30
      }
    } catch (err) {
      console.warn(`[Translation] Voice gen failed for line ${i}:`, err)
      store.updateLineProgress(line.id, { status: 'error', error: String(err) })
    }

    translatedLines.push({
      originalLineId: line.id,
      characterId: line.characterId,
      translatedScript: fullScript,
      languageCode: config.targetLanguage,
      audioUrl,
      audioDuration,
      visemeTimeline,
      wordTimeline,
      speedAdjustment: timing.speed,
    })

    store.updateLineProgress(line.id, { status: 'complete' })
  }

  // Build sentence timeline
  const sentenceTimeline = translatedLines.map((tl) => {
    const words = tl.wordTimeline
    return {
      sentence: stripEmotionCues(tl.translatedScript),
      startFrame: words[0]?.startFrame ?? 0,
      endFrame: words[words.length - 1]?.endFrame ?? 0,
      startTime: words[0]?.startTime ?? 0,
      endTime: words[words.length - 1]?.endTime ?? 0,
      words,
    }
  })

  return {
    languageCode: config.targetLanguage,
    languageLabel: langLabel,
    lines: translatedLines,
    sentenceTimeline,
    creditsUsed: totalCredits,
  }
}
