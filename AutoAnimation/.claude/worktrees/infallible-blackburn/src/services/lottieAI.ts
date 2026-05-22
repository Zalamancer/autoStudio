/**
 * Lottie Animation Generation via Gemini 2.0 Flash
 *
 * Generates Lottie animations from text prompts using a simplified intermediate
 * schema that gets compiled to valid Lottie JSON via the helpers in lottieGenerators.ts.
 * Calls Gemini directly from the frontend — no backend server needed.
 */

import { withCreditGate } from './creditGate'
import {
  wrap,
  sv,
  anim,
  ellipseShape,
  rectShape,
  polystarShape,
  pathShape,
  fillStyle,
  strokeStyle,
  grp,
  shapeLayer,
  clampKeyframes,
} from '@/data/lottieGenerators'

// ── Types ──

export interface LottieGenerateOptions {
  prompt: string
  category?: 'background' | 'overlay' | 'transition'
  /** Canvas width (default 512) */
  width?: number
  /** Canvas height (default 512) */
  height?: number
  /** Duration in frames at 30fps (default 90 = 3s) */
  frames?: number
}

export interface LottieGenerateResult {
  animationData: object
  name: string
  category: 'background' | 'overlay' | 'transition'
  tags: string[]
}

/** Intermediate schema: what the AI returns */
interface AIAnimationPlan {
  name: string
  category: 'background' | 'overlay' | 'transition'
  tags: string[]
  canvas: { width: number; height: number; frames: number }
  layers: AILayer[]
}

interface AILayer {
  shapes: AIShape[]
  position?: AIKeyframed
  scale?: AIKeyframed
  rotation?: AIKeyframed
  opacity?: AIKeyframed
  anchor?: number[]
}

interface AIShape {
  type: 'ellipse' | 'rect' | 'star' | 'path'
  // ellipse / rect
  cx?: number
  cy?: number
  w?: number
  h?: number
  // rect only
  r?: number
  // star only
  outerR?: number
  innerR?: number
  points?: number
  // path only
  vertices?: number[][]
  inTangents?: number[][]
  outTangents?: number[][]
  closed?: boolean
  // styles
  fill?: { r: number; g: number; b: number; opacity?: number }
  stroke?: { r: number; g: number; b: number; width?: number; opacity?: number }
}

type AIKeyframed = number | number[] | Array<{ t: number; v: number | number[] }>

// ── Gemini API ──

const GEMINI_FLASH_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

const SYSTEM_PROMPT = `You are a motion graphics generator. Given a text description, produce a JSON animation plan using the schema below.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code fences):
{
  "name": "short_name",
  "category": "background" | "overlay" | "transition",
  "tags": ["tag1", "tag2"],
  "canvas": { "width": W, "height": H, "frames": TOTAL_FRAMES },
  "layers": [
    {
      "shapes": [
        {
          "type": "ellipse" | "rect" | "star" | "path",
          "cx": 0, "cy": 0, "w": 100, "h": 100,
          "r": 0,
          "outerR": 50, "innerR": 20, "points": 5,
          "vertices": [[x,y],...], "inTangents": [[x,y],...], "outTangents": [[x,y],...], "closed": true,
          "fill": { "r": 255, "g": 0, "b": 0, "opacity": 100 },
          "stroke": { "r": 0, "g": 0, "b": 0, "width": 2, "opacity": 100 }
        }
      ],
      "position": [256, 256, 0] | [{ "t": 0, "v": [256, 256, 0] }, { "t": 90, "v": [256, 400, 0] }],
      "scale": [100, 100, 100] | [{ "t": 0, "v": [100, 100, 100] }, { "t": 90, "v": [200, 200, 100] }],
      "rotation": 0 | [{ "t": 0, "v": 0 }, { "t": 90, "v": 360 }],
      "opacity": 100 | [{ "t": 0, "v": 0 }, { "t": 30, "v": 100 }],
      "anchor": [0, 0, 0]
    }
  ]
}

RULES:
- Canvas coordinate system: (0,0) is top-left. Center is (W/2, H/2).
- Position, scale, anchor are 3D arrays [x, y, z]. Use z=0 or z=100 for scale.
- Rotation and opacity are scalar numbers.
- Each property can be static (a single value) or animated (array of {t, v} keyframes).
- t = frame number (0-based). Keyframes must be in ascending order of t.
- Scale 100 = 100%. Use [100,100,100] for normal size.
- Opacity 0-100. Fill/stroke opacity 0-100.
- Colors are RGB 0-255.
- For star shapes: outerR is outer radius, innerR is inner radius, points is number of points.
- For path shapes: vertices, inTangents, outTangents are arrays of [x,y] pairs. Tangents are relative to vertices.
- Keep layers under 20 for performance. Use 3-12 layers for most animations.
- Make the animation loop seamlessly: first and last keyframes should match for looping animations.
- Create visually appealing motion: use easing, staggered timing, varied speeds.
- Use the full canvas space. Background animations should cover the entire canvas.
- Generate rich, creative animations with multiple moving elements.`

// ── Main entry point ──

export async function generateLottieFromPrompt(
  options: LottieGenerateOptions,
): Promise<LottieGenerateResult> {
  return withCreditGate('lottie-generate', () => _generateImpl(options))
}

