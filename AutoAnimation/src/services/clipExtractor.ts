/**
 * Clip Extractor — Identifies the best standalone segments from a long transcript
 * for repurposing into short-form content.
 */

import { withCreditGate } from './creditGate'
import type { WhisperSegment } from './whisperTranscript'
import { callGeminiProxy } from '@/services/aiProxy'

export interface ExtractedClip {
  id: string
  title: string
  hookRewrite: string
  startTime: number
  endTime: number
  duration: number
  viralityScore: number
  segments: WhisperSegment[]
  reason: string
  /** Thumbnail image data URL for the clip */
  thumbnailDataUrl?: string
  /** Blob URL of the sliced video preview segment */
  videoPreviewUrl?: string
  /** Visual cut points within the clip */
  sceneTransitions?: number[]
  /** Emotional arc shape: rising, falling, climax, or flat */
  emotionalArc?: 'rising' | 'falling' | 'climax' | 'flat'
}

const PROXY_MODEL = 'gemini-3-flash-preview'

/**
 * Analyze a full transcript and identify the best 3-5 viral clip segments.
 */
export async function extractBestClips(segments: WhisperSegment[], totalDuration: number): Promise<ExtractedClip[]> {
  return withCreditGate('gemini-script', async () => {
    const fullText = segments.map((s) => `[${formatTime(s.start)}] ${s.text.trim()}`).join('\n')

    const prompt = `You are a viral content strategist. Analyze this transcript and identify the 3-5 best standalone segments that would work as viral short-form videos (30-90 seconds each).

TRANSCRIPT (total: ${totalDuration.toFixed(0)}s):
${fullText}

For each segment identify:
- Exact start and end timestamps
- A catchy title (max 8 words)
- A rewritten hook (first sentence, attention-grabbing)
- A virality score (0-100)
- Why this segment works as a standalone clip

Return JSON:
{
  "clips": [
    {
      "title": "...",
      "hookRewrite": "...",
      "startTime": 12.5,
      "endTime": 55.0,
      "viralityScore": 82,
      "reason": "..."
    }
  ]
}`

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }

    const response = await callGeminiProxy(PROXY_MODEL, body)

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`)

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const parsed = JSON.parse(cleaned)

    const clips: ExtractedClip[] = (parsed.clips || []).map((clip: Record<string, unknown>, i: number) => {
      const startTime = Number(clip.startTime) || 0
      const endTime = Number(clip.endTime) || startTime + 30
      return {
        id: `clip-${i})`,
        title: String(clip.title || `Clip ${i + 1}`),
        hookRewrite: String(clip.hookRewrite || ''),
        startTime,
        endTime,
        duration: endTime - startTime,
        viralityScore: Number(clip.viralityScore) || 50,
        segments: segments.filter((s) => s.start >= startTime && s.end <= endTime),
        reason: String(clip.reason || ''),
      }
    })

    // Sort by virality score descending
    clips.sort((a, b) => b.viralityScore - a.viralityScore)
    return clips
  })
}

/**
 * Use Gemini to rewrite a clip's hook into a more attention-grabbing opening line.
 */
export async function rewriteClipHook(clip: ExtractedClip): Promise<string> {
  return withCreditGate('gemini-script', async () => {
    const transcriptText = clip.segments.map((s) => s.text.trim()).join(' ')

    const prompt = `Rewrite the opening of this clip transcript into an attention-grabbing hook for a short-form video. The hook should be 1-2 sentences max, create curiosity or surprise, and make viewers want to keep watching.

Original text: "${transcriptText.slice(0, 300)}"
Original hook: "${clip.hookRewrite}"

Return ONLY the rewritten hook text, no quotes or explanation.`

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
    }

    const response = await callGeminiProxy(PROXY_MODEL, body)

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`)

    const data = await response.json()
    return (data.candidates?.[0]?.content?.parts?.[0]?.text || clip.hookRewrite).trim()
  })
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
