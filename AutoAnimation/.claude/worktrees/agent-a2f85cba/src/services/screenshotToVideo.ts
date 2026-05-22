/**
 * screenshotToVideo.ts — AI-powered Screenshot-to-Video service.
 *
 * Takes uploaded screenshots, uses Gemini vision to analyze content,
 * generates narration scripts, and builds a ClipPlan for the orchestrator
 * to produce a walkthrough video.
 */

import { useScreenshotToVideoStore } from '@/stores/useScreenshotToVideoStore'
import type { ScreenshotAnalysis, ScreenshotAsset } from '@/types/screenshotToVideo'
import type { ClipPlan } from '@/types/orchestrator'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/**
 * Analyze a single screenshot using Gemini vision API.
 */
export async function analyzeScreenshot(
  screenshot: ScreenshotAsset,
  index: number,
  total: number,
): Promise<ScreenshotAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  const prompt = `Analyze this screenshot (image ${index + 1} of ${total} in a walkthrough sequence) and return a JSON object with this structure:
{
  "description": "brief description of what the screenshot shows",
  "contentType": "website" | "app" | "dashboard" | "diagram" | "presentation" | "other",
  "annotations": [
    {
      "region": "name of the UI element or area",
      "description": "what this region shows and why it matters",
      "bbox": { "x": 0, "y": 0, "width": 100, "height": 100 }
    }
  ],
  "narrationScript": "A natural narration script (2-4 sentences) explaining what the viewer sees and should pay attention to, in second person.",
  "suggestedTransition": "fade" | "slide-left" | "zoom-in" | "ken-burns",
  "suggestedDuration": 5
}

The bbox coordinates should be percentages (0-100) of the image dimensions.
Focus annotations on the 3-5 most important areas.
The narration should flow naturally as part of a video walkthrough.
Return ONLY the JSON, no markdown.`

  // Build request with image
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

  // Add the image
  const base64 = screenshot.dataUrl.split(',')[1]
  if (base64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: base64,
      },
    })
  }

  parts.push({ text: prompt })

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  try {
    return JSON.parse(text) as ScreenshotAnalysis
  } catch {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ScreenshotAnalysis
    }
    throw new Error('Failed to parse Gemini response as JSON')
  }
}

/**
 * Analyze all screenshots in sequence.
 */
export async function analyzeAllScreenshots(): Promise<void> {
  const store = useScreenshotToVideoStore.getState()
  const { screenshots } = store

  if (screenshots.length === 0) {
    store.setError('No screenshots to analyze')
    return
  }

  store.setPhase('analyzing')
  store.setProgress(0)

  try {
    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i]
      const analysis = await analyzeScreenshot(screenshot, i, screenshots.length)
      store.setAnalysis(screenshot.id, analysis)
      store.setProgress(Math.round(((i + 1) / screenshots.length) * 100))
    }

    // Build combined narration script
    const analyses = useScreenshotToVideoStore.getState().analyses
    const scripts = screenshots.map((ss) => analyses[ss.id]?.narrationScript || '').filter(Boolean)
    store.setFullScript(scripts.join('\n\n'))

    store.setPhase('review')
  } catch (err) {
    store.setError(err instanceof Error ? err.message : 'Analysis failed')
  }
}

/**
 * Build a ClipPlan from analyzed screenshots for the orchestrator.
 */
export function buildClipPlanFromScreenshots(): ClipPlan {
  const store = useScreenshotToVideoStore.getState()
  const { screenshots, analyses, config } = store

  const aspectDimensions: Record<string, { w: number; h: number }> = {
    '16:9': { w: 1920, h: 1080 },
    '9:16': { w: 1080, h: 1920 },
    '1:1': { w: 1080, h: 1080 },
  }

  const dims = aspectDimensions[config.aspectRatio] || aspectDimensions['16:9']

  // Calculate total duration
  let totalDuration = 0
  const screenDurations: number[] = []
  for (const ss of screenshots) {
    const analysis = analyses[ss.id]
    const dur = config.secondsPerScreenshot > 0 ? config.secondsPerScreenshot : analysis?.suggestedDuration || 5
    screenDurations.push(dur)
    totalDuration += dur
  }

  // Build dialogue lines from narration scripts
  const dialogueLines: ClipPlan['dialogue'] = []
  let _accumulatedTime = 0
  for (let i = 0; i < screenshots.length; i++) {
    const ss = screenshots[i]
    const analysis = analyses[ss.id]
    if (!analysis?.narrationScript) continue

    dialogueLines.push({
      characterName: 'Narrator',
      script: `[neutral] ${analysis.narrationScript}`,
      emotion: 'neutral',
    })
    _accumulatedTime += screenDurations[i]
  }

  // Build stock media entries for screenshots as background images
  // Use startPercent/endPercent as required by ClipPlanStockMedia
  const stockMedia: ClipPlan['stockMedia'] = screenshots.map((ss, i) => {
    const startTime = screenDurations.slice(0, i).reduce((a, b) => a + b, 0)
    const endTime = startTime + screenDurations[i]
    const analysis = analyses[ss.id]

    return {
      query: ss.name,
      type: 'image' as const,
      role: 'background' as const,
      position: { x: 50, y: 50 },
      scale: 1,
      startPercent: startTime / totalDuration,
      endPercent: endTime / totalDuration,
      enterTransition: (analysis?.suggestedTransition || 'fade') as 'fade',
    }
  })

  // Build highlight shapes for annotations
  const shapes: ClipPlan['shapes'] = []
  if (config.showHighlights) {
    let accTime = 0
    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i]
      const analysis = analyses[ss.id]
      if (!analysis?.annotations) {
        accTime += screenDurations[i]
        continue
      }

      const annotDuration = screenDurations[i] / Math.max(1, analysis.annotations.length)
      for (let j = 0; j < analysis.annotations.length; j++) {
        const annot = analysis.annotations[j]
        const shapeStart = accTime + j * annotDuration
        shapes.push({
          type: 'rectangle',
          position: {
            x: annot.bbox.x + annot.bbox.width / 2,
            y: annot.bbox.y + annot.bbox.height / 2,
          },
          width: (annot.bbox.width / 100) * dims.w,
          height: (annot.bbox.height / 100) * dims.h,
          fill: 'transparent',
          opacity: 0.8,
          startPercent: shapeStart / totalDuration,
          endPercent: (shapeStart + annotDuration) / totalDuration,
        })
      }
      accTime += screenDurations[i]
    }
  }

  const plan: ClipPlan = {
    canvas: {
      aspectRatio: config.aspectRatio as ClipPlan['canvas']['aspectRatio'],
      fps: 30,
      durationSeconds: totalDuration,
    },
    background: {
      type: 'lottie',
      lottieQuery: 'minimal dark',
    },
    characters: [
      {
        name: 'Narrator',
        position: { x: 85, y: 75 },
        scale: 0.8,
        voiceName: config.voiceId || 'Rachel',
      },
    ],
    dialogue: dialogueLines,
    textOverlays: [],
    shapes,
    stockMedia,
    captions: {
      style: 'word-by-word',
      position: 'bottom',
      fontSize: 24,
    },
  }

  return plan
}

/**
 * Convert a File to a ScreenshotAsset with data URL.
 */
export function fileToScreenshotAsset(file: File): Promise<Omit<ScreenshotAsset, 'id' | 'order'>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        resolve({
          name: file.name,
          url: URL.createObjectURL(file),
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = dataUrl
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
