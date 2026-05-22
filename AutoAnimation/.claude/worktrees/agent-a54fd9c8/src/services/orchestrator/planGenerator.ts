/**
 * Orchestrator Plan Generator — calls Gemini API to generate a ClipPlan.
 */

import type { ClipPlan, TokenUsage, OrchestratorSettings, StockMediaRole, ViralScore } from '@/types/orchestrator'
import { sampleAnimations } from '@/data/sampleAnimations'
import { BUILTIN_TEMPLATES } from '@/data/builtinTemplates'
import { getAllCachedSummaries } from '@/services/templateAnalyzer'
import { withCreditGate } from '@/services/creditGate'
import { GEMINI_API_URL } from './constants'
import { buildPlanPrompt } from './planBuilder'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useRigStore } from '@/stores/useRigStore'
import type { SerializedRigData } from '@bonerigging/core'
import { getCachedRig } from '@/services/rigCache'

/**
 * Call Gemini to generate a ClipPlan from the user prompt.
 */
export async function generateClipPlan(
  userPrompt: string,
  context: {
    savedCharacterNames: string[]
    selectedCharacterNames?: string[]
    saved3DCharacterNames?: string[]
    selected3DCharacterNames?: string[]
    voiceNames: string[]
    settings?: OrchestratorSettings
  },
): Promise<{ plan: ClipPlan; tokenUsage: TokenUsage | null }> {
  return withCreditGate('orchestrator-plan', async () => _generateClipPlanImpl(userPrompt, context))
}

