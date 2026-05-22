/**
 * SVG Scene Generator
 *
 * Generates full SVG scene backgrounds (cityscapes, nature, abstract, etc.)
 * using Gemini AI. Unlike the icon generator in svgObjectAnimation.ts which
 * produces single small icons, this generates multi-element scenes that fill
 * the entire canvas and serve as animated backgrounds.
 *
 * Supports:
 * - Full scene illustrations (cityscape, forest, underwater, space, etc.)
 * - Animated scene elements (clouds drifting, waves, twinkling stars)
 * - Style-consistent scene generation matching a visual theme
 * - Layer-based scene composition for parallax effects
 */

import type { SVGObjectDefinition } from '@/types/svgObjects'
import { withCreditGate } from './creditGate'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Types ──

export interface SVGSceneRequest {
  /** Description of the scene to generate */
  prompt: string
  /** Canvas width */
  width?: number
  /** Canvas height */
  height?: number
  /** Visual style to match */
  style?: SVGSceneStyle
  /** Time of day affects lighting/colors */
  timeOfDay?: 'day' | 'night' | 'sunset' | 'dawn'
  /** Whether to include CSS animation in the SVG */
  animated?: boolean
  /** Number of depth layers for parallax (1-5) */
  layers?: number
  /** Color palette to use (hex colors) */
  palette?: string[]
}

export type SVGSceneStyle =
  | 'flat'
  | 'geometric'
  | 'minimalist'
  | 'illustrated'
  | 'abstract'
  | 'retro'
  | 'neon'
  | 'watercolor'
  | 'lineart'
  | 'isometric'

export interface SVGSceneResult {
  /** Array of scene layer objects (back to front) */
  objects: SVGObjectDefinition[]
  /** Background color */
  background: string
  width: number
  height: number
  /** Token usage from generation */
  tokenUsage?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }
}

// ── Constants ──

const PROXY_MODEL = 'gemini-2.5-pro'

const SCENE_SYSTEM_PROMPT = `You are an expert SVG scene illustrator. Generate a COMPLETE scene background with multiple layered elements.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "background": "#hexColor",
  "objects": [
    {
      "name": "layer_name",
      "zIndex": 0,
      "defaultColors": { "colorSlot1": "#hex", "colorSlot2": "#hex" },
      "svgMarkup": "<g>...SVG content...</g>",
      "keyframes": [{ "time": 0 }]
    }
  ]
}

SVG SCENE RULES:
- Generate 3-7 objects, each as a separate layer (background → midground → foreground)
- Each object is a SINGLE <g> element
- Fill the ENTIRE canvas — this is a background scene, not an icon
- Use {{colorName}} placeholders for ALL colors (e.g. fill="{{sky}}", stroke="{{outline}}")
- Use standard SVG elements: rect, circle, ellipse, path, polygon, polyline, line, g, defs, linearGradient, radialGradient, clipPath, mask, pattern
- NO external resources, images, or URLs
- NO <animate>, <animateTransform>, or CSS animations — animation is handled via keyframes
- Create depth through overlapping layers with different zIndex values
- zIndex 0 = furthest back (sky/gradient), higher = closer to viewer
- Make elements fill their intended area of the canvas
- Use 2-4 color slots per object for token efficiency
- Include gradient defs inside each <g> element that uses them (use unique IDs per object to avoid conflicts)
- Scale proportionally to the canvas dimensions provided
- Create visually rich, professional scenes with natural compositions`

// ── Scene style presets ──

const STYLE_HINTS: Record<SVGSceneStyle, string> = {
  flat: 'Flat design with solid colors, no gradients, clean geometric shapes.',
  geometric: 'Abstract geometric shapes, triangles, hexagons, clean lines.',
  minimalist: 'Very minimal elements, lots of negative space, subtle colors.',
  illustrated: 'Detailed illustration style with organic curves, varied shapes.',
  abstract: 'Abstract art with flowing forms, blended colors, artistic composition.',
  retro: 'Retro/vintage style with muted earth tones, halftone-like patterns.',
  neon: 'Dark background with bright neon-colored strokes and glows.',
  watercolor: 'Soft, blended edges simulating watercolor with overlapping translucent shapes.',
  lineart: 'Clean line art with minimal fills, expressive strokes.',
  isometric: 'Isometric 3D perspective, geometric buildings and objects.',
}

const TIME_HINTS: Record<string, string> = {
  day: 'Bright, warm lighting. Blue sky, bright colors.',
  night: 'Dark sky with stars or moon. Cool blue/purple tones. Glowing accents.',
  sunset: 'Warm orange/pink/purple gradient sky. Long shadows. Golden light.',
  dawn: 'Soft pastel colors. Muted blues transitioning to warm pinks. Gentle atmosphere.',
}

// ── Main API ──

export async function generateSVGScene(options: SVGSceneRequest): Promise<SVGSceneResult> {
  return withCreditGate('svg-object', async () => _generateSceneImpl(options))
}

