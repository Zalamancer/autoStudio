/**
 * Orchestrator Refinement — accepts a natural language instruction and the current
 * ClipPlan, then asks Gemini to produce a partial diff of only the changed fields.
 * The diff is deep-merged back into the original plan so only affected steps need
 * to re-execute.
 */

import type { ClipPlan, TokenUsage } from '@/types/orchestrator'
import { withCreditGate } from '@/services/creditGate'

import { GEMINI_API_URL } from '../constants'

export interface RefinementResult {
  refinedPlan: ClipPlan
  changedSections: string[]
  tokenUsage: TokenUsage | null
}

/**
 * Build the list of orchestrator step types that need to re-execute based on
 * which top-level ClipPlan sections changed.
 */
export function buildDiffSteps(
  oldPlan: ClipPlan,
  newPlan: ClipPlan,
): string[] {
  const changed: string[] = []

  if (JSON.stringify(oldPlan.canvas) !== JSON.stringify(newPlan.canvas)) {
    changed.push('setup-canvas')
  }
  if (JSON.stringify(oldPlan.background) !== JSON.stringify(newPlan.background)) {
    changed.push('setup-background')
  }
  if (JSON.stringify(oldPlan.characters) !== JSON.stringify(newPlan.characters)) {
    changed.push('setup-characters')
  }
  if (JSON.stringify(oldPlan.dialogue) !== JSON.stringify(newPlan.dialogue)) {
    changed.push('generate-voices', 'setup-dialogue')
  }
  if (JSON.stringify(oldPlan.textOverlays) !== JSON.stringify(newPlan.textOverlays)) {
    changed.push('setup-text-overlays')
  }
  if (JSON.stringify(oldPlan.shapes) !== JSON.stringify(newPlan.shapes)) {
    changed.push('setup-shapes')
  }
  if (JSON.stringify(oldPlan.htmlTemplates) !== JSON.stringify(newPlan.htmlTemplates)) {
    changed.push('setup-html-templates')
  }
  if (JSON.stringify(oldPlan.svgObjects) !== JSON.stringify(newPlan.svgObjects)) {
    changed.push('generate-svg-objects')
  }
  if (JSON.stringify(oldPlan.stockMedia) !== JSON.stringify(newPlan.stockMedia)) {
    changed.push('setup-stock-media')
  }
  if (JSON.stringify(oldPlan.captions) !== JSON.stringify(newPlan.captions)) {
    changed.push('setup-captions')
  }
  if (JSON.stringify(oldPlan.camera) !== JSON.stringify(newPlan.camera) ||
      JSON.stringify(oldPlan.cameraDirectives) !== JSON.stringify(newPlan.cameraDirectives)) {
    changed.push('setup-camera')
  }
  if (JSON.stringify(oldPlan.soundEffects) !== JSON.stringify(newPlan.soundEffects)) {
    changed.push('setup-sound-effects')
  }

  // Always finalize timeline if anything changed
  if (changed.length > 0) {
    changed.push('finalize-timeline')
  }

  return [...new Set(changed)]
}

/**
 * Call Gemini with the current plan + user instruction → get a refined plan.
 */
export async function refinePlan(
  currentPlan: ClipPlan,
  userMessage: string,
): Promise<RefinementResult> {
  return withCreditGate('orchestrator-plan', () =>
    _refinePlanImpl(currentPlan, userMessage),
  )
}

async function _refinePlanImpl(
  currentPlan: ClipPlan,
  userMessage: string,
): Promise<RefinementResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const systemPrompt = `You are a video clip editor AI. You have a current ClipPlan (JSON) and the user wants to make a specific change.

IMPORTANT RULES:
1. Output a COMPLETE ClipPlan JSON (same schema as the input) with only the requested changes applied.
2. Preserve ALL fields that the user did NOT ask to change.
3. Only modify the sections relevant to the user's request.
4. Also output a "changedSections" array listing which top-level keys changed (e.g. ["textOverlays", "shapes"]).

Output format — valid JSON only, no markdown fences:
{
  "plan": { ... full ClipPlan ... },
  "changedSections": ["textOverlays", "captions"]
}`

  const userContent = `CURRENT PLAN:
${JSON.stringify(currentPlan, null, 2)}

USER REQUEST: "${userMessage}"

Apply the requested change and output the refined plan as JSON.`

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userContent }] },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  const tokenUsage: TokenUsage | null = data.usageMetadata
    ? {
        promptTokenCount: data.usageMetadata.promptTokenCount ?? 0,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount ?? 0,
        totalTokenCount: data.usageMetadata.totalTokenCount ?? 0,
      }
    : null

  const parsed = JSON.parse(text)
  const refinedPlan: ClipPlan = parsed.plan || parsed
  const changedSections: string[] = parsed.changedSections || []

  return { refinedPlan, changedSections, tokenUsage }
}