async function _generateClipPlanImpl(
  userPrompt: string,
  context: {
    savedCharacterNames: string[]
    selectedCharacterNames?: string[]
    saved3DCharacterNames?: string[]
    selected3DCharacterNames?: string[]
    voiceNames: string[]
    settings?: OrchestratorSettings
  },
): Promise<{ plan: ClipPlan; tokenUsage: TokenUsage | null }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const animationList = sampleAnimations.map((a) => ({
    name: a.name,
    category: a.category,
    tags: a.tags,
  }))

  const htmlTemplateList = BUILTIN_TEMPLATES.map((t) => ({
    id: t.id,
    title: t.title,
    tags: t.tags,
    category: t.category,
  }))

  // Build user-selected item constraints from settings
  const settings = context.settings
  const selectedItems = {
    animationNames: settings?.selectedAnimationIds?.length
      ? sampleAnimations.filter((a) => settings.selectedAnimationIds.includes(a.id)).map((a) => a.name)
      : [],
    templateIds: settings?.selectedHTMLTemplateIds || [],
    audioIds: settings?.selectedAudioIds || [],
    captionIds: settings?.selectedCaptionIds || [],
    collageIds: settings?.selectedCollageIds || [],
    aiAnimationIds: settings?.selectedAIAnimationIds || [],
  }

  const fieldSummaries = getAllCachedSummaries()

  // Collect rig animation names for characters that have rigs
  const rigAnimationsByCharacter: Record<string, string[]> = {}
  const savedChars = useSavedCharactersStore.getState().characters
  const rigState = useRigStore.getState()
  const allCharNames = [...(context.selectedCharacterNames || []), ...context.savedCharacterNames]
  for (const charName of allCharNames) {
    if (rigAnimationsByCharacter[charName]) continue
    const savedChar = savedChars.find((sc) => sc.name.toLowerCase() === charName.toLowerCase())
    if (!savedChar) continue

    // Check useRigStore for rig matching this character
    const bodySprites = savedChar.bodyParts?.body || []
    for (const [, rig] of Object.entries(rigState.rigs)) {
      if (!rig.boneriggingSerializedData) continue
      try {
        const parsed = JSON.parse(rig.boneriggingSerializedData) as SerializedRigData
        const srcUrl = parsed.sourceImageUrl || ''
        const matchByImage = srcUrl && bodySprites.includes(srcUrl)
        const matchByName =
          rig.name &&
          (rig.name.toLowerCase().includes(savedChar.name.toLowerCase()) ||
            savedChar.name.toLowerCase().includes(rig.name.toLowerCase()))
        if (matchByImage || matchByName) {
          if (parsed.animations && parsed.animations.length > 0) {
            rigAnimationsByCharacter[charName] = parsed.animations.map((a) => a.name)
          }
          break
        }
      } catch {
        /* ignore */
      }
    }

    // Fallback: check IndexedDB rig cache
    if (!rigAnimationsByCharacter[charName]) {
      try {
        const cached = await getCachedRig(savedChar.id)
        if (cached?.animations && cached.animations.length > 0) {
          rigAnimationsByCharacter[charName] = cached.animations.map((a) => a.name)
        }
      } catch {
        /* ignore */
      }
    }
  }

  const prompt = buildPlanPrompt(
    userPrompt,
    context.savedCharacterNames,
    context.selectedCharacterNames || [],
    context.voiceNames,
    animationList,
    htmlTemplateList,
    context.settings,
    selectedItems,
    context.saved3DCharacterNames || [],
    context.selected3DCharacterNames || [],
    fieldSummaries,
    rigAnimationsByCharacter,
  )

  // Build request body — optionally include Google Search grounding tool
  // When reference images are provided, use multimodal input (text + images)
  const refMedia = context.settings?.referenceMedia || []
  const parts: Array<Record<string, unknown>> = [{ text: prompt }]

  for (const ref of refMedia) {
    if (!ref.dataUrl) continue

    // Add role-specific instruction before each image
    const roleLabel =
      ref.role === 'style'
        ? 'REFERENCE (style): Match this visual style, color palette, and aesthetic'
        : ref.role === 'character'
          ? 'REFERENCE (character): Design characters to visually resemble this'
          : 'REFERENCE (scene): Use this as background/scene inspiration'
    parts.push({ text: roleLabel })

    // Extract base64 data from data URL (strip data:...;base64, prefix if present)
    const base64Data = ref.dataUrl.includes(',') ? ref.dataUrl.split(',')[1] : ref.dataUrl
    parts.push({
      inline_data: {
        mime_type: ref.mimeType,
        data: base64Data,
      },
    })

    if (ref.description) {
      parts.push({ text: `Description: ${ref.description}` })
    }
  }

  const requestBody: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  }

  if (context.settings?.useGoogleSearch) {
    requestBody.tools = [{ google_search: {} }]
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract token usage from Gemini response
  const usageMeta = data.usageMetadata
  const tokenUsage: TokenUsage | null = usageMeta
    ? {
        promptTokenCount: usageMeta.promptTokenCount ?? 0,
        candidatesTokenCount: usageMeta.candidatesTokenCount ?? 0,
        totalTokenCount: usageMeta.totalTokenCount ?? 0,
      }
    : null

  // Parse JSON — strip markdown code fences if present
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  let plan: ClipPlan
  try {
    plan = JSON.parse(cleaned)
  } catch (err) {
    throw new Error(
      `Failed to parse ClipPlan JSON from Gemini: ${err instanceof Error ? err.message : err}. Response starts with: "${cleaned.slice(0, 200)}"`,
    )
  }

  // Basic validation
  if (!plan.canvas || !plan.dialogue || !Array.isArray(plan.dialogue)) {
    throw new Error('Invalid plan structure from Gemini')
  }

  // Apply defaults — enforce settings values if provided, otherwise use Gemini's choices or fallbacks
  const settingsFps = context.settings?.fps && context.settings.fps > 0 ? context.settings.fps : 0
  const settingsDuration =
    context.settings?.durationSeconds && context.settings.durationSeconds > 0 ? context.settings.durationSeconds : 0
  plan.canvas.fps = settingsFps || plan.canvas.fps || 30
  plan.canvas.durationSeconds = settingsDuration || plan.canvas.durationSeconds || 15
  plan.canvas.aspectRatio = context.settings?.aspectRatio || plan.canvas.aspectRatio || '16:9'
  plan.characters = plan.characters || []
  plan.textOverlays = plan.textOverlays || []
  plan.shapes = plan.shapes || []
  plan.htmlTemplates = plan.htmlTemplates || []
  plan.svgObjects = plan.svgObjects || []
  plan.stockMedia = (plan.stockMedia || []).map((sm) => ({
    ...sm,
    // Backward compat: default role to 'overlay' if missing
    role: sm.role || ('overlay' as StockMediaRole),
  }))
  plan.captions = plan.captions || { style: 'word-by-word', position: 'bottom' }

  return { plan, tokenUsage }
}

