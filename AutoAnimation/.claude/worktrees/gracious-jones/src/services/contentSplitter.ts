/**
 * Content Splitter — Takes long-form content (article, transcript, blog post)
 * and splits it into multiple short-form video scripts via Gemini.
 */

import { withCreditGate } from './creditGate'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

export interface ShortFormScript {
  id: string
  title: string
  hook: string
  body: string
  cta: string
  /** Full orchestrator prompt for this clip */
  prompt: string
  suggestedDuration: number
  emotionCues: string[]
  /** Topic/angle for this specific clip */
  angle: string
}

export interface SplitResult {
  scripts: ShortFormScript[]
  sourceTitle: string
  totalClips: number
}

/**
 * Split long-form content into short-form video scripts.
 */
export async function splitIntoShortForm(
  content: string,
  options: {
    maxClips?: number
    minDuration?: number
    maxDuration?: number
    targetPlatform?: string
  } = {},
): Promise<SplitResult> {
  return withCreditGate('content-split', () =>
    _splitImpl(content, options),
  )
}

async function _splitImpl(
  content: string,
  options: {
    maxClips?: number
    minDuration?: number
    maxDuration?: number
    targetPlatform?: string
  },
): Promise<SplitResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const maxClips = options.maxClips || 7
  const minDuration = options.minDuration || 30
  const maxDuration = options.maxDuration || 60
  const platform = options.targetPlatform || 'tiktok'

  // Truncate very long content
  const maxChars = 20000
  const truncated =
    content.length > maxChars
      ? content.slice(0, maxChars) + '\n[... content truncated ...]'
      : content

  const prompt = `You are a viral content strategist. Split this long-form content into ${maxClips} or fewer standalone short-form video scripts optimized for ${platform}.

CONTENT:
${truncated}

REQUIREMENTS:
- Each clip should be ${minDuration}-${maxDuration} seconds long
- Each clip must have a unique angle/topic extracted from the content
- Each script must be self-contained (viewer doesn't need to see other clips)
- Include a strong hook (first 3 seconds), key message body, and CTA
- Add [emotion] cues in the dialogue (e.g. [excited], [serious], [surprised])
- The "prompt" field should be a complete AI Director prompt that describes the full video

Output valid JSON:
{
  "sourceTitle": "Original Content Title",
  "scripts": [
    {
      "id": "clip_1",
      "title": "Catchy Clip Title",
      "hook": "Did you know that...",
      "body": "Main content of the script with [excited] emotion cues...",
      "cta": "Follow for more!",
      "prompt": "Create a 30-second video about [topic]. A narrator [excited] says: 'Did you know that...' then [serious] explains the key point. End with a CTA overlay 'Follow for more!'",
      "suggestedDuration": 30,
      "emotionCues": ["excited", "serious"],
      "angle": "The surprising fact about X"
    }
  ]
}`

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  const parsed = JSON.parse(text)

  return {
    scripts: parsed.scripts || [],
    sourceTitle: parsed.sourceTitle || 'Untitled',
    totalClips: (parsed.scripts || []).length,
  }
}
