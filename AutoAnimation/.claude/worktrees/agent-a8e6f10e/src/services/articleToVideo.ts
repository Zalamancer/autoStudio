/**
 * articleToVideo.ts
 *
 * Frontend service for converting article extractions into orchestrator prompts.
 */

import type { ArticleExtraction, ArticleVideoSettings, ArticleSection } from '@/types/orchestrator'

/**
 * Build an orchestrator prompt from an article extraction.
 * Maps each section to a scene with narration, visual direction, and timing.
 */
export function buildArticlePrompt(
  extraction: ArticleExtraction,
  settings: ArticleVideoSettings,
): string {
  const enabledSections = settings.sections.filter((s) => s.enabled)

  if (enabledSections.length === 0) {
    return `Create a video about: ${extraction.title}`
  }

  // Calculate per-section durations proportional to word count
  const totalWords = enabledSections.reduce((sum, s) => sum + s.wordCount, 0)
  const sectionDurations = enabledSections.map((s) => {
    if (totalWords === 0) return Math.round(settings.targetDuration / enabledSections.length)
    const proportion = s.wordCount / totalWords
    return Math.max(3, Math.round(proportion * settings.targetDuration))
  })

  // Build the scene descriptions
  const sceneDescriptions = enabledSections.map((section, i) => {
    const duration = sectionDurations[i]
    const condensedText = condenseText(section.text, 40)
    return `Scene ${i + 1} (${duration}s): "${section.heading}" — Narrate: "${condensedText}". Visual: Show relevant imagery for ${section.heading.toLowerCase()}.`
  }).join('\n')

  const prompt = `Create a ${settings.targetDuration}-second article summary video about "${extraction.title}"${extraction.author ? ` by ${extraction.author}` : ''}.

This is a multi-scene video where each scene covers a section of the article. Use a narrator character with an educational, engaging tone.

SCENES:
${sceneDescriptions}

INTRO SCENE (3s): Show the article title "${extraction.title}" as a cinematic title card.
OUTRO SCENE (3s): Show a call-to-action "Read the full article" with the source attribution.

Total duration: ${settings.targetDuration} seconds. Use smooth fade transitions between scenes. Each scene should have a relevant stock media image or video as a background cutaway.`

  return prompt
}

/**
 * Condense text to a target word count for narration.
 */
function condenseText(text: string, maxWords: number): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  if (words.length <= maxWords) return words.join(' ')
  return words.slice(0, maxWords).join(' ') + '...'
}

/**
 * Calculate estimated video duration from article word count.
 * Aim for roughly 10 seconds per 200 words (reading at video narration pace).
 */
export function estimateVideoDuration(totalWordCount: number): number {
  const baseDuration = Math.round((totalWordCount / 200) * 10)
  return Math.min(120, Math.max(30, baseDuration))
}

/**
 * Filter and reorder sections based on user preferences.
 */
export function prepareSectionsForVideo(
  sections: ArticleSection[],
  enabledIndices: number[],
): ArticleSection[] {
  return enabledIndices
    .filter((i) => i >= 0 && i < sections.length)
    .map((i) => sections[i])
}
