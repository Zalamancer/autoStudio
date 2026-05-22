/**
 * Virality Score Worker -- client-side heuristic scoring engine that
 * evaluates a project's viral potential across 9 weighted factors
 * (0-100 total). Optionally offloads a deep Gemini API analysis to
 * a Web Worker for AI-enhanced scoring.
 *
 * Factor breakdown (max 100 points):
 *   Hook strength (text/CTA in first 3s):       0-15
 *   Pacing (cuts/transitions present):           0-10
 *   Captions present:                            0-10
 *   Audio (voice + music):                       0-15
 *   Aspect ratio optimal for platform:           0-10
 *   Duration in optimal range (15-60s):          0-10
 *   Text overlays present:                       0-10
 *   Character animation present:                 0-10
 *   B-roll / media variety:                      0-10
 */

import type { ViralScore } from '@/types/orchestrator'

export interface ClipMetadataForWorker {
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
  hookStrengthFirstThreeSeconds: number
  cutsPerMinute: number
  averageLineDuration: number
  hasOpeningVisual: boolean
  trendKeywords: string[]
}

export interface ViralityFactor {
  name: string
  label: string
  points: number
  maxPoints: number
  impact: 'positive' | 'negative' | 'neutral'
}

export interface ClientSideViralityResult {
  score: ViralScore
  factors: ViralityFactor[]
}

// ── Client-side heuristic scorer ──────────────────────────────────────

/**
 * Score clip virality entirely on the client using weighted heuristics.
 * Returns a 0-100 overall score plus per-factor breakdown.
 */
