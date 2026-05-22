/**
 * Declarative SVG composition engine.
 *
 * Interpolates keyframe-based animation transforms and composes SVG objects
 * into a complete SVG string. No per-frame JavaScript execution — just
 * lightweight keyframe interpolation + string composition.
 */

import type {
  SVGObject,
  SVGObjectKeyframe,
  SVGObjectComposition,
  ResolvedTransform,
} from '@/types/svgObjects'

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

function easeIn(t: number): number {
  return t * t
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function applyEasing(t: number, easing?: string): number {
  switch (easing) {
    case 'ease-in':
      return easeIn(t)
    case 'ease-out':
      return easeOut(t)
    case 'ease-in-out':
      return easeInOut(t)
    default:
      return t // linear
  }
}

// ---------------------------------------------------------------------------
// Keyframe interpolation
// ---------------------------------------------------------------------------

const DEFAULT_TRANSFORM: ResolvedTransform = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolate keyframes at time t (0-1) to produce a ResolvedTransform.
 */
export function interpolateKeyframes(
  keyframes: SVGObjectKeyframe[],
  t: number
): ResolvedTransform {
  if (keyframes.length === 0) return { ...DEFAULT_TRANSFORM }

  // Clamp t
  t = Math.max(0, Math.min(1, t))

  if (keyframes.length === 1) {
    const kf = keyframes[0]
    return {
      x: kf.x ?? 0,
      y: kf.y ?? 0,
      rotation: kf.rotation ?? 0,
      scaleX: kf.scaleX ?? 1,
      scaleY: kf.scaleY ?? 1,
      opacity: kf.opacity ?? 1,
    }
  }

  // Find surrounding keyframes
  let before = keyframes[0]
  let after = keyframes[keyframes.length - 1]

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      before = keyframes[i]
      after = keyframes[i + 1]
      break
    }
  }

  // If t is before first keyframe or after last, clamp to nearest
  if (t <= before.time) {
    return {
      x: before.x ?? 0,
      y: before.y ?? 0,
      rotation: before.rotation ?? 0,
      scaleX: before.scaleX ?? 1,
      scaleY: before.scaleY ?? 1,
      opacity: before.opacity ?? 1,
    }
  }

  if (t >= after.time) {
    return {
      x: after.x ?? 0,
      y: after.y ?? 0,
      rotation: after.rotation ?? 0,
      scaleX: after.scaleX ?? 1,
      scaleY: after.scaleY ?? 1,
      opacity: after.opacity ?? 1,
    }
  }

  // Calculate local interpolation factor with easing
  const range = after.time - before.time
  const rawT = range > 0 ? (t - before.time) / range : 0
  const easedT = applyEasing(rawT, before.easing)

  return {
    x: lerp(before.x ?? 0, after.x ?? 0, easedT),
    y: lerp(before.y ?? 0, after.y ?? 0, easedT),
    rotation: lerp(before.rotation ?? 0, after.rotation ?? 0, easedT),
    scaleX: lerp(before.scaleX ?? 1, after.scaleX ?? 1, easedT),
    scaleY: lerp(before.scaleY ?? 1, after.scaleY ?? 1, easedT),
    opacity: lerp(before.opacity ?? 1, after.opacity ?? 1, easedT),
  }
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Replace {{colorName}} placeholders in SVG markup with actual color values.
 */
export function resolveColors(
  svgMarkup: string,
  colors: Record<string, string>
): string {
  return svgMarkup.replace(/\{\{(\w+)\}\}/g, (_, key) => colors[key] || '#ff00ff')
}

// ---------------------------------------------------------------------------
// SVG composition
// ---------------------------------------------------------------------------

/**
 * Build a complete SVG string from all visible objects at the current frame.
 */
