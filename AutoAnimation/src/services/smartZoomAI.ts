/**
 * Smart Zoom AI — Gemini-based emphasis detection for camera zoom.
 *
 * Sends transcript text to Gemini and asks it to identify the most
 * important/dramatic/engaging moments with timestamps.
 */

import type { ZoomPoint } from '@/types/smartZoom'
import type { WhisperWord } from '@/services/whisperTranscript'
import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_API_URL = 'gemini-3-flash-preview' // model name for callGeminiProxy

interface GeminiZoomMoment {
  timestamp: number // seconds
  intensity: number // 0.5-1.0
  reason: string
}

/**
 * Use Gemini to detect semantic emphasis points beyond heuristics.
 */
export async function detectEmphasisWithAI(
  transcriptText: string,
  words: WhisperWord[],
  fps: number,
): Promise<ZoomPoint[]> {
  // Build a timestamped transcript for context
  const duration = words.length > 0 ? words[words.length - 1].end : 0
  const prompt = `You are a video editor analyzing a transcript for dramatic emphasis. The transcript is ${duration.toFixed(1)} seconds long.

Identify the 5-10 most important moments that deserve a camera zoom. For each, provide the exact timestamp (in seconds) and intensity (0.5 to 1.0).

Focus on:
- Emotional peaks
- Key revelations or important information
- Punchlines or humor
- Turning points in the narrative
- Call-to-action moments
- Dramatic pauses followed by important statements

Transcript:
"""
${transcriptText}
"""

Respond ONLY with a JSON array. Each element should have: timestamp (number, seconds), intensity (number, 0.5-1.0), reason (string, brief description).
Example: [{"timestamp": 3.5, "intensity": 0.8, "reason": "Key revelation about the topic"}]`

  const response = await callGeminiProxy(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.warn('[SmartZoomAI] Could not parse JSON from Gemini response:', text)
    return []
  }

  try {
    const moments: GeminiZoomMoment[] = JSON.parse(jsonMatch[0])

    return moments
      .filter((m) => typeof m.timestamp === 'number' && typeof m.intensity === 'number')
      .map((m) => ({
        frame: Math.round(m.timestamp * fps),
        intensity: Math.min(1, Math.max(0.5, m.intensity)),
        type: 'ai-detected' as const,
        description: m.reason || 'AI-detected emphasis',
      }))
  } catch (err) {
    console.warn('[SmartZoomAI] Failed to parse Gemini response:', err)
    return []
  }
}
