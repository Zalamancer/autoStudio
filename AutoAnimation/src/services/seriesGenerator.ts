/**
 * Series Generator Service — AI-powered series outline generation.
 *
 * Uses Gemini Flash to generate a structured JSON series outline
 * with episode prompts, narrative arc, and shared character consistency.
 */

import type {
  SeriesOutline,
  NarrativeArc,
  ArcPosition,
} from '@/types/series'
import type { OrchestratorSettings } from '@/types/orchestrator'
import { logger } from '@/utils/logger'
import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_API_URL = 'gemini-3-flash-preview' // model name for callGeminiProxy

interface GenerateOutlineOptions {
  /** Main topic or theme for the series */
  topic: string
  /** Number of episodes to generate (3-10) */
  episodeCount: number
  /** Narrative arc style */
  narrativeArc: NarrativeArc
  /** Target audience description */
  targetAudience?: string
  /** Orchestrator settings for context (aspect ratio, platform, etc.) */
  settings?: Partial<OrchestratorSettings>
}

/**
 * Generate a series outline from a topic using Gemini Flash.
 */
export async function generateSeriesOutline(
  options: GenerateOutlineOptions,
): Promise<SeriesOutline> {
  const {
    topic,
    episodeCount,
    narrativeArc,
    targetAudience = 'general social media audience',
    settings,
  } = options
  const platform = settings?.targetPlatform || 'general'
  const aspectRatio = settings?.aspectRatio || '9:16'

  const arcDescription = {
    standalone: 'Each episode is fully self-contained and can be watched in any order.',
    progressive: 'Episodes build on each other, with increasing complexity or depth. Reference previous episodes.',
    seasonal: 'Episodes form a narrative arc with intro, build-up, climax, and resolution.',
  }[narrativeArc]

  const prompt = `You are a content series planner for short-form video (${platform}, ${aspectRatio}).

Generate a ${episodeCount}-episode video series outline on the topic: "${topic}"

Target audience: ${targetAudience}
Narrative arc: ${narrativeArc} — ${arcDescription}

Return a JSON object with this exact structure:
{
  "title": "Series title",
  "theme": "Core theme in 1 sentence",
  "targetAudience": "${targetAudience}",
  "episodeCount": ${episodeCount},
  "narrativeArc": "${narrativeArc}",
  "sharedCharacters": ["Character Name 1", "Character Name 2"],
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "Episode title",
      "prompt": "Full detailed prompt for the video orchestrator. Include specific dialogue, emotions, scenes. Reference the character names. 3-5 sentences minimum.",
      "hooks": ["Attention-grabbing opening line option 1", "Option 2"],
      "cta": "Call-to-action text for the end",
      "arcPosition": "intro"
    }
  ]
}

Rules:
- Each episode prompt should be detailed enough to generate a complete short-form video
- Use consistent character names across all episodes
- Include [emotion] cues in prompts (e.g. [excited], [thoughtful])
- arcPosition must be one of: "intro", "build", "climax", "resolution"
- For standalone arc: all episodes can be "build"
- For progressive: first is "intro", middle are "build", last is "resolution"
- For seasonal: spread across all four positions
- hooks should be attention-grabbing opening lines (2-3 per episode)
- cta should encourage following, subscribing, or watching the next episode
- Return ONLY valid JSON, no markdown code fences`

  const response = await callGeminiProxy(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  // Parse JSON response
  const outline: SeriesOutline = JSON.parse(text)

  // Validate and fix the outline
  outline.episodeCount = outline.episodes.length
  outline.narrativeArc = narrativeArc

  // Ensure all episodes have valid arc positions
  const validPositions: ArcPosition[] = ['intro', 'build', 'climax', 'resolution']
  for (const ep of outline.episodes) {
    if (!validPositions.includes(ep.arcPosition)) {
      ep.arcPosition = 'build'
    }
    if (!ep.hooks || ep.hooks.length === 0) {
      ep.hooks = [ep.title]
    }
    if (!ep.cta) {
      ep.cta = 'Follow for more!'
    }
  }

  logger.log(
    `[SeriesGenerator] Generated outline: "${outline.title}" (${outline.episodes.length} episodes, ${narrativeArc} arc)`,
  )

  return outline
}

/**
 * Build a detailed episode prompt that includes series context
 * (character names, episode position, previous episode references).
 */
export function generateEpisodePrompt(
  outline: SeriesOutline,
  episodeIndex: number,
): string {
  const episode = outline.episodes[episodeIndex]

  const parts: string[] = []

  // Series context header
  parts.push(`[Series: "${outline.title}" — Episode ${episode.episodeNumber}/${outline.episodeCount}]`)

  // Character consistency
  if (outline.sharedCharacters.length > 0) {
    parts.push(`[Characters: ${outline.sharedCharacters.join(', ')}]`)
  }

  // Arc context
  if (outline.narrativeArc === 'progressive' && episodeIndex > 0) {
    const prev = outline.episodes[episodeIndex - 1]
    parts.push(`[Previously: "${prev.title}"]`)
  }

  // The actual episode prompt
  parts.push(episode.prompt)

  return parts.join('\n')
}
