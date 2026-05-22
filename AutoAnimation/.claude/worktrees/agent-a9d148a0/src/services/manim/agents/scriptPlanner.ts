// ─── Agent 1: Script Planner ────────────────────────────────────────────────
// Takes a topic prompt + settings and generates a pedagogical TopicScript
// with sections, knowledge graph, and duration hints.

import type { TopicScript, ManimGenerationSettings } from '@/services/manim/types'

function buildPlannerPrompt(settings: ManimGenerationSettings): string {
  return `You are an expert educational content planner specializing in mathematical and scientific topics.

Your task: Create a detailed pedagogical script plan for an animated explainer video.

Topic: "${settings.topic}"
Target Duration: ${settings.targetDurationMinutes} minutes
Difficulty Level: ${settings.difficulty}
Aspect Ratio: ${settings.aspectRatio}

Instructions:
1. Build a knowledge graph of the key concepts needed to explain this topic. Each concept should have:
   - A unique id (kebab-case, e.g. "pythagorean-theorem")
   - A clear name
   - A concise definition
   - An optional formula (LaTeX string)
   - Prerequisites (IDs of concepts that must be understood first)
   - Related concepts (IDs of connected concepts)

2. Break the explanation into logical sections. Each section should have:
   - A unique id (kebab-case)
   - A descriptive title
   - Full narration text (what the narrator will say)
   - Which concept IDs are active/relevant in this section
   - A duration hint in seconds (all sections should sum to roughly ${settings.targetDurationMinutes * 60} seconds)
   - A visual intent describing what animation should accompany the narration

3. Adapt complexity to the "${settings.difficulty}" level:
   - beginner: Use analogies, minimal formulas, step-by-step buildup
   - intermediate: Include formulas with explanations, moderate pacing
   - advanced: Dense content, proofs, edge cases, faster pacing

4. Write a brief summary of the entire video.

Respond with ONLY a JSON object matching this exact schema (no markdown, no explanation):
{
  "topic": string,
  "targetDurationSeconds": number,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "sections": [
    {
      "id": string,
      "title": string,
      "narrationText": string,
      "conceptIds": string[],
      "durationHintSeconds": number,
      "visualIntent": string
    }
  ],
  "knowledgeGraph": [
    {
      "id": string,
      "name": string,
      "definition": string,
      "formula": null | string,
      "prerequisites": string[],
      "relatedConcepts": string[]
    }
  ],
  "summary": string
}`
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

export async function planScript(settings: ManimGenerationSettings): Promise<TopicScript> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY environment variable')
  }

  const prompt = buildPlannerPrompt(settings)

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
    throw new Error('Gemini returned an empty response for script planning')
  }

  const parsed = parseJsonFromResponse(text) as TopicScript

  // Validate essential fields
  if (!parsed.topic || !Array.isArray(parsed.sections) || !Array.isArray(parsed.knowledgeGraph)) {
    throw new Error('Gemini response is missing required TopicScript fields')
  }

  return parsed
}