async function _generateSceneImpl(options: SVGSceneRequest): Promise<SVGSceneResult> {
  const width = options.width || 1920
  const height = options.height || 1080
  const layers = Math.max(1, Math.min(5, options.layers || 3))

  const styleHint = options.style ? STYLE_HINTS[options.style] : ''
  const timeHint = options.timeOfDay ? TIME_HINTS[options.timeOfDay] : ''
  const paletteHint = options.palette?.length
    ? `Use this color palette as the foundation: ${options.palette.join(', ')}.`
    : ''

  const animHint = options.animated
    ? `Add subtle animation keyframes to 2-3 layers:
- Clouds or background elements: slow horizontal drift (translate x over time)
- Foreground elements: gentle sway or bob
- Use time 0 → 1 keyframes with smooth motion
Example: [{ "time": 0, "x": 0 }, { "time": 1, "x": 20 }] for slow rightward drift`
    : 'No animation needed — just use [{ "time": 0 }] for all keyframes.'

  const userPrompt = `Create a complete SVG scene: "${options.prompt}"
Canvas: ${width}x${height}px.
Layers: Generate ${layers} depth layers (back to front).
${styleHint ? `Style: ${styleHint}` : ''}
${timeHint ? `Lighting: ${timeHint}` : ''}
${paletteHint}
${animHint}
Use {{colorName}} placeholders for all fills and strokes.`

  console.log('[SVGScene] Generating scene:', options.prompt)

  let textContent: string
  let usageMetadata: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number } | undefined

  // Try Pro first, fallback to Flash
  try {
    const result = await _callGemini(apiKey, userPrompt, GEMINI_URL, true)
    textContent = result.textContent
    usageMetadata = result.usageMetadata
  } catch (firstError) {
    console.warn('[SVGScene] Pro failed, retrying with Flash:', (firstError as Error).message)
    try {
      const result = await _callGemini(apiKey, userPrompt, GEMINI_FLASH_URL, false)
      textContent = result.textContent
      usageMetadata = result.usageMetadata
    } catch (secondError) {
      console.error('[SVGScene] Flash fallback also failed:', (secondError as Error).message)
      throw firstError
    }
  }

  // Parse JSON
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  let parsed: { objects?: SVGObjectDefinition[]; background?: string }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[SVGScene] Failed to parse response:', cleaned.slice(0, 500))
    throw new Error('Failed to parse SVG scene response as JSON')
  }

  if (!parsed.objects || !Array.isArray(parsed.objects) || parsed.objects.length === 0) {
    throw new Error('SVG scene response contained no objects')
  }

  // Post-process objects
  const processedObjects: SVGObjectDefinition[] = parsed.objects.map((obj) => {
    const markup = (obj.svgMarkup || '').replace(/WIDTH/g, String(width)).replace(/HEIGHT/g, String(height))

    return {
      name: obj.name || 'unnamed_layer',
      zIndex: typeof obj.zIndex === 'number' ? obj.zIndex : 0,
      defaultColors: obj.defaultColors || {},
      svgMarkup: markup,
      keyframes: Array.isArray(obj.keyframes) ? obj.keyframes : [{ time: 0 }],
    }
  })

  console.log(
    '[SVGScene] Generated',
    processedObjects.length,
    'scene layers:',
    processedObjects.map((o) => o.name),
  )

  return {
    objects: processedObjects,
    background: parsed.background || '#1a1a2e',
    width,
    height,
    tokenUsage: usageMetadata,
  }
}

// ── Gemini API helper ──

async function _callGemini(
  apiKey: string,
  userPrompt: string,
  modelUrl: string,
  useJsonMode: boolean,
): Promise<{
  textContent: string
  usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }
}> {
  const requestBody: Record<string, unknown> = {
    system_instruction: {
      parts: [{ text: SCENE_SYSTEM_PROMPT }],
    },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 16384,
      ...(useJsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  const response = await callGeminiProxy(modelUrl, requestBody)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[SVGScene] API error:', response.status, errorText)
    throw new Error(`SVG scene generation failed: ${response.statusText}`)
  }

  const data = await response.json()
  const usageMetadata = data.usageMetadata as
    | { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
    | undefined
  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason as string | undefined
  const textContent = candidate?.content?.parts?.[0]?.text || ''

  if (!textContent) {
    if (finishReason === 'SAFETY') {
      throw new Error('Scene generation was blocked by safety filters. Try a different prompt.')
    }
    throw new Error(`Gemini returned empty response (finishReason: ${finishReason || 'unknown'})`)
  }

  return {
    textContent,
    usageMetadata: usageMetadata?.totalTokenCount
      ? {
          promptTokenCount: usageMetadata.promptTokenCount || 0,
          candidatesTokenCount: usageMetadata.candidatesTokenCount || 0,
          totalTokenCount: usageMetadata.totalTokenCount,
        }
      : undefined,
  }
}

// ── Procedural Scene Generators (no AI needed) ──

/**
 * Generate a procedural starfield background. No API call needed.
 */
export function generateStarfield(width: number, height: number, starCount = 120, seed = 42): SVGSceneResult {
  const rng = _seededRng(seed)
  const stars: string[] = []

  for (let i = 0; i < starCount; i++) {
    const x = rng() * width
    const y = rng() * height
    const r = 0.3 + rng() * 2
    const opacity = 0.3 + rng() * 0.7
    stars.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="{{starColor}}" opacity="${opacity.toFixed(2)}"/>`,
    )
  }

  return {
    objects: [
      {
        name: 'sky_gradient',
        zIndex: 0,
        defaultColors: { skyTop: '#0a0a2e', skyBottom: '#1a1a4e' },
        svgMarkup: `<g><defs><linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{{skyTop}}"/><stop offset="100%" stop-color="{{skyBottom}}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#sky-grad)"/></g>`,
        keyframes: [{ time: 0 }],
      },
      {
        name: 'stars',
        zIndex: 1,
        defaultColors: { starColor: '#ffffff' },
        svgMarkup: `<g>${stars.join('')}</g>`,
        keyframes: [
          { time: 0, opacity: 0.8 },
          { time: 0.5, opacity: 1 },
          { time: 1, opacity: 0.8 },
        ],
      },
    ],
    background: '#0a0a2e',
    width,
    height,
  }
}

