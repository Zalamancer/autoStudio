/**
 * B-Roll Intelligence -- shared utilities for transcript-aware B-roll analysis.
 * Extracted from setupSmartBroll.ts so both orchestration and interactive panel
 * can reuse the same logic.
 */

import { useMultiCharacterStore, type DialogueLine } from '@/stores/useMultiCharacterStore'
import { logger } from '@/utils/logger'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Types ──

export interface BrollGap {
  query: string
  startFrame: number
  endFrame: number
  /** Dialogue line immediately before the gap */
  contextBefore?: string
  /** Dialogue line immediately after the gap */
  contextAfter?: string
}

export interface TopicGroup {
  topic: string
  lineIndices: number[]
  startFrame: number
  endFrame: number
}

// ── Visual Concept Extraction ──

/**
 * Extract visual concept queries from dialogue lines using Gemini.
 */
export async function extractVisualConcepts(
  dialogueTexts: string[],
): Promise<(string | null)[]> {
  if (dialogueTexts.length === 0) return []

  const prompt = `Extract the most visually evocative noun phrases from these dialogue lines for stock footage search.
Return ONLY a JSON array of short search queries (2-4 words each), one per line.
If a line has no clear visual concept, return null for that entry.

Dialogue:
${dialogueTexts.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Example output: ["coffee beans closeup", null, "city skyline night", "laptop workspace"]`

  try {
    const GEMINI_API_URL = 'gemini-2.5-flash' // model name for callGeminiProxy
    const resp = await callGeminiProxy(GEMINI_API_URL, {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })
    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\[[\s\S]*?\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (err) {
    logger.warn('[BrollIntelligence] Gemini concept extraction failed:', err)
  }
  return dialogueTexts.map(() => null)
}

// ── Gap Detection ──

/**
 * Find gaps between dialogue lines (>1s) where B-roll can be inserted.
 */
export function findDialogueGaps(fps: number, totalFrames: number): BrollGap[] {
  const lines = useMultiCharacterStore.getState().dialogueLines
  if (lines.length === 0) return []

  const sorted = [...lines].sort((a, b) => a.startFrame - b.startFrame)
  const gaps: BrollGap[] = []
  const minGapFrames = fps // At least 1 second

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i].endFrame
    const gapEnd = sorted[i + 1].startFrame
    if (gapEnd - gapStart >= minGapFrames) {
      gaps.push({
        query: '',
        startFrame: gapStart,
        endFrame: gapEnd,
        contextBefore: sorted[i].script.replace(/\[[\w-]+\]/g, '').trim(),
        contextAfter: sorted[i + 1].script.replace(/\[[\w-]+\]/g, '').trim(),
      })
    }
  }

  // Gap after last line
  const lastLine = sorted[sorted.length - 1]
  if (totalFrames - lastLine.endFrame >= minGapFrames) {
    gaps.push({
      query: '',
      startFrame: lastLine.endFrame,
      endFrame: Math.min(lastLine.endFrame + fps * 3, totalFrames),
      contextBefore: lastLine.script.replace(/\[[\w-]+\]/g, '').trim(),
    })
  }

  return gaps
}

// ── Topic Analysis ──

/**
 * Group consecutive dialogue lines by topic for longer B-roll segments.
 */
export async function analyzeSpeakerTopics(
  dialogueLines: DialogueLine[],
): Promise<TopicGroup[]> {
  if (dialogueLines.length === 0) return []
  if (!apiKey) {
    // Fallback: treat each line as its own topic
    return dialogueLines.map((l, i) => ({
      topic: l.script.slice(0, 30),
      lineIndices: [i],
      startFrame: l.startFrame,
      endFrame: l.endFrame,
    }))
  }

  const scripts = dialogueLines.map((l) => l.script.replace(/\[[\w-]+\]/g, '').trim())
  const prompt = `Group these dialogue lines by topic. Lines about the same subject should be grouped together.
Return a JSON array of groups, each with: { "topic": "short topic name", "lineIndices": [0, 1, 2] }

Dialogue:
${scripts.map((s, i) => `${i}. ${s}`).join('\n')}

Return ONLY the JSON array.`

  try {
    const GEMINI_API_URL = 'gemini-2.5-flash' // model name for callGeminiProxy
    const resp = await callGeminiProxy(GEMINI_API_URL, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      })
    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const parsed = JSON.parse(text) as Array<{ topic: string; lineIndices: number[] }>

    return parsed.map((g) => {
      const groupLines = g.lineIndices
        .map((i) => dialogueLines[i])
        .filter(Boolean)
      return {
        topic: g.topic,
        lineIndices: g.lineIndices,
        startFrame: groupLines.length > 0 ? Math.min(...groupLines.map((l) => l.startFrame)) : 0,
        endFrame: groupLines.length > 0 ? Math.max(...groupLines.map((l) => l.endFrame)) : 0,
      }
    })
  } catch (err) {
    logger.warn('[BrollIntelligence] Topic analysis failed:', err)
    return dialogueLines.map((l, i) => ({
      topic: l.script.slice(0, 30),
      lineIndices: [i],
      startFrame: l.startFrame,
      endFrame: l.endFrame,
    }))
  }
}

// ── Scoring Wrapper ──

/**
 * Rank B-roll search results by relevance and quality.
 */
export function rankBrollSuggestions(
  hits: Array<{ largeImageURL?: string; webformatURL?: string; imageWidth?: number; imageHeight?: number; views?: number; likes?: number }>,
  _query: string,
  _role: string,
): Array<typeof hits[number] & { score: number }> {
  return hits
    .map((hit) => {
      // Simple scoring: prefer landscape, high-res, popular images
      const w = hit.imageWidth || 0
      const h = hit.imageHeight || 0
      const isLandscape = w > h ? 1 : 0
      const resScore = Math.min(w, 1920) / 1920
      const popScore = Math.min((hit.views || 0) + (hit.likes || 0) * 10, 10000) / 10000
      const score = isLandscape * 30 + resScore * 40 + popScore * 30
      return { ...hit, score }
    })
    .sort((a, b) => b.score - a.score)
}
