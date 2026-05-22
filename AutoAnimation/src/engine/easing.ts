// Re-export core easing functions from @proanimate/core
export { Easing, getEasingByName } from '@proanimate/core'

// Web-only CSS easing utilities (not in core)
import type { EasingType, CubicBezierParams } from '@/types/keyframes'

// ── CSS Easing Export ────────────────────────────────────────────────

/**
 * Maps every EasingType to its CSS equivalent string.
 * Spring, elastic, and bounce types use the closest cubic-bezier approximation
 * with a comment indicating the original type.
 */
export const EASING_CSS_MAP: Record<string, string> = {
  'linear': 'linear',
  'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
  'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
  // Extended named easings
  'sine-in': 'cubic-bezier(0.47, 0, 0.745, 0.715)',
  'sine-out': 'cubic-bezier(0.39, 0.575, 0.565, 1)',
  'expo-in': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  'expo-out': 'cubic-bezier(0.19, 1, 0.22, 1)',
  'circ-in': 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  'circ-out': 'cubic-bezier(0.075, 0.82, 0.165, 1)',
  'back-in': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  'back-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  // Design system presets
  'material': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'snappy': 'cubic-bezier(0.55, 0.085, 0, 0.99)',
  // Spring/elastic/bounce — closest cubic-bezier approximations
  'spring-light': 'cubic-bezier(0.2, 0.8, 0.2, 1.2) /* spring-light approximation */',
  'spring-medium': 'cubic-bezier(0.15, 0.85, 0.15, 1.3) /* spring-medium approximation */',
  'spring-heavy': 'cubic-bezier(0.1, 0.9, 0.1, 1.4) /* spring-heavy approximation */',
  'elastic-out': 'cubic-bezier(0.64, 0.57, 0.67, 1.53) /* elastic-out approximation */',
  'elastic-in-out': 'cubic-bezier(0.68, -0.55, 0.27, 1.55) /* elastic-in-out approximation */',
  'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1) /* bounce-out approximation */',
  'bounce-in': 'cubic-bezier(0.36, 0, 0.66, -0.56) /* bounce-in approximation */',
}

/**
 * Convert an EasingType (and optional cubic-bezier params) to a valid CSS easing string.
 *
 * - For 'cubic-bezier' type with params: returns `cubic-bezier(x1, y1, x2, y2)`
 * - For 'cubic-bezier' type without params: falls back to 'ease'
 * - For named types: looks up in EASING_CSS_MAP
 * - Unknown types: returns 'ease'
 */
export function easingToCss(type: EasingType, bezierParams?: CubicBezierParams): string {
  if (type === 'cubic-bezier') {
    if (bezierParams) {
      return `cubic-bezier(${bezierParams.x1}, ${bezierParams.y1}, ${bezierParams.x2}, ${bezierParams.y2})`
    }
    return 'ease'
  }
  return EASING_CSS_MAP[type] ?? 'ease'
}