export function buildSVGString(
  composition: SVGObjectComposition,
  currentFrame: number
): string {
  const { width, height, background, objects } = composition

  // Sort objects by zIndex (lower first = further back)
  const sorted = [...objects]
    .filter((obj) => obj.visible && currentFrame >= obj.startFrame && currentFrame <= obj.endFrame)
    .sort((a, b) => a.zIndex - b.zIndex)

  // Build each object's transformed <g> element
  const groups = sorted.map((obj) => {
    // Resolve color placeholders
    const resolvedMarkup = resolveColors(obj.svgMarkup, obj.colors)

    // Calculate object-local time (0-1 within its start/end range)
    const objRange = obj.endFrame - obj.startFrame
    const objT = objRange > 0
      ? Math.max(0, Math.min(1, (currentFrame - obj.startFrame) / objRange))
      : 0

    // Interpolate keyframes
    const transform = interpolateKeyframes(obj.keyframes, objT)

    // Combine keyframe opacity with user opacity override
    const finalOpacity = transform.opacity * obj.opacity

    // Build transform string
    const parts: string[] = []
    if (transform.x !== 0 || transform.y !== 0) {
      parts.push(`translate(${transform.x.toFixed(1)}, ${transform.y.toFixed(1)})`)
    }
    if (transform.rotation !== 0) {
      parts.push(`rotate(${transform.rotation.toFixed(1)})`)
    }
    if (transform.scaleX !== 1 || transform.scaleY !== 1) {
      parts.push(`scale(${transform.scaleX.toFixed(3)}, ${transform.scaleY.toFixed(3)})`)
    }
    const transformAttr = parts.length > 0 ? ` transform="${parts.join(' ')}"` : ''
    const opacityAttr = finalOpacity < 1 ? ` opacity="${finalOpacity.toFixed(3)}"` : ''

    return `<g${transformAttr}${opacityAttr}>${resolvedMarkup}</g>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="${background}"/>
${groups.join('\n')}
</svg>`
}

/**
 * Deterministic pseudo-random hash from match index + seed, returns 0-1.
 */
function hashFromIndex(index: number, seed: number): number {
  let h = (index * 2654435761 + seed * 2246822519) >>> 0
  h = ((h ^ (h >>> 16)) * 0x45d9f3b) >>> 0
  h = ((h ^ (h >>> 16)) * 0x45d9f3b) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return (h & 0xffff) / 0xffff
}

/**
 * Replace stroke-width attributes with jittered values.
 * Each stroke in the SVG gets a different jitter based on its position + seed.
 */
export function applyStrokeJitter(markup: string, jitterAmount: number, seed: number): string {
  let matchIndex = 0
  return markup.replace(/stroke-width=["']([^"']+)["']/g, (match, value) => {
    const baseWidth = parseFloat(value)
    if (isNaN(baseWidth)) return match
    const jitter = (hashFromIndex(matchIndex++, seed) - 0.5) * jitterAmount
    const newWidth = Math.max(0.1, baseWidth + jitter)
    return `stroke-width="${newWidth.toFixed(2)}"`
  })
}

/**
 * Build an individual SVG string for a single object (used for per-object rendering).
 */
export function buildSingleObjectSVG(
  obj: SVGObject,
  compositionWidth: number,
  compositionHeight: number,
  currentFrame: number,
): string | null {
  if (!obj.visible || currentFrame < obj.startFrame || currentFrame > obj.endFrame) return null

  let resolvedMarkup = resolveColors(obj.svgMarkup, obj.colors)

  // Apply stroke width jitter when enabled
  if (obj.boilingLine?.enabled && obj.boilingLine.strokeJitter && obj.boilingLine.strokeJitter > 0) {
    const seed = Math.floor(currentFrame / (obj.boilingLine.frameHold || 2)) % 8
    resolvedMarkup = applyStrokeJitter(resolvedMarkup, obj.boilingLine.strokeJitter * 0.3, seed)
  }

  const objRange = obj.endFrame - obj.startFrame
  const objT = objRange > 0
    ? Math.max(0, Math.min(1, (currentFrame - obj.startFrame) / objRange))
    : 0

  const transform = interpolateKeyframes(obj.keyframes, objT)
  const finalOpacity = transform.opacity * obj.opacity

  const parts: string[] = []
  if (transform.x !== 0 || transform.y !== 0) {
    parts.push(`translate(${transform.x.toFixed(1)}, ${transform.y.toFixed(1)})`)
  }
  if (transform.rotation !== 0) {
    parts.push(`rotate(${transform.rotation.toFixed(1)})`)
  }
  if (transform.scaleX !== 1 || transform.scaleY !== 1) {
    parts.push(`scale(${transform.scaleX.toFixed(3)}, ${transform.scaleY.toFixed(3)})`)
  }
  const transformAttr = parts.length > 0 ? ` transform="${parts.join(' ')}"` : ''
  const opacityAttr = finalOpacity < 1 ? ` opacity="${finalOpacity.toFixed(3)}"` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${compositionWidth}" height="${compositionHeight}" viewBox="0 0 ${compositionWidth} ${compositionHeight}"><g${transformAttr}${opacityAttr}>${resolvedMarkup}</g></svg>`
}