/**
 * Score a clip plan for viral potential using Gemini.
 */
export async function scoreClipPlanForVirality(plan: ClipPlan, prompt: string): Promise<ViralScore> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const scoringPrompt = `Rate this video plan for viral potential on short-form platforms (TikTok/Reels/Shorts).

Plan: ${JSON.stringify(plan)}
Original prompt: "${prompt}"

Score 0-100 on these dimensions:
- hook: Does the first dialogue line grab attention immediately? (first 3 seconds)
- pacing: Are there enough visual changes, emotion shifts, and mode switches?
- trend: Does the content align with current viral content patterns?
- emotion: Does it evoke strong emotions (surprise, curiosity, humor, awe)?
- visual: Is there visual variety (multiple templates, stock media, SVG objects, transitions)?
- rewatch: Would someone watch again or share with others?

Return ONLY valid JSON (no markdown):
{ "overall": number, "dimensions": { "hook": number, "pacing": number, "trend": number, "emotion": number, "visual": number, "rewatch": number }, "suggestions": ["string improvement suggestions, max 5"] }`

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: scoringPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  })

  if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`)

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  try {
    return JSON.parse(cleaned) as ViralScore
  } catch (err) {
    throw new Error(
      `Failed to parse ViralScore JSON from Gemini: ${err instanceof Error ? err.message : err}. Response starts with: "${cleaned.slice(0, 200)}"`,
    )
  }
}

/**
 * Generate plan variations with different hooks, pacing, and visual approaches.
 */
export async function generatePlanVariations(
  originalPlan: ClipPlan,
  prompt: string,
  count: number = 2,
): Promise<ClipPlan[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const variationPrompt = `Given this original video plan, create ${count} variations. Each variation should keep the same core message/topic but vary significantly:

Variation A: Different opening hook + faster pacing (shorter dialogue lines, more visual changes)
${count >= 2 ? 'Variation B: Different visual approach (different template choices, different stock media, different emotion arc)' : ''}
${count >= 3 ? 'Variation C: Different emotion arc (e.g. start calm→build excitement vs start intense→calm resolve)' : ''}

Original plan: ${JSON.stringify(originalPlan)}
Original prompt: "${prompt}"

Return ONLY a valid JSON array of ${count} complete ClipPlan objects (no markdown). Each must be a complete valid plan with canvas, background, characters, dialogue, textOverlays, shapes, captions.`

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: variationPrompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
    }),
  })

  if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`)

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  let plans: ClipPlan[]
  try {
    plans = JSON.parse(cleaned) as ClipPlan[]
  } catch (err) {
    throw new Error(
      `Failed to parse plan variations JSON from Gemini: ${err instanceof Error ? err.message : err}. Response starts with: "${cleaned.slice(0, 200)}"`,
    )
  }

  // Validate each variation
  return plans
    .filter((p) => p.canvas && p.dialogue && Array.isArray(p.dialogue))
    .map((p) => ({
      ...p,
      characters: p.characters || [],
      textOverlays: p.textOverlays || [],
      shapes: p.shapes || [],
      captions: p.captions || { style: 'word-by-word', position: 'bottom' },
    }))
}
