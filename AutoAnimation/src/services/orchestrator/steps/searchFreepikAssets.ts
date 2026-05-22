/**
 * Step Executor: Search Freepik Assets
 *
 * Two-phase step for the image-story orchestrator mode:
 *
 * Phase 1 — Map TTS word timestamps onto classified words
 *   Reads generatedVoices[0].wordTimeline (WordEvent[]), converts
 *   startTime/endTime from seconds to milliseconds, and pairs each
 *   WordEvent with the corresponding ImageStoryWord from the plan.
 *   Writes the result to ctx.imageStoryWordTimings.
 *
 * Phase 2 — Parallel Freepik search
 *   Searches backgrounds (per scene) and noun elements (per image_noun word).
 *   Detects character nouns by checking the searchTerm for person-related words.
 *   Stores results in useImageStoryStore and auto-selects the first result.
 *
 * Cost tracking: source 'freepik', cost 0 (free API), credits = number of searches.
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { ImageStoryWordTiming, ImageStoryWord, FreepikAsset } from '@/types/imageStory'
import type { ExecutionContext } from '../constants'
import { searchWithFallback, getSearchTerm } from '@/services/freepik/freepikService'
import { useImageStoryStore } from '@/stores/useImageStoryStore'

const PERSON_KEYWORDS = [
  'person', 'people', 'man', 'woman', 'boy', 'girl', 'child', 'children',
  'baby', 'kid', 'guy', 'lady', 'human', 'character', 'hero', 'villain',
  'teacher', 'student', 'doctor', 'nurse', 'worker', 'player', 'athlete',
  'soldier', 'king', 'queen', 'prince', 'princess', 'warrior', 'knight',
]

function isCharacterNoun(searchTerm: string): boolean {
  const lower = searchTerm.toLowerCase()
  return PERSON_KEYWORDS.some((kw) => lower.includes(kw))
}

export async function executeSearchFreepikAssets(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const imageStory = plan.imageStory
  if (!imageStory) return

  const store = useImageStoryStore.getState()
  const style = imageStory.style

  // ── TTS failure guard ──
  const voice = ctx.generatedVoices[0]
  if (!voice?.wordTimeline || voice.wordTimeline.length === 0) {
    throw new Error(
      '[searchFreepikAssets] No TTS word timeline data available. ' +
      'The generate-voices step must run first and produce wordTimeline.',
    )
  }

  // ── Phase 1: Map TTS word timestamps onto classified words ──

  // Flatten all words from all scenes, preserving order
  const allWords: ImageStoryWord[] = imageStory.scenes.flatMap((s) => s.words)
  const wordTimeline = voice.wordTimeline

  const timings: ImageStoryWordTiming[] = []

  for (let i = 0; i < allWords.length; i++) {
    const wordDef = allWords[i]
    const ttsEvent = wordTimeline[i]

    if (ttsEvent) {
      timings.push({
        word: wordDef,
        startMs: ttsEvent.startTime * 1000,
        endMs: ttsEvent.endTime * 1000,
        startFrame: ttsEvent.startFrame,
        endFrame: ttsEvent.endFrame,
      })
    } else {
      // If TTS has fewer words than the plan (truncation, etc.), estimate
      // timing from the last known event
      const lastTts = wordTimeline[wordTimeline.length - 1]
      timings.push({
        word: wordDef,
        startMs: lastTts.endTime * 1000,
        endMs: lastTts.endTime * 1000,
        startFrame: lastTts.endFrame,
        endFrame: lastTts.endFrame,
      })
    }
  }

  ctx.imageStoryWordTimings = timings

  // ── Phase 2: Parallel Freepik search ──

  let searchCount = 0

  // Collect all search tasks
  const searchTasks: Array<{
    key: string
    searchTerm: string
    assetType: 'photo' | 'png' | 'illustration' | 'vector'
    transparency: boolean
  }> = []

  // 2a: Background searches (one per scene)
  for (const scene of imageStory.scenes) {
    const bg = scene.background
    const term = getSearchTerm(bg.searchTerm, 'background')
    searchTasks.push({
      key: `bg:${scene.id}`,
      searchTerm: term,
      assetType: bg.assetType,
      transparency: false,
    })
  }

  // 2b: Noun element searches (one per image_noun word)
  for (const wordDef of allWords) {
    if (wordDef.role !== 'image_noun' || !wordDef.searchTerm) continue

    const isCharacter = isCharacterNoun(wordDef.searchTerm)
    const term = getSearchTerm(
      wordDef.searchTerm,
      isCharacter ? 'character' : 'element',
    )
    const assetType = wordDef.assetType || 'png'

    searchTasks.push({
      key: `noun:${wordDef.searchTerm}`,
      searchTerm: term,
      assetType,
      transparency: assetType === 'png',
    })
  }

  // Execute all searches in parallel
  const results = await Promise.allSettled(
    searchTasks.map(async (task) => {
      const assets = await searchWithFallback(
        task.searchTerm,
        task.assetType,
        style,
        task.transparency,
      )
      return { key: task.key, searchTerm: task.searchTerm, assets }
    }),
  )

  // Process results and store them
  for (const result of results) {
    if (result.status !== 'fulfilled') continue

    const { key, searchTerm, assets } = result.value
    searchCount++

    // Store asset results in the image story store
    store.setAssets(searchTerm, assets)

    // Auto-select the first result if available
    if (assets.length > 0) {
      store.selectAsset(key, assets[0].url)
    }
  }

  // ── Cost tracking ──
  if (ctx.addCostEntry) {
    ctx.addCostEntry({
      source: 'freepik',
      label: `Freepik Search: ${searchCount} queries`,
      cost: 0,
      credits: searchCount,
    })
  }
}