/**
 * Generate a procedural gradient background. No API call needed.
 */
export function generateGradientBackground(
  width: number,
  height: number,
  colors: string[] = ['#667eea', '#764ba2'],
  angle = 135,
): SVGSceneResult {
  const radians = (angle * Math.PI) / 180
  const x1 = 50 + 50 * Math.cos(radians + Math.PI)
  const y1 = 50 + 50 * Math.sin(radians + Math.PI)
  const x2 = 50 + 50 * Math.cos(radians)
  const y2 = 50 + 50 * Math.sin(radians)

  const stops = colors
    .map((color, i) => {
      const offset = colors.length === 1 ? 0 : (i / (colors.length - 1)) * 100
      return `<stop offset="${offset}%" stop-color="${color}"/>`
    })
    .join('')

  return {
    objects: [
      {
        name: 'gradient_bg',
        zIndex: 0,
        defaultColors: Object.fromEntries(colors.map((c, i) => [`color${i}`, c])),
        svgMarkup: `<g><defs><linearGradient id="bg-grad" x1="${x1.toFixed(0)}%" y1="${y1.toFixed(0)}%" x2="${x2.toFixed(0)}%" y2="${y2.toFixed(0)}%">${stops}</linearGradient></defs><rect width="${width}" height="${height}" fill="url(#bg-grad)"/></g>`,
        keyframes: [{ time: 0 }],
      },
    ],
    background: colors[0],
    width,
    height,
  }
}

/**
 * Generate procedural mountain silhouette layers. No API call needed.
 */
export function generateMountainscape(width: number, height: number, layerCount = 4, seed = 42): SVGSceneResult {
  const rng = _seededRng(seed)
  const layerColors = [
    { name: 'skyTop', default: '#1a0533' },
    { name: 'skyBottom', default: '#4a1a6b' },
    { name: 'mountain1', default: '#2d1b4e' },
    { name: 'mountain2', default: '#3d2b5e' },
    { name: 'mountain3', default: '#4d3b6e' },
    { name: 'mountain4', default: '#5d4b7e' },
    { name: 'foreground', default: '#1a0e2e' },
  ]

  const objects: SVGObjectDefinition[] = []

  // Sky gradient layer
  objects.push({
    name: 'sky',
    zIndex: 0,
    defaultColors: { skyTop: layerColors[0].default, skyBottom: layerColors[1].default },
    svgMarkup: `<g><defs><linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{{skyTop}}"/><stop offset="100%" stop-color="{{skyBottom}}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#mt-sky)"/></g>`,
    keyframes: [{ time: 0 }],
  })

  // Mountain layers
  for (let layer = 0; layer < layerCount; layer++) {
    const baseY = height * (0.3 + layer * 0.15)
    const peakVariance = height * (0.2 - layer * 0.03)
    const colorIdx = 2 + layer
    const colorName = `mt${layer}`
    const colorDefault = layerColors[Math.min(colorIdx, layerColors.length - 1)].default

    // Generate mountain path
    const points: string[] = [`0,${height}`]
    const segWidth = width / (8 + layer * 2)

    for (let x = 0; x <= width; x += segWidth) {
      const peakHeight = baseY - peakVariance * (0.3 + rng() * 0.7)
      points.push(`${x.toFixed(0)},${peakHeight.toFixed(0)}`)
    }
    points.push(`${width},${height}`)

    const d = `M${points.join(' L')}Z`

    objects.push({
      name: `mountain_layer_${layer}`,
      zIndex: 1 + layer,
      defaultColors: { [colorName]: colorDefault },
      svgMarkup: `<g><path d="${d}" fill="{{${colorName}}}"/></g>`,
      keyframes:
        layer < 2
          ? [
              { time: 0, x: 0 },
              { time: 1, x: (layer + 1) * -3 },
            ]
          : [{ time: 0 }],
    })
  }

  return {
    objects,
    background: layerColors[0].default,
    width,
    height,
  }
}

// ── Seeded RNG helper ──

function _seededRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}
