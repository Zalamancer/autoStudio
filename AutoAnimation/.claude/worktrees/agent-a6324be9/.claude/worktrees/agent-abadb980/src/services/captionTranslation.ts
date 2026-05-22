/**
 * Caption Translation Service — Translate captions to multiple languages.
 *
 * Uses Gemini to batch-translate caption text while preserving timing.
 */

import type { WordEvent } from '@/types/voice'
import type { SentenceEvent } from '@/services/captions'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Types ──────────────────────────────────────────────────────────────

export interface TranslatedCaption {
  language: string
  languageLabel: string
  wordTimeline: WordEvent[]
  sentenceTimeline: SentenceEvent[]
}

export const CAPTION_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'pl', label: 'Polish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'uk', label: 'Ukrainian' },
] as const

// ── Translation ────────────────────────────────────────────────────────

/**
 * Translate sentences to a target language using Gemini.
 */
export async function translateSentences(
  sentences: string[],
  targetLang: string,
  _geminiApiKey?: string,
): Promise<string[]> {
  const prompt = `Translate the following sentences to ${targetLang}. Return ONLY a JSON array of translated strings, one per input sentence. Preserve the same number of sentences.

Input sentences:
${JSON.stringify(sentences)}

Return format: ["translated sentence 1", "translated sentence 2", ...]`

  const response = await callGeminiProxy('gemini-2.0-flash', {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  })

  if (!response.ok) throw new Error('Translation failed')

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
  return JSON.parse(text)
}

/**
 * Translate sentences for dubbing -- returns translated text plus metadata
 * (character counts, estimated word counts) for the timing adjuster.
 */
export async function translateForDubbing(
  sentences: string[],
  targetLang: string,
  geminiApiKey: string,
): Promise<Array<{ translated: string; charCount: number; wordCount: number }>> {
  const translated = await translateSentences(sentences, targetLang, geminiApiKey)

  return translated.map((text) => ({
    translated: text,
    charCount: text.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  }))
}

/**
 * Translate captions to a target language.
 *
 * Preserves the timing from the original caption timelines,
 * distributing translated text proportionally across the same time spans.
 */
export async function translateCaptions(
  sentenceTimeline: SentenceEvent[],
  _wordTimeline: WordEvent[],
  targetLangCode: string,
  geminiApiKey: string,
  fps: number = 30,
): Promise<TranslatedCaption> {
  const langInfo = CAPTION_LANGUAGES.find((l) => l.code === targetLangCode)
  const langLabel = langInfo?.label ?? targetLangCode

  // Extract sentences for translation
  const sentences = sentenceTimeline.map((s) => s.sentence)

  // Translate
  const translated = await translateSentences(sentences, langLabel, geminiApiKey)

  // Build translated sentence timeline (preserving timing)
  const translatedSentenceTimeline: SentenceEvent[] = sentenceTimeline.map((original, i) => {
    const translatedText = translated[i] || original.sentence
    const translatedWords = translatedText.split(/\s+/).filter(Boolean)

    // Distribute translated words evenly across the original time span
    const totalDuration = original.endFrame - original.startFrame
    const wordDuration = totalDuration / Math.max(1, translatedWords.length)

    const words: WordEvent[] = translatedWords.map((word, j) => ({
      word,
      startFrame: Math.round(original.startFrame + j * wordDuration),
      endFrame: Math.round(original.startFrame + (j + 1) * wordDuration),
      startTime: (original.startFrame + j * wordDuration) / fps,
      endTime: (original.startFrame + (j + 1) * wordDuration) / fps,
    }))

    return {
      sentence: translatedText,
      startFrame: original.startFrame,
      endFrame: original.endFrame,
      startTime: original.startTime,
      endTime: original.endTime,
      words,
    }
  })

  // Build translated word timeline from sentence words
  const translatedWordTimeline: WordEvent[] = translatedSentenceTimeline.flatMap((s) => s.words)

  return {
    language: targetLangCode,
    languageLabel: langLabel,
    wordTimeline: translatedWordTimeline,
    sentenceTimeline: translatedSentenceTimeline,
  }
}
