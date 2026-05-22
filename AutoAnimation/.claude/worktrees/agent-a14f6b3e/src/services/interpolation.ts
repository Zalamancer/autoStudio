import type { PropertyKeyframe, EasingType, CubicBezierParams } from '@/types/keyframes'
import { Easing } from '@/engine/easing'

// ---------------------------------------------------------------------------
// Math helpers (previously in boneInterpolation.ts)
// ---------------------------------------------------------------------------

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Angle-aware linear interpolation (shortest path, wraps around 360) */
export function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 180) % 360 + 360) % 360 - 180
  return a + diff * t
}

/** Evaluate a cubic bezier curve at parameter t */
function cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
  // Simple iterative approximation
  const epsilon = 0.0001
  let low = 0
  let high = 1
  let mid = t

  for (let i = 0; i < 20; i++) {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx

    const x = ((ax * mid + bx) * mid + cx) * mid

    if (Math.abs(x - t) < epsilon) break

    if (x < t) {
      low = mid
    } else {
      high = mid
    }
    mid = (low + high) / 2
  }

  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  return ((ay * mid + by) * mid + cy) * mid
}

/**
 * Apply an easing function to a linear parameter t (0..1).
 * Returns the eased parameter in the range 0..1.
 */
export function applyEasing(
  t: number,
  easingType: EasingType,
  bezierParams?: CubicBezierParams
): number {
  if (t <= 0) return 0
  if (t >= 1) return 1

  switch (easingType) {
    case 'linear':
      return t
    case 'ease-in':
      return t * t
    case 'ease-out':
      return 1 - (1 - t) * (1 - t)
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
    case 'cubic-bezier':
      if (bezierParams) {
        return cubicBezier(t, bezierParams.x1, bezierParams.y1, bezierParams.x2, bezierParams.y2)
      }
      return t
    // Extended easing types
    case 'spring-light':
      return Easing.springLight(t)
    case 'spring-medium':
      return Easing.springMedium(t)
    case 'spring-heavy':
      return Easing.springHeavy(t)
    case 'elastic-out':
      return Easing.elasticOut(t)
    case 'elastic-in-out':
      return Easing.elasticInOut(t)
    case 'bounce-out':
      return Easing.bounceOut(t)
    case 'bounce-in':
      return Easing.bounceIn(t)
    case 'back-out':
      return Easing.backOut(t)
    case 'back-in':
      return Easing.backIn(t)
    case 'expo-out':
      return Easing.expoOut(t)
    case 'expo-in':
      return Easing.expoIn(t)
    case 'circ-out':
      return Easing.circOut(t)
    case 'circ-in':
      return Easing.circIn(t)
    case 'sine-out':
      return Easing.sineOut(t)
    case 'sine-in':
      return Easing.sineIn(t)
    case 'snappy':
      return Easing.snappy(t)
    case 'material':
      return Easing.material(t)
    default:
      return t
  }
}

// ---------------------------------------------------------------------------
// Keyframe Interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolate a value from a sorted array of property keyframes at a given frame.
 * Returns undefined if no keyframes exist.
 * Before the first keyframe, holds the first value.
 * After the last keyframe, holds the last value.
 */
export function interpolatePropertyKeyframes(
  keyframes: PropertyKeyframe[],
  frame: number,
  isAngle: boolean = false
): number | undefined {
  if (keyframes.length === 0) return undefined
  if (keyframes.length === 1) return keyframes[0].value

  let isSorted = true
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (keyframes[i].frame > keyframes[i + 1].frame) {
      isSorted = false
      break
    }
  }
  const sorted = isSorted
    ? keyframes
    : [...keyframes].sort((a, b) => a.frame - b.frame)

  // Before first keyframe: hold first value
  if (frame <= sorted[0].frame) return sorted[0].value

  // After last keyframe: hold last value
  if (frame >= sorted[sorted.length - 1].frame) return sorted[sorted.length - 1].value

  // Find surrounding keyframes via binary search
  let lo = 0
  let hi = sorted.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].frame <= frame) {
      lo = mid
    } else {
      hi = mid
    }
  }

  const prev = sorted[lo]
  const next = sorted[hi]

  const range = next.frame - prev.frame
  let t = range > 0 ? (frame - prev.frame) / range : 0

  // Apply easing from the prev keyframe
  t = applyEasing(t, prev.easing, prev.bezierParams)

  return isAngle ? lerpAngle(prev.value, next.value, t) : lerp(prev.value, next.value, t)
}
