/**
 * Virality Analysis API route: Deep analysis using Gemini.
 *
 * Endpoints:
 *   POST /analyze — Deep NLP analysis of script and features
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || null
}

router.post('/analyze', async (req: Request, res: Response) => {
  const geminiKey = getGeminiKey()
  if (!geminiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' })
  }

  const { script, features } = req.body
  if (!script || typeof script !== 'string') {
    return res.status(400).json({ error: 'Script text required' })
  }

  try {
    const prompt = `You are a viral content analyst for short-form video (TikTok, YouTube Shorts, Instagram Reels). Analyze this video script and provide actionable feedback.

SCRIPT:
"${script.slice(0, 3000)}"

FEATURES:
- Duration: ${features?.durationSeconds || 0}s
- Dialogue lines: ${features?.dialogueLineCount || 0}
- Emotion variety: ${features?.emotionVariety || 0} distinct emotions
- Speaking rate: ${features?.wpm || 0} WPM
- Has background music: ${features?.hasBackgroundMusic || false}
- Caption style: ${features?.captionStyle || 'none'}
- Aspect ratio: ${features?.aspectRatio || '16:9'}
- First line: "${features?.firstLineText || ''}"

Respond with ONLY valid JSON (no markdown):
{
  "adjustedScores": {
    "hook": 0-100,
    "pacing": 0-100,
    "emotion": 0-100,
    "audio": 0-100,
    "captions": 0-100,
    "content": 0-100,
    "platform": 0-100
  },
  "nlpImprovements": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3"
  ],
  "percentile": 0-100
}

Base your scores on what actually drives viral engagement in 2024-2025 short-form content. Be harsh but constructive.`

    const response = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(502).json({ error: `Gemini API error: ${response.status}`, detail: text })
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return res.status(502).json({ error: 'No response from Gemini' })
    }

    // Parse JSON from response (strip any markdown fences)
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(jsonStr)

    return res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: `Analysis failed: ${message}` })
  }
})

export default router