async function _generateImpl(options: LottieGenerateOptions): Promise<LottieGenerateResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured (VITE_GEMINI_API_KEY)')

  const width = options.width ?? 512
  const height = options.height ?? 512
  const frames = options.frames ?? 90

  const categoryHint = options.category && options.category !== 'overlay'
    ? ` This should be a ${options.category}-style animation.`
    : ''

  const userPrompt = `Create a looping animation: "${options.prompt}"
Canvas: ${width}x${height}px, ${frames} frames at 30fps (${(frames / 30).toFixed(1)}s).${categoryHint}`

  console.log('[LottieAI] Generating:', options.prompt)

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  }

  const response = await fetch(`${GEMINI_FLASH_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[LottieAI] API error:', response.status, errorText)
    throw new Error(`Gemini Lottie generation failed: ${response.statusText}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason as string | undefined
  const textContent = candidate?.content?.parts?.[0]?.text || ''

  if (!textContent) {
    if (finishReason === 'SAFETY') {
      throw new Error('Generation was blocked by safety filters. Try a different prompt.')
    }
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Generation blocked: ${data.promptFeedback.blockReason}. Try a different prompt.`)
    }
    throw new Error(`Gemini returned empty response (finishReason: ${finishReason || 'unknown'})`)
  }

  // Parse JSON — strip markdown fences if present
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  let plan: AIAnimationPlan
  try {
    plan = JSON.parse(cleaned)
  } catch {
    console.error('[LottieAI] Failed to parse response:', cleaned.slice(0, 500))
    throw new Error('Failed to parse Gemini response as JSON')
  }

  if (!plan.layers || !Array.isArray(plan.layers) || plan.layers.length === 0) {
    throw new Error('Gemini response contained no animation layers')
  }

  // Apply defaults
  plan.canvas = {
    width: plan.canvas?.width ?? width,
    height: plan.canvas?.height ?? height,
    frames: plan.canvas?.frames ?? frames,
  }

  const animationData = compilePlanToLottie(plan)

  console.log('[LottieAI] Generated animation:', plan.name, `(${plan.layers.length} layers)`)

  return {
    animationData,
    name: plan.name || options.prompt.slice(0, 30),
    category: plan.category || options.category || 'overlay',
    tags: Array.isArray(plan.tags) ? plan.tags : [],
  }
}

// ── Compiler: AIAnimationPlan → Lottie JSON ──

function compilePlanToLottie(plan: AIAnimationPlan): object {
  const { width, height, frames } = plan.canvas

  const layers = plan.layers.map((layer, idx) => {
    // Build shapes
    const shapeItems: object[] = []

    for (const shape of layer.shapes) {
      // Add geometry
      switch (shape.type) {
        case 'ellipse':
          shapeItems.push(ellipseShape(shape.cx ?? 0, shape.cy ?? 0, shape.w ?? 100, shape.h ?? 100))
          break
        case 'rect':
          shapeItems.push(rectShape(shape.cx ?? 0, shape.cy ?? 0, shape.w ?? 100, shape.h ?? 100, shape.r ?? 0))
          break
        case 'star':
          shapeItems.push(polystarShape(shape.cx ?? 0, shape.cy ?? 0, shape.outerR ?? 50, shape.innerR ?? 20, shape.points ?? 5))
          break
        case 'path':
          if (shape.vertices && shape.inTangents && shape.outTangents) {
            shapeItems.push(pathShape(shape.vertices, shape.inTangents, shape.outTangents, shape.closed ?? false))
          }
          break
      }

      // Add fill
      if (shape.fill) {
        shapeItems.push(fillStyle(shape.fill.r, shape.fill.g, shape.fill.b, shape.fill.opacity ?? 100))
      }

      // Add stroke
      if (shape.stroke) {
        shapeItems.push(strokeStyle(shape.stroke.r, shape.stroke.g, shape.stroke.b, shape.stroke.width ?? 2, shape.stroke.opacity ?? 100))
      }
    }

    // Build layer keyframe properties
    const ks: { p?: object; s?: object; r?: object; o?: object; a?: object } = {}

    if (layer.position !== undefined) ks.p = resolveProperty(layer.position, frames)
    if (layer.scale !== undefined) ks.s = resolveProperty(layer.scale, frames)
    if (layer.rotation !== undefined) ks.r = resolveProperty(layer.rotation, frames)
    if (layer.opacity !== undefined) ks.o = resolveProperty(layer.opacity, frames)
    if (layer.anchor) ks.a = sv(layer.anchor)

    return shapeLayer(idx, [grp(shapeItems)], ks, frames)
  })

  return wrap(layers, { w: width, h: height, op: frames })
}

/** Convert an AI property (static or keyframed) to a Lottie property. */
function resolveProperty(prop: AIKeyframed, totalFrames: number): object {
  // Animated: array of keyframe objects with t and v
  if (Array.isArray(prop) && prop.length > 0 && typeof prop[0] === 'object' && 't' in (prop[0] as object)) {
    const frames = prop as Array<{ t: number; v: number | number[] }>
    return anim(clampKeyframes(frames, totalFrames))
  }

  // Static value (number or number[])
  return sv(prop as number | number[])
}
