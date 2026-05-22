/**
 * SVG Object Generation via Gemini 2.5 Pro
 *
 * Generates individual SVG objects (icons, symbols, assets) with animation
 * keyframes. Calls Gemini directly from the frontend — no backend server needed.
 */

import type { SVGObjectDefinition, GenerateObjectsResponse } from '@/types/svgObjects'
import { withCreditGate } from './creditGate'

export interface GenerateSVGObjectsRequest {
  prompt: string
  width?: number
  height?: number
}

const GEMINI_SVG_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'

const SVG_SYSTEM_PROMPT = `You are an expert SVG icon/symbol designer. Generate a SINGLE SVG object as a flat, clean icon.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "objects": [
    {
      "name": "object_name",
      "zIndex": 0,
      "defaultColors": { "primary": "#hexValue", "secondary": "#hexValue" },
      "svgMarkup": "<g>...SVG content...</g>",
      "keyframes": [{ "time": 0 }]
    }
  ],
  "background": "transparent"
}

SVG MARKUP RULES:
- The object must be a SINGLE <g> element containing the icon
- Design it centered in the canvas (use the WIDTH and HEIGHT provided)
- Use {{colorName}} placeholders for ALL colors (e.g. fill="{{primary}}", stroke="{{secondary}}")
- Use standard SVG: rect, circle, ellipse, path, polygon, polyline, line, text, g, defs, linearGradient, radialGradient
- NO external resources, images, or URLs
- NO <animate>, <animateTransform>, or CSS animations
- Keep it clean and iconic — sharp lines, clear shapes, professional design
- Fill most of the canvas area (use ~60-80% of the width/height provided)
- Scale the design proportionally to the canvas dimensions — use the full coordinate space
- Use 2-4 color slots maximum for token efficiency`

export async function generateSVGObjects(
  options: GenerateSVGObjectsRequest,
): Promise<GenerateObjectsResponse> {
  return withCreditGate('svg-object', async () => _generateSVGObjectsImpl(options))
}

const GEMINI_FLASH_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

async function _callGeminiForSVG(
  apiKey: string,
  userPrompt: string,
  modelUrl: string,
  useJsonMode: boolean,
): Promise<{ textContent: string; usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number } }> {
  const requestBody: Record<string, unknown> = {
    system_instruction: {
      parts: [{ text: SVG_SYSTEM_PROMPT }],
    },
    contents: [
      { parts: [{ text: userPrompt }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(useJsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  const response = await fetch(`${modelUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[SVG:Gemini] API error:', response.status, errorText)
    throw new Error(`Gemini SVG generation failed: ${response.statusText}`)
  }

  const data = await response.json()
  const usageMetadata = data.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined
  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason as string | undefined
  const textContent = candidate?.content?.parts?.[0]?.text || ''

  if (!textContent) {
    const safetyRatings = candidate?.safetyRatings || data.promptFeedback?.safetyRatings
    console.error('[SVG:Gemini] Empty response. finishReason:', finishReason, 'safetyRatings:', safetyRatings)
    if (finishReason === 'SAFETY') {
      throw new Error('SVG generation was blocked by safety filters. Try a different prompt.')
    }
    if (data.promptFeedback?.blockReason) {
      throw new Error(`SVG generation blocked: ${data.promptFeedback.blockReason}. Try a different prompt.`)
    }
    throw new Error(`Gemini returned empty response (finishReason: ${finishReason || 'unknown'})`)
  }

  return {
    textContent,
    usageMetadata: usageMetadata?.totalTokenCount
      ? { promptTokenCount: usageMetadata.promptTokenCount || 0, candidatesTokenCount: usageMetadata.candidatesTokenCount || 0, totalTokenCount: usageMetadata.totalTokenCount }
      : undefined,
  }
}

async function _generateSVGObjectsImpl(
  options: GenerateSVGObjectsRequest,
): Promise<GenerateObjectsResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured (VITE_GEMINI_API_KEY)')

  const width = options.width || 512
  const height = options.height || 512

  const userPrompt = `Create a single SVG icon: "${options.prompt}"
Canvas: ${width}x${height}px. Center the icon in this space. Use {{colorName}} placeholders for all colors.`

  console.log('[SVG:Gemini] Generating SVG object:', options.prompt)

  // Try Gemini 2.5 Pro with JSON mode first, then fallback to Flash without JSON mode
  let textContent: string
  let usageMetadata: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number } | undefined

  try {
    const result = await _callGeminiForSVG(apiKey, userPrompt, GEMINI_SVG_URL, true)
    textContent = result.textContent
    usageMetadata = result.usageMetadata
  } catch (firstError) {
    console.warn('[SVG:Gemini] 2.5 Pro JSON mode failed, retrying with Flash:', (firstError as Error).message)
    try {
      const result = await _callGeminiForSVG(apiKey, userPrompt, GEMINI_FLASH_URL, false)
      textContent = result.textContent
      usageMetadata = result.usageMetadata
    } catch (secondError) {
      console.error('[SVG:Gemini] Flash fallback also failed:', (secondError as Error).message)
      throw firstError
    }
  }

  // Parse JSON — strip markdown fences if present
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  let parsed: { objects?: SVGObjectDefinition[]; background?: string }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[SVG:Gemini] Failed to parse response:', cleaned.slice(0, 500))
    throw new Error('Failed to parse Gemini SVG response as JSON')
  }

  if (!parsed.objects || !Array.isArray(parsed.objects) || parsed.objects.length === 0) {
    throw new Error('Gemini SVG response contained no objects')
  }

  // Post-process: replace WIDTH/HEIGHT literals, validate markup
  const processedObjects: SVGObjectDefinition[] = parsed.objects.map((obj) => {
    const markup = (obj.svgMarkup || '')
      .replace(/WIDTH/g, String(width))
      .replace(/HEIGHT/g, String(height))

    return {
      name: obj.name || 'unnamed',
      zIndex: typeof obj.zIndex === 'number' ? obj.zIndex : 0,
      defaultColors: obj.defaultColors || {},
      svgMarkup: markup,
      keyframes: Array.isArray(obj.keyframes) ? obj.keyframes : [{ time: 0 }],
    }
  })

  const result: GenerateObjectsResponse = {
    objects: processedObjects,
    background: parsed.background || 'transparent',
    width,
    height,
    tokenUsage: usageMetadata,
  }

  console.log('[SVG:Gemini] Generated', result.objects.length, 'SVG object(s):', result.objects.map((o) => o.name))

  return result
}
