/**
 * AI Composition Advisor
 *
 * Uses Gemini to analyze the current composition and suggest improvements.
 * Inputs the list of elements with positions/sizes + aspect ratio.
 * Outputs repositioning suggestions with reasoning.
 */

import { getGeminiService, hasGeminiService } from './gemini'
import type { LayoutRect, LayoutSuggestion, CanvasDimensions } from './autoLayoutEngine'

export interface CompositionAdvice {
  suggestions: LayoutSuggestion[]
  overallScore: number // 1-10
  analysis: string
}

/**
 * Call Gemini to analyze the current composition and suggest improvements.
 * Returns repositioning suggestions with detailed reasoning.
 */
export async function getCompositionAdvice(
  elements: LayoutRect[],
  canvas: CanvasDimensions,
): Promise<CompositionAdvice> {
  if (!hasGeminiService()) {
    throw new Error('Gemini API key not configured. Please enter your API key in Settings.')
  }

  if (elements.length === 0) {
    return {
      suggestions: [],
      overallScore: 5,
      analysis: 'No elements on canvas to analyze.',
    }
  }

  const gemini = getGeminiService()

  const elementDescriptions = elements.map((el) => ({
    id: el.id,
    type: el.type,
    label: el.label,
    x: Math.round(el.x),
    y: Math.round(el.y),
    width: Math.round(el.width),
    height: Math.round(el.height),
    zIndex: el.zIndex,
  }))

  const prompt = `You are a professional video composition and layout advisor for short-form social media content.

Analyze this canvas composition and suggest repositioning improvements.

Canvas: ${canvas.width}x${canvas.height} (${canvas.aspectRatio})
Safe zone: top 5-12%, bottom 8-15%, left/right 5% margins (for social media UI elements)

Current elements:
${JSON.stringify(elementDescriptions, null, 2)}

Evaluate the composition based on:
1. Rule of thirds alignment
2. Visual hierarchy (important elements should be prominent)
3. Balance and white space distribution
4. Overlap avoidance
5. Safe zone compliance (elements not hidden by social media UI)
6. Text readability (text should be large enough and not obscured)
7. Overall aesthetic harmony

Respond with valid JSON only:
{
  "overallScore": <1-10 integer>,
  "analysis": "<2-3 sentence analysis of the composition>",
  "suggestions": [
    {
      "elementId": "<element id>",
      "reason": "<why this change improves composition>",
      "suggestedX": <number>,
      "suggestedY": <number>,
      "suggestedWidth": <number or null if no change>,
      "suggestedHeight": <number or null if no change>
    }
  ]
}

Only suggest changes that meaningfully improve the composition. If the layout is already good, return an empty suggestions array with a high score.
Only respond with valid JSON, no other text.`

  const responseText = await gemini.generateContent(prompt)

  // Parse the response
  const cleaned = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    const elementMap = new Map(elements.map((el) => [el.id, el]))

    const suggestions: LayoutSuggestion[] = (parsed.suggestions || [])
      .filter((s: any) => elementMap.has(s.elementId))
      .map((s: any) => {
        const el = elementMap.get(s.elementId)!
        return {
          id: `ai-${s.elementId}-${Date.now()}`,
          elementId: s.elementId,
          elementType: el.type,
          label: el.label,
          reason: s.reason || 'AI-suggested improvement',
          original: {
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
          },
          suggested: {
            x: Math.round(s.suggestedX ?? el.x),
            y: Math.round(s.suggestedY ?? el.y),
            width: Math.round(s.suggestedWidth ?? el.width),
            height: Math.round(s.suggestedHeight ?? el.height),
          },
        }
      })

    return {
      suggestions,
      overallScore: Math.max(1, Math.min(10, parsed.overallScore || 5)),
      analysis: parsed.analysis || 'Composition analyzed.',
    }
  } catch (err) {
    console.warn('Failed to parse Gemini composition advice:', err)
    return {
      suggestions: [],
      overallScore: 5,
      analysis: 'Could not parse AI response. Try again.',
    }
  }
}
