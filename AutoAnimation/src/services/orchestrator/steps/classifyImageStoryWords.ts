/**
 * Step Executor: Classify Image Story Words
 *
 * Uses Gemini Flash to classify each word in the script as:
 * - image_noun: concrete nouns worth illustrating with an image
 * - action_verb: verbs that can be shown as animated motion
 * - filler: function words, articles, prepositions, abstract concepts
 *
 * Populates plan.imageStory.scenes with classified words and creates
 * a single ClipPlanDialogueLine so downstream TTS steps have text to voice.
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { ImageStoryScene, ImageStoryWord, WordRole } from '@/types/imageStory'
import { getGeminiService, hasGeminiService } from '@/services/gemini'
import { hasElevenLabsService } from '@/services/elevenlabs'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

// ── Classification Prompt ──

function buildClassificationPrompt(script: string): string {
  return `You are a word classifier for an image-story video generator.
Given a script, classify every word into one of three roles:

- "image_noun": Concrete, visible nouns that can be illustrated with a stock photo or icon.
  Examples: dog, mountain, car, pizza, phone, castle, forest, robot.
- "action_verb": Verbs describing visible physical actions that could be animated.
  Examples: running, jumping, flying, cooking, dancing, swimming.
- "filler": Everything else — articles, prepositions, pronouns, adjectives, abstract nouns,
  auxiliary verbs, conjunctions, adverbs, and any word that does not produce a clear image.
  Examples: the, is, very, because, happiness, should, really, an.

For each image_noun, also provide a searchTerm (1-3 word Freepik query) and an assetType
("photo", "png", "illustration", or "vector"). Prefer "png" for objects and "photo" for scenes.

For each action_verb, provide an animation hint (e.g. "bounce", "slide-in", "shake", "zoom").
If the verb relates to a nearby noun, set linkedNoun to that noun's text.

Return a JSON array of objects. Each object must have:
{ "text": string, "role": "image_noun" | "action_verb" | "filler", "searchTerm"?: string, "assetType"?: string, "linkedNoun"?: string, "animation"?: string }

Preserve the original word order. Keep punctuation attached to the word it belongs to.
Group compound nouns as a single entry (e.g. "ice cream" = one entry).

## Few-shot examples

### Example 1: Simple sentence
Input: "The cat sat on the mat"
Output:
[
  { "text": "The", "role": "filler" },
  { "text": "cat", "role": "image_noun", "searchTerm": "cat cute", "assetType": "png" },
  { "text": "sat", "role": "action_verb", "animation": "bounce", "linkedNoun": "cat" },
  { "text": "on", "role": "filler" },
  { "text": "the", "role": "filler" },
  { "text": "mat", "role": "image_noun", "searchTerm": "floor mat", "assetType": "png" }
]

### Example 2: Compound nouns
Input: "She drove the ice cream truck past the Golden Gate Bridge"
Output:
[
  { "text": "She", "role": "filler" },
  { "text": "drove", "role": "action_verb", "animation": "slide-in", "linkedNoun": "ice cream truck" },
  { "text": "the", "role": "filler" },
  { "text": "ice cream truck", "role": "image_noun", "searchTerm": "ice cream truck", "assetType": "png" },
  { "text": "past", "role": "filler" },
  { "text": "the", "role": "filler" },
  { "text": "Golden Gate Bridge", "role": "image_noun", "searchTerm": "Golden Gate Bridge", "assetType": "photo" }
]

### Example 3: No image-worthy words
Input: "However this is very important because of the situation"
Output:
[
  { "text": "However", "role": "filler" },
  { "text": "this", "role": "filler" },
  { "text": "is", "role": "filler" },
  { "text": "very", "role": "filler" },
  { "text": "important", "role": "filler" },
  { "text": "because", "role": "filler" },
  { "text": "of", "role": "filler" },
  { "text": "the", "role": "filler" },
  { "text": "situation", "role": "filler" }
]

Now classify the following script. Return ONLY the JSON array, no markdown fences or extra text.

Script: "${script}"`
}

// ── JSON Parsing with retry ──

interface RawClassifiedWord {
  text: string
  role: WordRole
  searchTerm?: string
  assetType?: 'photo' | 'png' | 'illustration' | 'vector'
  linkedNoun?: string
  animation?: string
}

function parseClassifiedWords(response: string): RawClassifiedWord[] {
  // Strip markdown fences if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }

  // Try direct parse first
  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed)) {
    throw new Error('Response is not an array')
  }

  // Validate each word has required fields
  return parsed.map((w: Record<string, unknown>) => {
    if (typeof w.text !== 'string' || !w.text) {
      throw new Error(`Invalid word entry: missing text field`)
    }
    const role = w.role as string
    if (role !== 'image_noun' && role !== 'action_verb' && role !== 'filler') {
      throw new Error(`Invalid role "${role}" for word "${w.text}"`)
    }
    return {
      text: w.text,
      role: role as WordRole,
      searchTerm: typeof w.searchTerm === 'string' ? w.searchTerm : undefined,
      assetType: typeof w.assetType === 'string' ? (w.assetType as RawClassifiedWord['assetType']) : undefined,
      linkedNoun: typeof w.linkedNoun === 'string' ? w.linkedNoun : undefined,
      animation: typeof w.animation === 'string' ? w.animation : undefined,
    }
  })
}

// ── Scene Builder ──

function buildScene(words: ImageStoryWord[], sceneIndex: number): ImageStoryScene {
  // Pick the first image_noun as the background search context, or use a generic term
  const firstNoun = words.find((w) => w.role === 'image_noun')
  return {
    id: `scene-${sceneIndex}`,
    background: {
      searchTerm: firstNoun?.searchTerm ?? 'abstract background',
      assetType: 'photo',
    },
    words,
    elements: [],
    transition: sceneIndex === 0 ? 'cut' : 'crossfade',
  }
}

// ── Main Executor ──

export async function executeClassifyImageStoryWords(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  // ── Pre-flight: ensure imageStory mode is active ──
  if (!plan.imageStory) {
    logger.warn('[Orchestrator:classifyWords] No imageStory plan — skipping.')
    return
  }

  const script = plan.imageStory.ttsText
  if (!script || script.trim().length === 0) {
    logger.warn('[Orchestrator:classifyWords] Empty ttsText — skipping.')
    return
  }

  // ── Pre-flight: check service availability ──
  if (!hasElevenLabsService()) {
    logger.warn('[Orchestrator:classifyWords] ElevenLabs not configured — image story needs TTS for word timings.')
  }

  if (!hasGeminiService()) {
    logger.warn('[Orchestrator:classifyWords] Gemini not available — cannot classify words.')
    return
  }

  logger.log(`[Orchestrator:classifyWords] Classifying words for script (${script.length} chars)`)

  // ── Call Gemini Flash with 1 retry on failure ──
  const gemini = getGeminiService()
  const prompt = buildClassificationPrompt(script)
  let classifiedWords: RawClassifiedWord[] | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await gemini.generateContent(prompt)
      classifiedWords = parseClassifiedWords(response)
      break
    } catch (err) {
      logger.warn(
        `[Orchestrator:classifyWords] Attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : String(err)}`,
      )
      if (attempt === 1) {
        logger.warn('[Orchestrator:classifyWords] Both attempts failed — using fallback all-filler classification.')
      }
    }
  }

  // ── Fallback: mark every word as filler ──
  if (!classifiedWords) {
    classifiedWords = script.split(/\s+/).map((w) => ({ text: w, role: 'filler' as WordRole }))
  }

  // ── Convert to ImageStoryWord[] ──
  const words: ImageStoryWord[] = classifiedWords.map((w) => ({
    text: w.text,
    role: w.role,
    searchTerm: w.searchTerm,
    assetType: w.assetType,
    linkedNoun: w.linkedNoun,
    animation: w.animation,
  }))

  const nounCount = words.filter((w) => w.role === 'image_noun').length
  const verbCount = words.filter((w) => w.role === 'action_verb').length
  logger.log(
    `[Orchestrator:classifyWords] Classified ${words.length} words: ${nounCount} nouns, ${verbCount} verbs, ${words.length - nounCount - verbCount} fillers`,
  )

  // ── Build scenes: split roughly every 8-12 words ──
  const WORDS_PER_SCENE = 10
  const scenes: ImageStoryScene[] = []
  for (let i = 0; i < words.length; i += WORDS_PER_SCENE) {
    const chunk = words.slice(i, i + WORDS_PER_SCENE)
    scenes.push(buildScene(chunk, scenes.length))
  }

  // ── Populate plan.imageStory.scenes ──
  plan.imageStory.scenes = scenes

  // ── Create a single dialogue line for TTS ──
  if (plan.dialogue.length === 0) {
    plan.dialogue.push({
      characterName: 'Narrator',
      script: script,
    })
  }

  // ── Cost tracking ──
  ctx.addCostEntry?.({
    source: 'gemini',
    label: 'Image Story: Word Classification',
    cost: 0,
    credits: 1,
  })

  logger.log(`[Orchestrator:classifyWords] Created ${scenes.length} scenes with ${words.length} classified words.`)
}
