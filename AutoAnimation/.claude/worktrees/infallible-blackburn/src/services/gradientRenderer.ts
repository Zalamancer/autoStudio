import type { GradientFill, GradientColorStop } from '@/types/gradient'
import type { KeyframeExportData } from '@/remotion/types'
import { interpolatePropertyKeyframes, lerp } from './interpolation'
import type { PropertyKeyframe, EasingType } from '@/types/keyframes'

type KeyframeIndex = Map<string, PropertyKeyframe[]>

/**
 * Read an animated value from keyframe data, falling back to a static value.
 */
function readAnimatedValue(
  property: string,
  staticValue: number,
  frame: number,
  kfIndex?: KeyframeIndex,
  keyframeData?: KeyframeExportData,
  objectId?: string,
): number {
  if (!objectId) return staticValue

  // Fast path: use pre-indexed map
  if (kfIndex) {
    const key = `shape:${objectId}:${property}`
    const kfs = kfIndex.get(key)
    if (kfs && kfs.length > 0) {
      const val = interpolatePropertyKeyframes(kfs, frame, property === 'gradientAngle')
      if (val !== undefined) return val
    }
    return staticValue
  }

  // Fallback: linear scan
  if (!keyframeData) return staticValue

  const track = keyframeData.tracks.find(
    t => t.objectType === 'shape' && t.objectId === objectId && t.property === property
  )
  if (!track || track.keyframes.length === 0) return staticValue

  const kfs: PropertyKeyframe[] = track.keyframes.map((kf, i) => ({
    id: `${i}`,
    frame: kf.frame,
    value: kf.value,
    easing: (kf.easing || 'linear') as EasingType,
    bezierParams: kf.bezierParams,
  }))

  const val = interpolatePropertyKeyframes(kfs, frame, property === 'gradientAngle')
  return val ?? staticValue
}

/**
 * Build a CanvasGradient from a GradientFill definition.
 * Reads keyframe-animated properties for the current frame.
 */
export function buildCanvasGradient(
  ctx: CanvasRenderingContext2D,
  fill: GradientFill,
  width: number,
  height: number,
  frame: number,
  kfIndex?: KeyframeIndex,
  keyframeData?: KeyframeExportData,
  objectId?: string,
): CanvasGradient {
  // Read animated values (fallback to static if no keyframes)
  const angle = readAnimatedValue('gradientAngle', fill.angle, frame, kfIndex, keyframeData, objectId)
  const centerX = readAnimatedValue('gradientCenterX', fill.centerX, frame, kfIndex, keyframeData, objectId)
  const centerY = readAnimatedValue('gradientCenterY', fill.centerY, frame, kfIndex, keyframeData, objectId)
  const radius = readAnimatedValue('gradientRadius', fill.radius, frame, kfIndex, keyframeData, objectId)

  let gradient: CanvasGradient

  switch (fill.type) {
    case 'linear': {
      const rad = (angle * Math.PI) / 180
      const halfDiag = Math.sqrt(width * width + height * height) / 2
      const dx = Math.cos(rad) * halfDiag
      const dy = Math.sin(rad) * halfDiag
      const cx = width / 2
      const cy = height / 2
      gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
      break
    }
    case 'radial': {
      const cx = width * centerX
      const cy = height * centerY
      const r = Math.max(width, height) * radius * 0.5
      gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      break
    }
    case 'conic': {
      const cx = width * centerX
      const cy = height * centerY
      const startAngle = ((fill.startAngle ?? 0) * Math.PI) / 180
      gradient = ctx.createConicGradient(startAngle, cx, cy)
      break
    }
  }

  // Add color stops (with animated positions)
  for (let i = 0; i < fill.stops.length; i++) {
    const stop = fill.stops[i]
    const animatedPos = readAnimatedValue(`gradientStop${i}Pos`, stop.position, frame, kfIndex, keyframeData, objectId)
    gradient.addColorStop(Math.max(0, Math.min(1, animatedPos)), stop.color)
  }

  return gradient
}

/**
 * Parse a hex color to RGB components.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const fullHex = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  return [
    parseInt(fullHex.slice(0, 2), 16),
    parseInt(fullHex.slice(2, 4), 16),
    parseInt(fullHex.slice(4, 6), 16),
  ]
}

/**
 * Convert RGB components to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')
}

/**
 * Linearly interpolate between two hex colors.
 */
export function lerpColor(colorA: string, colorB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(colorA)
  const [r2, g2, b2] = hexToRgb(colorB)
  return rgbToHex(
    lerp(r1, r2, t),
    lerp(g1, g2, t),
    lerp(b1, b2, t),
  )
}

/**
 * Interpolate between two gradient states for smooth transitions.
 */
export function lerpGradientStops(
  stopsA: GradientColorStop[],
  stopsB: GradientColorStop[],
  t: number,
): GradientColorStop[] {
  const count = Math.min(stopsA.length, stopsB.length)
  const result: GradientColorStop[] = []

  for (let i = 0; i < count; i++) {
    result.push({
      id: stopsA[i].id,
      color: lerpColor(stopsA[i].color, stopsB[i].color, t),
      position: lerp(stopsA[i].position, stopsB[i].position, t),
    })
  }

  return result
}
