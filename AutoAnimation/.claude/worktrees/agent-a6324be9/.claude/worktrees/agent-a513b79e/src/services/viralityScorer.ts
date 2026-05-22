/**
 * Virality Scorer — AI-powered clip analysis using Gemini with Google Search grounding
 * for trending topic matching and comprehensive quality scoring.
 */

import type { ViralScore } from '@/types/orchestrator'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { withCreditGate } from './creditGate'
import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_API_URL = 'gemini-3.1-flash-lite-preview' // model name for callGeminiProxy

export interface ClipMetadata {
  durationSeconds: number
  dialogueCount: number
  characterCount: number
  textOverlayCount: number
  hasCTA: boolean
  hasHook: boolean
  captionStyle: string
  aspectRatio: string
  hasMusic: boolean
  templateCount: number
  svgObjectCount: number
  stockMediaCount: number
  topics: string[]
  /** Hook strength score for first 3 seconds (0-100) */
  hookStrengthFirstThreeSeconds: number
  /** Number of visual cuts per minute (dialogue transitions + media transitions) */
  cutsPerMinute: number
  /** Average duration per dialogue line in seconds */
  averageLineDuration: number
  /** Whether there is a visual element (text overlay or stock media) in the first 3 seconds */
  hasOpeningVisual: boolean
  /** Keywords extracted from dialogue relevant to trending topics */
  trendKeywords: string[]
}

/**
 * Score a clip for virality potential using Gemini + Google Search grounding.
 */
export async function scoreClipVirality(
  metadata: ClipMetadata,
  prompt: string,
): Promise<ViralScore> {
  return withCreditGate('virality-score', () =>
    _scoreViralityImpl(metadata, prompt),
  )
}

async function _scoreViralityImpl(
  metadata: ClipMetadata,
  prompt: string,
): Promise<ViralScore> {
  const scoringPrompt = `You are a viral video analyst. Score this short-form video clip for virality potential.

CLIP DETAILS:
- Original prompt: "${prompt}"
- Duration: ${metadata.durationSeconds}s
- Characters: ${metadata.characterCount}
- Dialogue lines: ${metadata.dialogueCount}
- Text overlays: ${metadata.textOverlayCount}
- Has CTA: ${metadata.hasCTA}
- Has hook (first 3s): ${metadata.hasHook}
- Caption style: ${metadata.captionStyle}
- Aspect ratio: ${metadata.aspectRatio}
- Has background music: ${metadata.hasMusic}
- Templates: ${metadata.templateCount}
- SVG objects: ${metadata.svgObjectCount}
- Stock media: ${metadata.stockMediaCount}
- Topics: ${metadata.topics.join(', ')}

Score each dimension 0-100 and provide 3-5 specific improvement suggestions.

Output valid JSON:
{
  "overall": 72,
  "dimensions": {
    "hook": 80,
    "pacing": 65,
    "trend": 70,
    "emotion": 75,
    "visual": 68,
    "rewatch": 60
  },
  "suggestions": [
    "Add a text hook in the first 2 seconds",
    "Include trending hashtag-worthy topic reference",
    "Add a surprise element at the midpoint for rewatch value"
  ]
}`

  const response = await callGeminiProxy(GEMINI_API_URL, {
      contents: [{ role: 'user', parts: [{ text: scoringPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
      tools: [{ googleSearch: {} }],
    })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return JSON.parse(text) as ViralScore
}

/**
 * Extract clip metadata from current stores for scoring.
 */
export function extractClipMetadata(): ClipMetadata {
  const chars = useMultiCharacterStore.getState().characters
  const lines = useMultiCharacterStore.getState().dialogueLines
  const overlays = useTextOverlayStore.getState().overlays
  const fps = useTimelineStore.getState().fps || 30
  const totalFrames = useTimelineStore.getState().totalFrames
  const aspectRatio = useEditorStore.getState().aspectRatio
  const captionStyle = useVoiceStore.getState().captionStyle
  const templates = useHTMLTemplateLayerStore.getState().templates
  const svgObjects = useSVGObjectStore.getState().composition?.objects || []
  const media = useMediaStore.getState().canvasItems

  const hookFrames = Math.round(3 * fps)
  const durationSeconds = totalFrames / fps

  // Hook strength: checks if dialogue or text overlay fires before frame 3*fps
  const hasDialogueInHook = lines.some((l: { startFrame: number }) => l.startFrame < hookFrames)
  const hasOverlayInHook = overlays.some((o: { startFrame?: number }) => (o.startFrame ?? 0) < hookFrames)
  const hasMediaInHook = media.some((m: { startFrame: number }) => m.startFrame < hookFrames)
  const hookStrength = (hasDialogueInHook ? 40 : 0) + (hasOverlayInHook ? 35 : 0) + (hasMediaInHook ? 25 : 0)

  // Cuts per minute: dialogue line transitions + stock media items
  const cutsPerMinute = durationSeconds > 0
    ? ((lines.length + media.length) / durationSeconds) * 60
    : 0

  // Average line duration
  const avgLineDuration = lines.length > 0
    ? lines.reduce((sum: number, l: { startFrame: number; endFrame: number }) =>
        sum + (l.endFrame - l.startFrame) / fps, 0) / lines.length
    : 0

  // Trend keywords: extract nouns/keywords from dialogue
  const trendKeywords = extractTrendKeywords(
    lines.map((l: { script: string }) => l.script)
  )

  return {
    durationSeconds,
    dialogueCount: lines.length,
    characterCount: chars.length,
    textOverlayCount: overlays.length,
    hasCTA: overlays.some((o: { presetType?: string }) => o.presetType === 'cta'),
    hasHook: hasDialogueInHook || hasOverlayInHook,
    captionStyle,
    aspectRatio,
    hasMusic: useVoiceStore.getState().generatedVoices.length > 0,
    templateCount: templates.length,
    svgObjectCount: svgObjects.length,
    stockMediaCount: media.length,
    topics: lines.map((l: { script: string }) => l.script.slice(0, 30)),
    hookStrengthFirstThreeSeconds: Math.min(100, hookStrength),
    cutsPerMinute: Math.round(cutsPerMinute * 10) / 10,
    averageLineDuration: avgLineDuration,
    hasOpeningVisual: hasOverlayInHook || hasMediaInHook,
    trendKeywords,
  }
}

/**
 * Extract trend-relevant keywords from dialogue scripts.
 */
function extractTrendKeywords(scripts: string[]): string[] {
  const allText = scripts.join(' ').toLowerCase()
  // Simple keyword extraction: words longer than 4 chars, deduplicated
  const words = allText
    .replace(/\[[\w-]+\]/g, '') // remove emotion cues
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4)
  const unique = [...new Set(words)]
  return unique.slice(0, 10)
}