export function scoreClientSide(metadata: ClipMetadataForWorker): ClientSideViralityResult {
  const factors: ViralityFactor[] = []

  // 1. Hook strength: text/CTA in first 3 seconds (0-15 pts)
  let hookPoints = 0
  if (metadata.hasHook) {
    hookPoints += 8
  }
  if (metadata.hasCTA) {
    hookPoints += 4
  }
  if (metadata.hasOpeningVisual) {
    hookPoints += 3
  }
  hookPoints = Math.min(15, hookPoints)
  factors.push({
    name: 'hookStrength',
    label: hookPoints >= 10
      ? 'Strong opening hook with text/CTA in first 3s'
      : hookPoints > 0
        ? 'Partial hook detected; add a CTA or text overlay early'
        : 'No hook in the first 3 seconds',
    points: hookPoints,
    maxPoints: 15,
    impact: hookPoints >= 10 ? 'positive' : hookPoints > 0 ? 'neutral' : 'negative',
  })

  // 2. Pacing: cuts/transitions present (0-10 pts)
  let pacingPoints = 0
  const cutsPerMin = metadata.cutsPerMinute
  if (cutsPerMin >= 8) {
    pacingPoints = 10
  } else if (cutsPerMin >= 4) {
    pacingPoints = 7
  } else if (cutsPerMin >= 2) {
    pacingPoints = 4
  } else if (metadata.templateCount > 0 || metadata.stockMediaCount > 0) {
    pacingPoints = 2
  }
  factors.push({
    name: 'pacing',
    label: pacingPoints >= 7
      ? `Good pacing with ${cutsPerMin.toFixed(0)} cuts/min`
      : pacingPoints > 0
        ? 'Add more visual cuts or transitions for better pacing'
        : 'No visual cuts detected; consider adding transitions or B-roll',
    points: pacingPoints,
    maxPoints: 10,
    impact: pacingPoints >= 7 ? 'positive' : pacingPoints > 0 ? 'neutral' : 'negative',
  })

  // 3. Captions present (0-10 pts)
  let captionPoints = 0
  if (metadata.captionStyle && metadata.captionStyle !== 'none') {
    captionPoints = 10
  }
  factors.push({
    name: 'captions',
    label: captionPoints > 0
      ? `Captions enabled (${metadata.captionStyle})`
      : 'No captions; 80% of viewers watch without sound',
    points: captionPoints,
    maxPoints: 10,
    impact: captionPoints > 0 ? 'positive' : 'negative',
  })

  // 4. Audio: voice + music (0-15 pts)
  let audioPoints = 0
  if (metadata.dialogueCount > 0) {
    audioPoints += 10 // has voice/dialogue
  }
  if (metadata.hasMusic) {
    audioPoints += 5
  }
  audioPoints = Math.min(15, audioPoints)
  factors.push({
    name: 'audio',
    label: audioPoints >= 12
      ? 'Voice narration and background music present'
      : audioPoints >= 10
        ? 'Has voice but no background music; music boosts retention'
        : audioPoints >= 5
          ? 'Music present but no voice narration'
          : 'No audio detected; add voice or music',
    points: audioPoints,
    maxPoints: 15,
    impact: audioPoints >= 10 ? 'positive' : audioPoints > 0 ? 'neutral' : 'negative',
  })

  // 5. Aspect ratio optimal for platform (0-10 pts)
  // 9:16 is optimal for TikTok/Reels/Shorts; 1:1 is decent; others penalized
  let aspectPoints = 0
  if (metadata.aspectRatio === '9:16') {
    aspectPoints = 10
  } else if (metadata.aspectRatio === '1:1') {
    aspectPoints = 6
  } else if (metadata.aspectRatio === '4:3') {
    aspectPoints = 3
  } else {
    aspectPoints = 1 // 16:9 or 21:9 not ideal for short-form
  }
  factors.push({
    name: 'aspectRatio',
    label: aspectPoints >= 10
      ? 'Optimal 9:16 vertical format for short-form'
      : aspectPoints >= 6
        ? '1:1 square format; 9:16 performs better on TikTok/Reels'
        : `${metadata.aspectRatio} not ideal for short-form; switch to 9:16`,
    points: aspectPoints,
    maxPoints: 10,
    impact: aspectPoints >= 6 ? 'positive' : aspectPoints >= 3 ? 'neutral' : 'negative',
  })

  // 6. Duration in optimal range 15-60s (0-10 pts)
  let durationPoints = 0
  const dur = metadata.durationSeconds
  if (dur >= 15 && dur <= 60) {
    durationPoints = 10
  } else if (dur > 60 && dur <= 90) {
    durationPoints = 6
  } else if (dur >= 10 && dur < 15) {
    durationPoints = 5
  } else if (dur > 90) {
    durationPoints = 2
  } else {
    durationPoints = 1 // under 10s
  }
  factors.push({
    name: 'duration',
    label: durationPoints >= 10
      ? `Duration ${Math.round(dur)}s is in the optimal 15-60s range`
      : dur > 60
        ? `${Math.round(dur)}s is long; trim to under 60s for better completion rate`
        : `${Math.round(dur)}s is short; aim for 15-60s for better engagement`,
    points: durationPoints,
    maxPoints: 10,
    impact: durationPoints >= 8 ? 'positive' : durationPoints >= 5 ? 'neutral' : 'negative',
  })

  // 7. Text overlays present (0-10 pts)
  let textPoints = 0
  if (metadata.textOverlayCount >= 3) {
    textPoints = 10
  } else if (metadata.textOverlayCount === 2) {
    textPoints = 7
  } else if (metadata.textOverlayCount === 1) {
    textPoints = 4
  }
  factors.push({
    name: 'textOverlays',
    label: textPoints >= 7
      ? `${metadata.textOverlayCount} text overlays add visual engagement`
      : textPoints > 0
        ? 'Add more text overlays (title, CTA) for visual interest'
        : 'No text overlays; add titles or key points as text',
    points: textPoints,
    maxPoints: 10,
    impact: textPoints >= 7 ? 'positive' : textPoints > 0 ? 'neutral' : 'negative',
  })

  // 8. Character animation present (0-10 pts)
  let charPoints = 0
  if (metadata.characterCount >= 2) {
    charPoints = 10
  } else if (metadata.characterCount === 1) {
    charPoints = 7
  }
  factors.push({
    name: 'characterAnimation',
    label: charPoints >= 10
      ? `${metadata.characterCount} animated characters add personality`
      : charPoints > 0
        ? 'Single character; multi-character dialogue boosts engagement'
        : 'No characters; animated characters increase watch time',
    points: charPoints,
    maxPoints: 10,
    impact: charPoints >= 7 ? 'positive' : charPoints > 0 ? 'neutral' : 'negative',
  })

  // 9. B-roll / media variety (0-10 pts)
  let mediaPoints = 0
  const totalMedia = metadata.stockMediaCount + metadata.svgObjectCount + metadata.templateCount
  if (totalMedia >= 4) {
    mediaPoints = 10
  } else if (totalMedia >= 2) {
    mediaPoints = 7
  } else if (totalMedia >= 1) {
    mediaPoints = 4
  }
  factors.push({
    name: 'mediaVariety',
    label: mediaPoints >= 7
      ? `${totalMedia} media elements provide visual variety`
      : mediaPoints > 0
        ? 'Limited B-roll; add stock media, templates, or SVG objects'
        : 'No B-roll or supporting visuals; add stock media or templates',
    points: mediaPoints,
    maxPoints: 10,
    impact: mediaPoints >= 7 ? 'positive' : mediaPoints > 0 ? 'neutral' : 'negative',
  })

  // Sum up total score (max 100)
  const overall = factors.reduce((sum, f) => sum + f.points, 0)

  // Map factors to dimension scores (0-100 scale) for the ViralScore type
  const dimensions = {
    hook: Math.round((hookPoints / 15) * 100),
    pacing: Math.round((pacingPoints / 10) * 100),
    trend: Math.round(((aspectPoints + durationPoints) / 20) * 100),
    emotion: Math.round(((audioPoints + charPoints) / 25) * 100),
    visual: Math.round(((textPoints + mediaPoints) / 20) * 100),
    rewatch: Math.round(((captionPoints + pacingPoints) / 20) * 100),
  }

  // Build suggestions from negative/neutral factors
  const suggestions: string[] = factors
    .filter((f) => f.impact !== 'positive')
    .sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points))
    .slice(0, 5)
    .map((f) => f.label)

  return {
    score: {
      overall,
      dimensions,
      suggestions,
    },
    factors,
  }
}

