/**
 * Chat Refiner — Iterative AI co-editing via Gemini.
 *
 * Sends the current project state + user message to Gemini
 * and receives a partial ClipPlan diff describing only changes needed.
 */

import type { ClipPlan, StepType } from '@/types/orchestrator'
import { GEMINI_API_URL } from './constants'
import { logger } from '@/utils/logger'

// ── Types ──

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  /** Which plan sections were modified (if assistant message) */
  modifiedSections?: string[]
  /** The diff that was applied (if assistant message) */
  appliedDiff?: Partial<ClipPlan>
}

export interface ChatRefineResult {
  /** Natural language response to the user */
  response: string
  /** Partial ClipPlan with only changed fields */
  diff: Partial<ClipPlan>
  /** Which orchestrator steps need re-execution */
  stepsToRerun: StepType[]
  /** Summary of what changed */
  changesSummary: string[]
}

// ── Step Mapping ──

/**
 * Determine which orchestrator steps need re-execution based on which
 * sections of the ClipPlan were modified.
 */
export function diffToSteps(diff: Partial<ClipPlan>): StepType[] {
  const steps: StepType[] = []

  if (diff.canvas) steps.push('setup-canvas')
  if (diff.background) steps.push('setup-background')
  if (diff.characters) steps.push('setup-characters')
  if (diff.dialogue) {
    steps.push('generate-voices', 'setup-dialogue')
  }
  if (diff.textOverlays) steps.push('setup-text-overlays')
  if (diff.shapes) steps.push('setup-shapes')
  if (diff.htmlTemplates) steps.push('setup-html-templates')
  if (diff.svgObjects) steps.push('generate-svg-objects')
  if (diff.stockMedia) steps.push('setup-stock-media')
  if (diff.captions) steps.push('setup-captions')

  // Always finalize after any change
  if (steps.length > 0) steps.push('finalize-timeline')

  return steps
}

// ── Prompt Construction ──

function buildRefinePrompt(
  userMessage: string,
  currentPlan: ClipPlan,
  chatHistory: ChatMessage[],
): string {
  const historyText = chatHistory
    .slice(-6) // Last 6 messages for context
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  return `You are an AI video editor assistant for ProAnimate, a short-form video creation studio.

The user has already generated a video clip plan. They want to make iterative refinements via chat.

## Current Clip Plan
\`\`\`json
${JSON.stringify(currentPlan, null, 2)}
\`\`\`

## Recent Chat History
${historyText || '(No previous messages)'}

## User Request
"${userMessage}"

## Your Task
Respond with a JSON object containing:
1. \`response\` — A friendly, concise response to the user explaining what you changed (1-2 sentences)
2. \`diff\` — A partial ClipPlan object containing ONLY the fields that need to change. Use the exact same structure as ClipPlan but only include modified fields. For arrays (dialogue, characters, textOverlays, etc.), include the COMPLETE array with all items (modified and unmodified).
3. \`changesSummary\` — Array of short bullet points describing each change

## Rules
- Only modify what the user asks for. Do not change unrelated fields.
- For dialogue changes, preserve existing emotion cues unless asked to change them.
- Character positions are 0-100 (percentage of canvas). 50,50 = center.
- Text overlay presets: title, subtitle, lower-third, cta, quote, watermark.
- startPercent/endPercent are 0-1 fractions of total duration.
- Aspect ratios: 16:9, 9:16, 1:1, 4:3, 21:9.
- Caption styles: word-by-word, sentence, karaoke, animated-pop, animated-bounce, animated-glow, animated-wave.
- If the user asks to add something new (character, dialogue line, text overlay), add it to the appropriate array.
- If the user asks to remove something, remove it from the array.
- Keep your response conversational but brief.

Respond with ONLY valid JSON, no markdown code fences.`
}

// ── API Call ──

/**
 * Send a refinement request to Gemini and parse the response.
 */
export async function refineClipPlan(
  userMessage: string,
  currentPlan: ClipPlan,
  chatHistory: ChatMessage[],
): Promise<ChatRefineResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const prompt = buildRefinePrompt(userMessage, currentPlan, chatHistory)

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  }

  const res = await fetch(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    },
  )

  if (!res.ok) {
    const errorText = await res.text()
    logger.error('[chatRefiner] Gemini API error:', errorText)
    throw new Error(`Gemini API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  let parsed: { response: string; diff: Partial<ClipPlan>; changesSummary: string[] }
  try {
    parsed = JSON.parse(text)
  } catch {
    logger.error('[chatRefiner] Failed to parse Gemini response:', text)
    throw new Error('Failed to parse AI response')
  }

  const stepsToRerun = diffToSteps(parsed.diff)

  return {
    response: parsed.response || 'Changes applied.',
    diff: parsed.diff || {},
    stepsToRerun,
    changesSummary: parsed.changesSummary || [],
  }
}

/**
 * Apply a partial diff to an existing ClipPlan, producing a new merged plan.
 */
export function applyDiffToPlan(plan: ClipPlan, diff: Partial<ClipPlan>): ClipPlan {
  const merged = structuredClone(plan)

  if (diff.canvas) Object.assign(merged.canvas, diff.canvas)
  if (diff.background) Object.assign(merged.background, diff.background)
  if (diff.characters) merged.characters = diff.characters
  if (diff.dialogue) merged.dialogue = diff.dialogue
  if (diff.textOverlays) merged.textOverlays = diff.textOverlays
  if (diff.shapes) merged.shapes = diff.shapes
  if (diff.htmlTemplates) merged.htmlTemplates = diff.htmlTemplates
  if (diff.svgObjects) merged.svgObjects = diff.svgObjects
  if (diff.stockMedia) merged.stockMedia = diff.stockMedia
  if (diff.captions) Object.assign(merged.captions, diff.captions)
  if (diff.camera) merged.camera = diff.camera
  if (diff.cameraDirectives) merged.cameraDirectives = diff.cameraDirectives
  if (diff.soundEffects) merged.soundEffects = diff.soundEffects
  if (diff.language) merged.language = diff.language

  return merged
}
