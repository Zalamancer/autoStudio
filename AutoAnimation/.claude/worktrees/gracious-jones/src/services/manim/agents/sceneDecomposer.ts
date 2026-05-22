// ─── Agent 2: Scene Decomposer ──────────────────────────────────────────────
// Takes a TopicScript and breaks it into SceneSpec[] with spatial grid placements,
// explanation contexts (every 0.5s), and element continuity across scenes.

import type { TopicScript, SceneSpec, ManimGenerationSettings } from '@/services/manim/types'

function buildDecomposerPrompt(script: TopicScript, settings: ManimGenerationSettings): string {
  return `You are an expert Manim animation scene designer. Your job is to decompose a pedagogical script into individual animation scenes with precise spatial layout and rich context metadata.

## Input Script
${JSON.stringify(script, null, 2)}

## Settings
- Aspect Ratio: ${settings.aspectRatio}
- Quality: ${settings.quality}
- Interactive Annotations Enabled: ${settings.enableInteractiveAnnotations}

## Instructions

Break the script into scenes. Each scene should be 15-20 seconds long. For each scene:

1. **Spatial Grid (6x6):** Define where each visual element sits on a 6x6 grid (rows 0-5, cols 0-5).
   - Row 0 = top, Row 5 = bottom
   - Col 0 = left, Col 5 = right
   - Center is approximately (2-3, 2-3)
   - Each element gets: elementId, type (text|formula|shape|graph|arrow|image|numberline|axes|group), anchor {row, col, label}, description

2. **Element Continuity:** Track elements that persist or transform across scenes.
   - For each element continuing from a previous scene, specify: elementId, fromSceneIndex, transform (persist|morph|fadeOut|moveToCorner)

3. **Explanation Contexts:** Generate one ExplanationContext for every 0.5 seconds of the scene. Each context snapshot should include:
   - activeConceptIds: which concepts from the knowledge graph are active at this moment
   - visibleFormulas: LaTeX strings currently visible on screen
   - precedingNarration: what the narrator just said (last ~10 words)
   - followingNarration: what comes next (next ~10 words)
   - suggestedQuestions: 2-3 questions a viewer might ask at this point
   - screenSummary: one-sentence description of what's on screen

4. **Scene Metadata:**
   - index: sequential scene number (0-based)
   - title: short descriptive title
   - durationSeconds: 15-20 seconds
   - animationIntent: natural language description of the Manim animation
   - narrationText: what the narrator says during this scene
   - sectionId: which TopicSection this scene belongs to

Respond with ONLY a JSON array of scene objects (no markdown, no explanation):
[
  {
    "index": number,
    "title": string,
    "durationSeconds": number,
    "animationIntent": string,
    "narrationText": string,
    "elements": [
      {
        "elementId": string,
        "type": "text" | "formula" | "shape" | "graph" | "arrow" | "image" | "numberline" | "axes" | "group",
        "anchor": { "row": number, "col": number, "label": string },
        "description": string
      }
    ],
    "elementContinuity": [
      {
        "elementId": string,
        "fromSceneIndex": number,
        "transform": "persist" | "morph" | "fadeOut" | "moveToCorner"
      }
    ],
    "explanationContexts": [
      {
        "activeConceptIds": string[],
        "visibleFormulas": string[],
        "precedingNarration": string,
        "followingNarration": string,
        "suggestedQuestions": string[],
        "screenSummary": string
      }
    ],
    "sectionId": string
  }
]`
}

function sanitizeLlmJson(text: string): string {
  return (
    text
      // Strip markdown code fences
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()
      // Remove single-line comments (// ...)
      .replace(/^\s*\/\/.*$/gm, '')
      // LLMs sometimes emit JS-style `undefined`
      .replace(/:\s*undefined\b/g, ': null')
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, '$1')
  )
}

function parseJsonFromResponse(text: string): unknown {
  return JSON.parse(sanitizeLlmJson(text))
}

export async function decomposeScenes(script: TopicScript, settings: ManimGenerationSettings): Promise<SceneSpec[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY environment variable')
  }

  const prompt = buildDecomposerPrompt(script, settings)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    },
  )

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${errorBody}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!text) {
    throw new Error('Gemini returned an empty response for scene decomposition')
  }

  const parsed = parseJsonFromResponse(text) as SceneSpec[]

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini response is not a valid SceneSpec array')
  }

  // Validate each scene has required fields
  for (const scene of parsed) {
    if (
      typeof scene.index !== 'number' ||
      !scene.title ||
      !scene.animationIntent ||
      !Array.isArray(scene.elements) ||
      !Array.isArray(scene.explanationContexts)
    ) {
      throw new Error(`Scene ${scene.index} is missing required fields`)
    }
  }

  return parsed
}