// ── Gemini Web Worker for deep AI analysis (optional) ─────────────────

interface WorkerMessage {
  type: 'score'
  metadata: ClipMetadataForWorker
  prompt: string
  apiKey: string
}

interface WorkerResult {
  type: 'result'
  score: ViralScore
}

interface WorkerError {
  type: 'error'
  message: string
}

const workerCode = `
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

self.onmessage = async function(e) {
  const { metadata, prompt, apiKey } = e.data;

  const scoringPrompt = 'You are a viral video analyst. Score this short-form video clip for virality potential.' +
    '\\n\\nCLIP DETAILS:' +
    '\\n- Original prompt: "' + prompt + '"' +
    '\\n- Duration: ' + metadata.durationSeconds + 's' +
    '\\n- Characters: ' + metadata.characterCount +
    '\\n- Dialogue lines: ' + metadata.dialogueCount +
    '\\n- Text overlays: ' + metadata.textOverlayCount +
    '\\n- Has CTA: ' + metadata.hasCTA +
    '\\n- Has hook (first 3s): ' + metadata.hasHook +
    '\\n- Hook strength (first 3s): ' + metadata.hookStrengthFirstThreeSeconds + '/100' +
    '\\n- Cuts per minute: ' + metadata.cutsPerMinute +
    '\\n- Average line duration: ' + metadata.averageLineDuration.toFixed(1) + 's' +
    '\\n- Has opening visual: ' + metadata.hasOpeningVisual +
    '\\n- Caption style: ' + metadata.captionStyle +
    '\\n- Aspect ratio: ' + metadata.aspectRatio +
    '\\n- Has background music: ' + metadata.hasMusic +
    '\\n- Templates: ' + metadata.templateCount +
    '\\n- SVG objects: ' + metadata.svgObjectCount +
    '\\n- Stock media: ' + metadata.stockMediaCount +
    '\\n- Topics: ' + metadata.topics.join(', ') +
    '\\n- Trend keywords: ' + metadata.trendKeywords.join(', ') +
    '\\n\\nScore each dimension 0-100 and provide 3-5 specific improvement suggestions.' +
    '\\n\\nOutput valid JSON:' +
    '\\n{' +
    '\\n  "overall": 72,' +
    '\\n  "dimensions": { "hook": 80, "pacing": 65, "trend": 70, "emotion": 75, "visual": 68, "rewatch": 60 },' +
    '\\n  "suggestions": ["Add a text hook in the first 2 seconds", "Include trending hashtag-worthy topic reference"]' +
    '\\n}';

  try {
    const response = await fetch(GEMINI_API_URL + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: scoringPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        tools: [{ googleSearch: {} }],
      }),
    });

    if (!response.ok) throw new Error('Gemini API error: ' + response.status);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    const score = JSON.parse(text);
    self.postMessage({ type: 'result', score });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'Scoring failed' });
  }
};
`

let workerInstance: Worker | null = null

function getWorker(): Worker | null {
  if (workerInstance) return workerInstance

  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    workerInstance = new Worker(url)
    return workerInstance
  } catch {
    // Worker API unavailable (e.g. SSR context)
    return null
  }
}

/**
 * Score clip virality using a Web Worker (Gemini AI).
 * Falls back to client-side heuristic scoring if the Worker API is
 * unavailable or the Gemini key is not configured.
 */
export function scoreViaWorker(
  metadata: ClipMetadataForWorker,
  prompt: string,
): Promise<ViralScore> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  // If no API key, use client-side scoring directly
  if (!apiKey) {
    const { score } = scoreClientSide(metadata)
    return Promise.resolve(score)
  }

  const worker = getWorker()

  if (!worker) {
    // Fallback: client-side heuristic scoring
    const { score } = scoreClientSide(metadata)
    return Promise.resolve(score)
  }

  return new Promise<ViralScore>((resolve, _reject) => {
    const timeout = setTimeout(() => {
      worker.removeEventListener('message', onMessage)
      // Timeout after 15s — fall back to client-side scoring
      const { score } = scoreClientSide(metadata)
      resolve(score)
    }, 15000)

    const onMessage = (e: MessageEvent<WorkerResult | WorkerError>) => {
      clearTimeout(timeout)
      worker.removeEventListener('message', onMessage)
      if (e.data.type === 'result') {
        resolve(e.data.score)
      } else {
        // Gemini failed — fall back to client-side scoring
        const { score } = scoreClientSide(metadata)
        resolve(score)
      }
    }

    worker.addEventListener('message', onMessage)
    worker.postMessage({ type: 'score', metadata, prompt, apiKey } as WorkerMessage)
  })
}
